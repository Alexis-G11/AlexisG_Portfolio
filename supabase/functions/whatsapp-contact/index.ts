import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { handleRequest, type Store } from './handler.ts';
import type { CleanInput } from './validation.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false } },
);

const store: Store = {
  async consumeRateLimit(identifier, windowSeconds, maxPer, globalMax) {
    const { data, error } = await supabase.rpc('consume_contact_rate_limit', {
      p_identifier: identifier,
      p_window_seconds: windowSeconds,
      p_max_per_identifier: maxPer,
      p_global_max_per_hour: globalMax,
    });
    if (error) throw new Error(error.message);
    return data as 'ok' | 'client_limited' | 'global_limited';
  },

  async begin(input: CleanInput & { submissionId: string }) {
    const { data, error } = await supabase
      .from('contact_messages')
      .insert({
        name: input.name,
        email: input.email,
        message: input.message,
        delivery_status: 'pending',
        client_submission_id: input.submissionId,
      })
      .select('id')
      .single();

    if (!error && data) return { kind: 'created', id: data.id as string };

    if (error?.code === '23505') {
      const { data: existing, error: readError } = await supabase
        .from('contact_messages')
        .select('delivery_status')
        .eq('client_submission_id', input.submissionId)
        .single();
      if (readError || !existing) throw new Error(readError?.message ?? 'lookup failed');
      return { kind: 'existing', status: existing.delivery_status as string };
    }
    throw new Error(error?.message ?? 'insert failed');
  },

  async claimRetry(submissionId, input) {
    const { data, error } = await supabase
      .from('contact_messages')
      .update({
        name: input.name,
        email: input.email,
        message: input.message,
        delivery_status: 'pending',
        delivery_detail: null,
        updated_at: new Date().toISOString(),
      })
      .eq('client_submission_id', submissionId)
      .eq('delivery_status', 'failed')
      .select('id');
    if (error) throw new Error(error.message);
    return data && data.length === 1 ? { id: data[0].id as string } : null;
  },

  async finish(id, status, patch) {
    const { error } = await supabase
      .from('contact_messages')
      .update({
        delivery_status: status,
        whatsapp_message_id: patch.waId ?? null,
        delivery_detail: patch.detail ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) throw new Error(error.message);
  },
};

Deno.serve((req: Request) =>
  handleRequest(req, {
    env: (name) => Deno.env.get(name),
    fetch,
    store,
  }),
);
