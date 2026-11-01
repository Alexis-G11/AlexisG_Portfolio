/*
  WhatsApp Cloud API contact workflow support.

  Adds durable idempotency and delivery tracking to contact_messages, and
  provides a database-backed atomic rate limiter for the public Edge Function.
*/
ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS client_submission_id uuid,
  ADD COLUMN IF NOT EXISTS whatsapp_message_id text,
  ADD COLUMN IF NOT EXISTS delivery_detail text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_messages_submission_id
  ON public.contact_messages (client_submission_id)
  WHERE client_submission_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_messages_whatsapp_message_id
  ON public.contact_messages (whatsapp_message_id)
  WHERE whatsapp_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contact_messages_delivery_status
  ON public.contact_messages (delivery_status, updated_at DESC);

-- The Edge Function updates status after contacting Meta and on webhook receipts.
GRANT UPDATE ON public.contact_messages TO service_role;

CREATE OR REPLACE FUNCTION public.consume_contact_rate_limit(
  p_identifier text,
  p_window_seconds integer,
  p_max_per_identifier integer,
  p_global_max_per_hour integer
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_now timestamptz := clock_timestamp();
  v_client_count integer;
  v_global_count integer;
BEGIN
  IF p_identifier IS NULL OR length(p_identifier) = 0
     OR p_window_seconds < 1 OR p_max_per_identifier < 1
     OR p_global_max_per_hour < 1 THEN
    RAISE EXCEPTION 'Invalid rate-limit arguments';
  END IF;

  -- Serialize global and per-client checks to avoid concurrent requests
  -- exceeding either limit. Every caller takes locks in the same order.
  PERFORM pg_advisory_xact_lock(hashtextextended('contact-rate-limit:global', 0));
  PERFORM pg_advisory_xact_lock(hashtextextended('contact-rate-limit:' || p_identifier, 0));

  DELETE FROM public.contact_rate_limits
  WHERE created_at < v_now - interval '1 day';

  SELECT count(*)::integer
    INTO v_client_count
    FROM public.contact_rate_limits
   WHERE identifier = p_identifier
     AND created_at > v_now - make_interval(secs => p_window_seconds);

  IF v_client_count >= p_max_per_identifier THEN
    RETURN 'client_limited';
  END IF;

  SELECT count(*)::integer
    INTO v_global_count
    FROM public.contact_rate_limits
   WHERE created_at > v_now - interval '1 hour';

  IF v_global_count >= p_global_max_per_hour THEN
    RETURN 'global_limited';
  END IF;

  INSERT INTO public.contact_rate_limits (identifier, created_at)
  VALUES (p_identifier, v_now);

  RETURN 'ok';
END;
$function$;

REVOKE ALL ON FUNCTION public.consume_contact_rate_limit(text, integer, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_contact_rate_limit(text, integer, integer, integer)
  TO service_role;
