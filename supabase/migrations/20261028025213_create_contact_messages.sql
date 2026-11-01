/*
# Create contact_messages and contact_rate_limits tables

1. New Tables
- `contact_messages`: stores contact form submissions from the portfolio website.
  - id (uuid, PK)
  - name (text, visitor's name)
  - email (text, visitor's reply-to email)
  - message (text, message body)
  - delivery_status (text: 'pending' | 'sent' | 'failed')
  - created_at (timestamptz)
- `contact_rate_limits`: lightweight per-IP rate-limit tracking.
  - id (uuid, PK)
  - identifier (text, hashed IP or origin for rate-limiting)
  - created_at (timestamptz)
  - Unique index on (identifier, created_at) to enable count-based window queries.

2. Security
- RLS enabled on both tables.
- Only the service_role (used by the edge function) has INSERT/SELECT/DELETE.
- No anon or authenticated grants — visitors never touch these tables directly.
- The edge function validates, sanitizes, rate-limits, and inserts using the service role key.

3. Notes
- The contact form is public (no auth). All writes go through the edge function
  which uses SUPABASE_SERVICE_ROLE_KEY, bypassing RLS.
- Rate limiting: the edge function counts rows in contact_rate_limits for a given
  identifier within a rolling 15-minute window and rejects if over the limit.
- Old rate-limit rows are cleaned up by the edge function on each request.
*/

CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  delivery_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contact_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_rate_limits_identifier_created
  ON contact_rate_limits (identifier, created_at);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at
  ON contact_messages (created_at DESC);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_rate_limits ENABLE ROW LEVEL SECURITY;

GRANT INSERT, SELECT, DELETE ON contact_messages TO service_role;
GRANT INSERT, SELECT, DELETE ON contact_rate_limits TO service_role;
