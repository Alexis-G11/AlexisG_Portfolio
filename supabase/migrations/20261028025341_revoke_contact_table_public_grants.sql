/*
# Revoke default anon/authenticated grants on contact tables

The contact_messages and contact_rate_limits tables were granted
SELECT/INSERT/UPDATE/DELETE to anon and authenticated by Supabase
defaults. These tables should only be accessible via the service_role
(used by the edge function). RLS is enabled with no policies, so anon/
authenticated access is already blocked — this removes the unnecessary
grants for cleanliness.
*/

REVOKE SELECT, INSERT, UPDATE, DELETE ON contact_messages FROM anon, authenticated;
REVOKE SELECT, INSERT, UPDATE, DELETE ON contact_rate_limits FROM anon, authenticated;
