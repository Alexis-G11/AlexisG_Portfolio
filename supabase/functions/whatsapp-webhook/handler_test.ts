import { handleWebhook, signBody, type WebhookStore } from './handler.ts';

function eq(a: unknown, e: unknown, m = '') {
  if (JSON.stringify(a) !== JSON.stringify(e)) throw new Error(`${m} expected ${JSON.stringify(e)} got ${JSON.stringify(a)}`);
}

const env = (n: string) =>
  ({ WHATSAPP_APP_SECRET: 'appsecret', WHATSAPP_WEBHOOK_VERIFY_TOKEN: 'vt' } as Record<string, string>)[n];

function deps() {
  const applied: unknown[] = [];
  const store: WebhookStore = {
    applyStatus: (id, status, detail) => {
      applied.push([id, status, detail]);
      return Promise.resolve();
    },
  };
  return { applied, d: { env, store, log: () => {} } };
}

const payload = (statuses: unknown[]) =>
  JSON.stringify({ entry: [{ changes: [{ value: { statuses } }] }] });

async function signed(body: string, secret = 'appsecret') {
  return new Request('https://fn.local/', {
    method: 'POST',
    headers: { 'x-hub-signature-256': await signBody(secret, body) },
    body,
  });
}

Deno.test('GET verification succeeds with the right token and echoes the challenge', async () => {
  const { d } = deps();
  const res = await handleWebhook(
    new Request('https://fn.local/?hub.mode=subscribe&hub.verify_token=vt&hub.challenge=12345'),
    d,
  );
  eq(res.status, 200);
  eq(await res.text(), '12345');
});

Deno.test('GET verification fails with a wrong token', async () => {
  const { d } = deps();
  const res = await handleWebhook(
    new Request('https://fn.local/?hub.mode=subscribe&hub.verify_token=nope&hub.challenge=1'),
    d,
  );
  eq(res.status, 403);
});

Deno.test('POST with valid signature applies delivered and failed statuses', async () => {
  const { d, applied } = deps();
  const body = payload([
    { id: 'wamid.A', status: 'delivered' },
    { id: 'wamid.B', status: 'failed', errors: [{ code: 131047 }] },
    { id: 'wamid.C', status: 'deleted' },
  ]);
  const res = await handleWebhook(await signed(body), d);
  eq(res.status, 200);
  eq(applied, [
    ['wamid.A', 'delivered', undefined],
    ['wamid.B', 'failed', 'meta_status_131047'],
  ]);
});

Deno.test('POST with a wrong signature is rejected and applies nothing', async () => {
  const { d, applied } = deps();
  const res = await handleWebhook(await signed(payload([{ id: 'x', status: 'read' }]), 'wrong-secret'), d);
  eq(res.status, 401);
  eq(applied, []);
});

Deno.test('POST without a signature is rejected', async () => {
  const { d } = deps();
  const res = await handleWebhook(new Request('https://fn.local/', { method: 'POST', body: '{}' }), d);
  eq(res.status, 401);
});
