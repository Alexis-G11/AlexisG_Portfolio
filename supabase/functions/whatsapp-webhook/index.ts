import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { handleWebhook, type WebhookStore } from './handler.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false } },
);

// Delivery progresses accepted → sent → delivered → read; never move backwards.
const RANK: Record<string, number> = {
  pending: 0,
  accepted: 1,
  unconfirmed: 1,
  sent: 2,
  delivered: 3,
  read: 4,
};

const store: WebhookStore = {
  async applyStatus(waId, status, detail) {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('id, delivery_status')
      .eq('whatsapp_message_id', waId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return; // Not one of ours (or not recorded yet).

    const current = data.delivery_status as string;
    if (status !== 'failed' && (RANK[current] ?? 0) >= RANK[status]) return;
    if (current === 'delivered' || current === 'read') {
      if (status === 'failed') return;
    }

    const { error: updateError } = await supabase
      .from('contact_messages')
      .update({
        delivery_status: status,
        delivery_detail: detail ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id);
    if (updateError) throw new Error(updateError.message);
  },
};

Deno.serve((req: Request) =>
  handleWebhook(req, { env: (n) => Deno.env.get(n), store }),
);
