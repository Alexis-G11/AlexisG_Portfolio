export interface WebhookStore {
  /** Apply a Meta status to the row with this WhatsApp message id. */
  applyStatus(
    waId: string,
    status: 'sent' | 'delivered' | 'read' | 'failed',
    detail?: string,
  ): Promise<void>;
}

export interface WebhookDeps {
  env: (name: string) => string | undefined;
  store: WebhookStore;
  log?: (...args: unknown[]) => void;
}

const MAX_BODY_BYTES = 256 * 1024;

function timingSafeEqual(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  if (ea.length !== eb.length) return false;
  let diff = 0;
  for (let i = 0; i < ea.length; i++) diff |= ea[i] ^ eb[i];
  return diff === 0;
}

export async function signBody(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return (
    'sha256=' +
    Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  );
}

export async function handleWebhook(req: Request, deps: WebhookDeps): Promise<Response> {
  const log = deps.log ?? console.error;
  const text = (body: string, status: number) =>
    new Response(body, { status, headers: { 'Content-Type': 'text/plain' } });

  // Meta's one-time endpoint verification.
  if (req.method === 'GET') {
    const verifyToken = deps.env('WHATSAPP_WEBHOOK_VERIFY_TOKEN');
    const url = new URL(req.url);
    if (
      verifyToken &&
      url.searchParams.get('hub.mode') === 'subscribe' &&
      timingSafeEqual(url.searchParams.get('hub.verify_token') ?? '', verifyToken)
    ) {
      return text(url.searchParams.get('hub.challenge') ?? '', 200);
    }
    return text('Forbidden', 403);
  }

  if (req.method !== 'POST') return text('Method not allowed', 405);

  const appSecret = deps.env('WHATSAPP_APP_SECRET');
  if (!appSecret) {
    log('whatsapp-webhook: WHATSAPP_APP_SECRET is not set.');
    return text('Not configured', 503);
  }

  const raw = await req.text();
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return text('Too large', 413);

  const expected = await signBody(appSecret, raw);
  const received = req.headers.get('x-hub-signature-256') ?? '';
  if (!timingSafeEqual(received, expected)) {
    return text('Invalid signature', 401);
  }

  interface StatusEvent {
    id?: unknown;
    status?: string;
    errors?: { code?: number }[];
  }
  interface WebhookPayload {
    entry?: { changes?: { value?: { statuses?: StatusEvent[] } }[] }[];
  }
  let payload: WebhookPayload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return text('Bad request', 400);
  }

  try {
    for (const entry of payload?.entry ?? []) {
      for (const change of entry?.changes ?? []) {
        for (const s of change?.value?.statuses ?? []) {
          const st = s.status;
          if (typeof s?.id !== 'string') continue;
          if (st !== 'sent' && st !== 'delivered' && st !== 'read' && st !== 'failed') continue;
          const code = s.errors?.[0]?.code;
          await deps.store.applyStatus(
            s.id,
            st,
            st === 'failed' ? `meta_status_${code ?? 'unknown'}` : undefined,
          );
        }
      }
    }
  } catch (err) {
    // Non-2xx makes Meta retry the batch; applyStatus is idempotent.
    log('whatsapp-webhook: could not record status:', (err as Error).message);
    return text('Error', 500);
  }

  return text('OK', 200);
}
