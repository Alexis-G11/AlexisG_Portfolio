// Run: deno test --allow-none supabase/functions/whatsapp-contact/handler_test.ts
// These tests drive the handler with a mocked Meta endpoint and an in-memory
// store. They verify our logic, NOT live WhatsApp delivery.
import { handleRequest, type Deps, type FinalStatus, type Store } from './handler.ts';

function eq(actual: unknown, expected: unknown, msg = '') {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${msg} expected ${e} but got ${a}`);
}
function ok(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const ORIGIN = 'https://alexis.example';
const SECRET_TOKEN = 'EAAG_super_secret_token_value';
const BASE_ENV: Record<string, string> = {
  WHATSAPP_ACCESS_TOKEN: SECRET_TOKEN,
  WHATSAPP_PHONE_NUMBER_ID: '111222333',
  WHATSAPP_RECIPIENT: '250798978475',
  WHATSAPP_TEMPLATE_NAME: 'portfolio_contact',
  WHATSAPP_TEMPLATE_LANGUAGE: 'en',
  ALLOWED_ORIGINS: ORIGIN,
};

interface Row {
  id: string;
  submissionId: string;
  status: string;
  detail?: string;
  waId?: string;
}

function memoryStore(opts: { limitPerClient?: number; failRateLimit?: boolean } = {}) {
  const rows: Row[] = [];
  let hits = 0;
  const store: Store = {
    consumeRateLimit(_id, _w, maxPer) {
      if (opts.failRateLimit) return Promise.reject(new Error('db down'));
      hits++;
      return Promise.resolve(hits > (opts.limitPerClient ?? maxPer) ? 'client_limited' : 'ok');
    },
    begin(input) {
      const existing = rows.find((r) => r.submissionId === input.submissionId);
      if (existing) return Promise.resolve({ kind: 'existing', status: existing.status });
      const row = { id: `row-${rows.length + 1}`, submissionId: input.submissionId, status: 'pending' };
      rows.push(row);
      return Promise.resolve({ kind: 'created', id: row.id });
    },
    claimRetry(submissionId) {
      const r = rows.find((x) => x.submissionId === submissionId && x.status === 'failed');
      if (!r) return Promise.resolve(null);
      r.status = 'pending';
      return Promise.resolve({ id: r.id });
    },
    finish(id, status: FinalStatus, patch) {
      const r = rows.find((x) => x.id === id)!;
      r.status = status;
      r.detail = patch.detail;
      r.waId = patch.waId;
      return Promise.resolve();
    },
  };
  return { store, rows };
}

type FetchCall = { url: string; init: RequestInit };

function setup(
  metaResponse: (call: FetchCall) => Response | Promise<Response>,
  env: Record<string, string | undefined> = {},
  storeOpts?: Parameters<typeof memoryStore>[0],
) {
  const calls: FetchCall[] = [];
  const { store, rows } = memoryStore(storeOpts);
  const logs: string[] = [];
  const deps: Deps = {
    env: (n) => ({ ...BASE_ENV, ...env })[n],
    fetch: ((url: string, init: RequestInit) => {
      const call = { url, init };
      calls.push(call);
      return Promise.resolve(metaResponse(call));
    }) as unknown as typeof fetch,
    store,
    log: (...a) => logs.push(a.join(' ')),
  };
  return { deps, calls, rows, logs };
}

const metaOk = () =>
  new Response(JSON.stringify({ messages: [{ id: 'wamid.ABC' }] }), { status: 200 });
const metaErr = (status: number, code: number) =>
  new Response(JSON.stringify({ error: { code, message: 'x', fbtrace_id: 'T1' } }), { status });

let n = 0;
const uuid = () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`;

function post(body: unknown, headers: Record<string, string> = {}) {
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  return new Request('https://fn.local/whatsapp-contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN, 'x-forwarded-for': '1.2.3.4', ...headers },
    body: text,
  });
}
const valid = (extra: Record<string, unknown> = {}) => ({
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  message: 'Hello Alexis,\nI would like to talk.',
  submissionId: uuid(),
  ...extra,
});

Deno.test('1 valid submission → accepted, correct Cloud API request', async () => {
  const t = setup(metaOk);
  const res = await handleRequest(post(valid()), t.deps);
  eq(res.status, 200);
  eq(await res.json(), { ok: true, status: 'accepted' });
  eq(t.calls.length, 1);
  eq(t.calls[0].url, 'https://graph.facebook.com/v26.0/111222333/messages');
  const sent = JSON.parse(t.calls[0].init.body as string);
  eq(sent.to, '250798978475');
  eq(sent.type, 'template');
  eq(sent.template.name, 'portfolio_contact');
  eq(sent.template.components[0].parameters.map((p: { text: string }) => p.text), [
    'Ada Lovelace',
    'ada@example.com',
    'Hello Alexis, / I would like to talk.', // newline flattened for the template
  ]);
  eq((t.calls[0].init.headers as Record<string, string>).Authorization, `Bearer ${SECRET_TOKEN}`);
  eq(t.rows[0].status, 'accepted');
  eq(t.rows[0].waId, 'wamid.ABC');
  eq(res.headers.get('access-control-allow-origin'), ORIGIN);
});

Deno.test('recipient cannot be chosen by the client', async () => {
  const t = setup(metaOk);
  await handleRequest(post(valid({ to: '15550001111', recipient: '15550001111' })), t.deps);
  eq(JSON.parse(t.calls[0].init.body as string).to, '250798978475');
});

for (const [label, patch, field] of [
  ['2 empty name', { name: '   ' }, 'name'],
  ['3 empty email', { email: '' }, 'email'],
  ['4 invalid email', { email: 'not-an-email' }, 'email'],
  ['5 empty message', { message: ' \n ' }, 'message'],
  ['6 oversized message', { message: 'x'.repeat(601) }, 'message'],
  ['non-string field', { name: { $gt: '' } }, 'name'],
] as const) {
  Deno.test(`${label} → 400 validation_error, nothing sent`, async () => {
    const t = setup(metaOk);
    const res = await handleRequest(post(valid(patch)), t.deps);
    eq(res.status, 400);
    const body = await res.json();
    eq(body.code, 'validation_error');
    ok(body.errors[field], `error for ${field}`);
    eq(t.calls.length, 0);
    eq(t.rows.length, 0);
  });
}

Deno.test('oversized request body → 413', async () => {
  const t = setup(metaOk);
  const res = await handleRequest(post(valid({ message: 'x'.repeat(20000) })), t.deps);
  eq(res.status, 413);
  eq(t.calls.length, 0);
});

Deno.test('7 honeypot → no send, no stored row', async () => {
  const t = setup(metaOk);
  const res = await handleRequest(post(valid({ website: 'http://spam.example' })), t.deps);
  eq(res.status, 200);
  eq(t.calls.length, 0);
  eq(t.rows.length, 0);
});

Deno.test('8a missing credentials → 503 not_configured, nothing sent, names only logged', async () => {
  const t = setup(metaOk, { WHATSAPP_ACCESS_TOKEN: undefined });
  const res = await handleRequest(post(valid()), t.deps);
  eq(res.status, 503);
  eq((await res.json()).code, 'not_configured');
  eq(t.calls.length, 0);
  ok(t.logs.join('\n').includes('WHATSAPP_ACCESS_TOKEN'), 'logs the missing name');
});

Deno.test('8b invalid credentials (Meta 401/190) → 502, token never leaked', async () => {
  const t = setup(() => metaErr(401, 190));
  const res = await handleRequest(post(valid()), t.deps);
  eq(res.status, 502);
  const text = await res.text();
  eq(JSON.parse(text).code, 'delivery_failed');
  ok(!text.includes(SECRET_TOKEN), 'response must not contain token');
  ok(!t.logs.join('\n').includes(SECRET_TOKEN), 'logs must not contain token');
  eq(t.rows[0].status, 'failed');
});

Deno.test('9 WhatsApp API rejection (131030 recipient not allowed) → failed, not success', async () => {
  const t = setup(() => metaErr(400, 131030));
  const res = await handleRequest(post(valid()), t.deps);
  eq(res.status, 502);
  eq((await res.json()).code, 'delivery_failed');
  eq(t.rows[0].status, 'failed');
  eq(t.rows[0].detail, 'meta_400_131030');
});

Deno.test('2xx without a message id is NOT treated as success', async () => {
  const t = setup(() => new Response('{}', { status: 200 }));
  const res = await handleRequest(post(valid()), t.deps);
  eq(res.status, 502);
  eq((await res.json()).code, 'unconfirmed');
});

Deno.test('Meta 429 → upstream_rate_limited', async () => {
  const t = setup(() => metaErr(429, 130429));
  const res = await handleRequest(post(valid()), t.deps);
  eq(res.status, 503);
  eq((await res.json()).code, 'upstream_rate_limited');
});

Deno.test('Meta 500 → unconfirmed (not success, not auto-retried)', async () => {
  const t = setup(() => metaErr(500, 2));
  const res = await handleRequest(post(valid()), t.deps);
  eq(res.status, 502);
  eq((await res.json()).code, 'unconfirmed');
  eq(t.calls.length, 1);
});

Deno.test('10 network timeout → 504 unconfirmed; same-id retry is NOT resent', async () => {
  const id = uuid();
  const t = setup(() => {
    throw new DOMException('timed out', 'TimeoutError');
  });
  const res = await handleRequest(post(valid({ submissionId: id })), t.deps);
  eq(res.status, 504);
  eq((await res.json()).code, 'unconfirmed');
  eq(t.rows[0].status, 'unconfirmed');
  eq(t.rows[0].detail, 'timeout');

  const retry = await handleRequest(post(valid({ submissionId: id })), t.deps);
  eq(retry.status, 409);
  eq(t.calls.length, 1, 'no duplicate send');
});

Deno.test('real timeout path: AbortSignal.timeout fires on a hanging request', async () => {
  const t = setup(() => new Response(null), { WHATSAPP_TIMEOUT_MS: '50' });
  t.deps.fetch = ((_u: string, init: RequestInit) =>
    new Promise((_res, rej) => {
      init.signal!.addEventListener('abort', () => rej(init.signal!.reason));
    })) as unknown as typeof fetch;
  const res = await handleRequest(post(valid()), t.deps);
  eq(res.status, 504);
  eq(t.rows[0].detail, 'timeout');
});

Deno.test('11a rate limited by the store → 429, nothing sent', async () => {
  const t = setup(metaOk, {}, { limitPerClient: 0 });
  const res = await handleRequest(post(valid()), t.deps);
  eq(res.status, 429);
  eq((await res.json()).code, 'rate_limited');
  eq(t.calls.length, 0);
});

Deno.test('11b 4th request in the window is limited (3 allowed)', async () => {
  const t = setup(metaOk);
  const codes: number[] = [];
  for (let i = 0; i < 4; i++) codes.push((await handleRequest(post(valid()), t.deps)).status);
  eq(codes, [200, 200, 200, 429]);
});

Deno.test('rate-limit store outage fails closed → 503, nothing sent', async () => {
  const t = setup(metaOk, {}, { failRateLimit: true });
  const res = await handleRequest(post(valid()), t.deps);
  eq(res.status, 503);
  eq(t.calls.length, 0);
});

Deno.test('12 duplicate submission id (double click) → one WhatsApp send', async () => {
  const id = uuid();
  const t = setup(metaOk);
  const a = await handleRequest(post(valid({ submissionId: id })), t.deps);
  const b = await handleRequest(post(valid({ submissionId: id })), t.deps);
  eq([a.status, b.status], [200, 200]);
  eq(t.calls.length, 1);
});

Deno.test('definitively failed send can be retried once with the same id', async () => {
  const id = uuid();
  let first = true;
  const t = setup(() => {
    if (first) {
      first = false;
      return metaErr(400, 131030);
    }
    return metaOk();
  });
  eq((await handleRequest(post(valid({ submissionId: id })), t.deps)).status, 502);
  eq((await handleRequest(post(valid({ submissionId: id })), t.deps)).status, 200);
  eq(t.calls.length, 2);
  eq(t.rows[0].status, 'accepted');
});

Deno.test('CORS: foreign origin rejected, no allow-origin header; preflight OK for ours', async () => {
  const t = setup(metaOk);
  const bad = await handleRequest(post(valid(), { Origin: 'https://evil.example' }), t.deps);
  eq(bad.status, 403);
  eq(bad.headers.get('access-control-allow-origin'), null);
  eq(t.calls.length, 0);

  const pre = await handleRequest(
    new Request('https://fn.local/', { method: 'OPTIONS', headers: { Origin: ORIGIN } }),
    t.deps,
  );
  eq(pre.status, 204);
  eq(pre.headers.get('access-control-allow-origin'), ORIGIN);
  ok((pre.headers.get('access-control-allow-headers') ?? '').toLowerCase().includes('apikey'), 'preflight must allow the Supabase apikey header');

  const preBad = await handleRequest(
    new Request('https://fn.local/', { method: 'OPTIONS', headers: { Origin: 'https://evil.example' } }),
    t.deps,
  );
  eq(preBad.status, 403);
});

Deno.test('GET → 405; non-JSON content type → 415; bad JSON → 400', async () => {
  const t = setup(metaOk);
  eq((await handleRequest(new Request('https://fn.local/', { method: 'GET', headers: { Origin: ORIGIN } }), t.deps)).status, 405);
  eq((await handleRequest(post('x', { 'Content-Type': 'text/plain' }), t.deps)).status, 415);
  eq((await handleRequest(post('{not json'), t.deps)).status, 400);
});
