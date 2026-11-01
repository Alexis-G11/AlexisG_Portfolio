import {
  isUuid,
  LIMITS,
  toTemplateParam,
  validateInput,
  type CleanInput,
} from './validation.ts';

export type FinalStatus = 'accepted' | 'failed' | 'unconfirmed';

export interface Store {
  consumeRateLimit(
    identifier: string,
    windowSeconds: number,
    maxPerIdentifier: number,
    globalMaxPerHour: number,
  ): Promise<'ok' | 'client_limited' | 'global_limited'>;
  /** Inserts a 'pending' row, or reports the status of the existing one. */
  begin(
    input: CleanInput & { submissionId: string },
  ): Promise<{ kind: 'created'; id: string } | { kind: 'existing'; status: string }>;
  /** Atomically moves a 'failed' row back to 'pending'. Null if someone else got it. */
  claimRetry(submissionId: string, input: CleanInput): Promise<{ id: string } | null>;
  finish(
    id: string,
    status: FinalStatus,
    patch: { waId?: string; detail?: string },
  ): Promise<void>;
}

export interface Deps {
  env: (name: string) => string | undefined;
  fetch: typeof fetch;
  store: Store;
  log?: (...args: unknown[]) => void;
}

const RATE_WINDOW_SECONDS = 15 * 60;
const RATE_MAX_PER_CLIENT = 3;
const RATE_MAX_GLOBAL_PER_HOUR = 20;
const DEFAULT_GRAPH_VERSION = 'v26.0';
const DEFAULT_TIMEOUT_MS = 10_000;

const REQUIRED_ENV = [
  'WHATSAPP_ACCESS_TOKEN',
  'WHATSAPP_PHONE_NUMBER_ID',
  'WHATSAPP_RECIPIENT',
  'WHATSAPP_TEMPLATE_NAME',
  'WHATSAPP_TEMPLATE_LANGUAGE',
  'ALLOWED_ORIGINS',
] as const;

// Meta error codes meaning "slow down / quota", not "your request is wrong".
const META_RATE_CODES = new Set([4, 17, 32, 613, 80007, 130429, 131056]);

function json(
  body: unknown,
  status: number,
  headers: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function fail(
  status: number,
  code: string,
  message: string,
  headers: Record<string, string>,
  extra: Record<string, unknown> = {},
) {
  return json({ ok: false, code, message, ...extra }, status, headers);
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function clientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function handleRequest(req: Request, deps: Deps): Promise<Response> {
  const log = deps.log ?? console.error;

  // ── CORS: only the configured portfolio origin(s) ─────────────────────
  const allowed = (deps.env('ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
  const origin = req.headers.get('origin')?.replace(/\/$/, '') ?? '';
  const originOk = origin !== '' && allowed.includes(origin);

  const cors: Record<string, string> = { Vary: 'Origin' };
  if (originOk) {
    cors['Access-Control-Allow-Origin'] = origin;
    cors['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    cors['Access-Control-Allow-Headers'] = 'authorization, x-client-info, apikey, content-type';
    cors['Access-Control-Max-Age'] = '600';
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: originOk ? 204 : 403, headers: cors });
  }
  if (req.method !== 'POST') {
    return fail(405, 'method_not_allowed', 'Method not allowed.', cors);
  }

  // ── Server configuration ──────────────────────────────────────────────
  const missing = REQUIRED_ENV.filter((n) => !deps.env(n));
  if (missing.length) {
    // Names only — never values.
    log('whatsapp-contact: missing configuration:', missing.join(', '));
    return fail(
      503,
      'not_configured',
      'Automatic WhatsApp delivery is not set up on the server.',
      cors,
    );
  }
  if (!originOk) {
    return fail(403, 'origin_not_allowed', 'Origin not allowed.', cors);
  }

  const recipient = deps.env('WHATSAPP_RECIPIENT')!.replace(/\D/g, '');
  if (!/^[1-9]\d{7,14}$/.test(recipient)) {
    log('whatsapp-contact: WHATSAPP_RECIPIENT is not a valid international number.');
    return fail(503, 'not_configured', 'Automatic WhatsApp delivery is not set up on the server.', cors);
  }

  // ── Body: size limit, JSON, shape ─────────────────────────────────────
  const declared = Number(req.headers.get('content-length') ?? '0');
  if (declared > LIMITS.body) {
    return fail(413, 'payload_too_large', 'Request is too large.', cors);
  }
  if (!(req.headers.get('content-type') ?? '').toLowerCase().includes('application/json')) {
    return fail(415, 'unsupported_media_type', 'Content-Type must be application/json.', cors);
  }
  const text = await req.text();
  if (new TextEncoder().encode(text).length > LIMITS.body) {
    return fail(413, 'payload_too_large', 'Request is too large.', cors);
  }
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return fail(400, 'invalid_json', 'Invalid request body.', cors);
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return fail(400, 'invalid_json', 'Invalid request body.', cors);
  }
  const body = raw as Record<string, unknown>;

  // ── Honeypot: real visitors never fill this. Nothing is sent. ─────────
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return json({ ok: true, status: 'accepted' }, 200, cors);
  }

  const parsed = validateInput(body);
  if (!parsed.value) {
    return fail(400, 'validation_error', 'Please check the highlighted fields.', cors, {
      errors: parsed.errors,
    });
  }
  if (!isUuid(body.submissionId)) {
    return fail(400, 'validation_error', 'Missing or invalid submission id.', cors);
  }
  const input = parsed.value;
  const submissionId = body.submissionId;

  // ── Durable, atomic rate limiting (fails closed) ──────────────────────
  const salt = deps.env('RATE_LIMIT_SALT') ?? '';
  const identifier = await sha256Hex(`${salt}:${clientIp(req)}`);
  let limit: Awaited<ReturnType<Store['consumeRateLimit']>>;
  try {
    limit = await deps.store.consumeRateLimit(
      identifier,
      RATE_WINDOW_SECONDS,
      RATE_MAX_PER_CLIENT,
      RATE_MAX_GLOBAL_PER_HOUR,
    );
  } catch (err) {
    log('whatsapp-contact: rate-limit store error:', (err as Error).message);
    return fail(503, 'unavailable', 'The service is temporarily unavailable. Please try again shortly.', cors);
  }
  if (limit !== 'ok') {
    return fail(
      429,
      'rate_limited',
      'Too many messages have been sent recently. Please try again later or use the email link.',
      { ...cors, 'Retry-After': String(RATE_WINDOW_SECONDS) },
    );
  }

  // ── Idempotency: one WhatsApp send per submission id ──────────────────
  let rowId: string;
  try {
    const begun = await deps.store.begin({ ...input, submissionId });
    if (begun.kind === 'created') {
      rowId = begun.id;
    } else if (['accepted', 'sent', 'delivered', 'read'].includes(begun.status)) {
      return json({ ok: true, status: 'accepted' }, 200, cors);
    } else if (begun.status === 'failed') {
      const claimed = await deps.store.claimRetry(submissionId, input);
      if (!claimed) {
        return fail(409, 'in_progress', 'This message is already being sent.', cors);
      }
      rowId = claimed.id;
    } else if (begun.status === 'unconfirmed') {
      return fail(
        409,
        'unconfirmed',
        'An earlier attempt may already have been delivered, so it was not sent again. Edit your message to send it again, or email me.',
        cors,
      );
    } else {
      return fail(409, 'in_progress', 'This message is already being sent.', cors);
    }
  } catch (err) {
    log('whatsapp-contact: store error:', (err as Error).message);
    return fail(503, 'unavailable', 'The service is temporarily unavailable. Please try again shortly.', cors);
  }

  // ── Send via the WhatsApp Cloud API (single attempt, no auto-retry) ───
  const version = deps.env('GRAPH_API_VERSION') || DEFAULT_GRAPH_VERSION;
  const timeoutMs = Number(deps.env('WHATSAPP_TIMEOUT_MS')) || DEFAULT_TIMEOUT_MS;
  const url = `https://graph.facebook.com/${version}/${deps.env('WHATSAPP_PHONE_NUMBER_ID')}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipient,
    type: 'template',
    template: {
      name: deps.env('WHATSAPP_TEMPLATE_NAME'),
      language: { code: deps.env('WHATSAPP_TEMPLATE_LANGUAGE') },
      components: [
        {
          type: 'body',
          parameters: [input.name, input.email, input.message].map((v) => ({
            type: 'text',
            text: toTemplateParam(v),
          })),
        },
      ],
    },
  };

  let res: Response;
  try {
    res = await deps.fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${deps.env('WHATSAPP_ACCESS_TOKEN')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    // Timeout or network failure: the request may or may not have been
    // processed, so never report success and never resend automatically.
    const name = (err as Error).name;
    log('whatsapp-contact: send did not complete:', name, 'submission', submissionId);
    await safeFinish(deps, rowId, 'unconfirmed', { detail: name === 'TimeoutError' ? 'timeout' : 'network' }, log);
    return fail(
      504,
      'unconfirmed',
      'We could not confirm whether your message was sent. Your text is still in the form. To avoid duplicates, check with me by email before sending it again.',
      cors,
    );
  }

  interface MetaResponse {
    messages?: { id?: string }[];
    error?: { code?: number; error_subcode?: number; fbtrace_id?: string };
  }
  let data: MetaResponse | null = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON body */
  }

  const waId: unknown = data?.messages?.[0]?.id;
  if (res.ok && typeof waId === 'string' && waId) {
    await safeFinish(deps, rowId, 'accepted', { waId }, log);
    return json({ ok: true, status: 'accepted' }, 200, cors);
  }

  const metaCode = Number(data?.error?.code) || 0;
  const detail = `meta_${res.status}${metaCode ? `_${metaCode}` : ''}`;
  log(
    'whatsapp-contact: Cloud API did not accept the message:',
    `http=${res.status}`,
    `code=${metaCode}`,
    `subcode=${data?.error?.error_subcode ?? ''}`,
    `trace=${data?.error?.fbtrace_id ?? ''}`,
  );
  if (res.status === 401 || metaCode === 190) {
    log('whatsapp-contact: WhatsApp access token was rejected — replace WHATSAPP_ACCESS_TOKEN.');
  }

  // 2xx without a message id, or 5xx: outcome unknown.
  if ((res.ok && !waId) || res.status >= 500) {
    await safeFinish(deps, rowId, 'unconfirmed', { detail }, log);
    return fail(
      502,
      'unconfirmed',
      'We could not confirm whether your message was sent. Your text is still in the form. To avoid duplicates, check with me by email before sending it again.',
      cors,
    );
  }

  await safeFinish(deps, rowId, 'failed', { detail }, log);
  if (res.status === 429 || META_RATE_CODES.has(metaCode)) {
    return fail(503, 'upstream_rate_limited', 'WhatsApp is limiting requests right now. Please try again in a few minutes.', cors);
  }
  return fail(502, 'delivery_failed', 'The message could not be sent to WhatsApp. Your text is still in the form.', cors);
}

async function safeFinish(
  deps: Deps,
  id: string,
  status: FinalStatus,
  patch: { waId?: string; detail?: string },
  log: (...a: unknown[]) => void,
) {
  try {
    await deps.store.finish(id, status, patch);
  } catch (err) {
    log('whatsapp-contact: could not record status:', (err as Error).message);
  }
}
