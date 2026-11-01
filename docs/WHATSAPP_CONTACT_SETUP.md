# WhatsApp contact form — setup and operations

The contact form has **two delivery modes. Exactly one is active**, chosen at build time by
`VITE_CONTACT_DELIVERY_MODE`:

| Mode | Value | What happens | Who presses Send? |
|---|---|---|---|
| Click-to-chat (default) | unset or `click-to-chat` | Opens `https://wa.me/250798978475?text=…` with the message pre-filled | **The visitor**, inside WhatsApp |
| Cloud API | `api` | Browser → `whatsapp-contact` Edge Function → WhatsApp Cloud API → your phone | Nobody (automatic) |

They are never combined, so a visitor can never produce two messages.

## What Meta's rules mean for you

- The Cloud API sends **from a WhatsApp Business number you register with Meta**, to a recipient. It cannot
  send *from* your personal number, and a number cannot message itself. You need a **separate sender number**
  that is not in use on the regular WhatsApp app (a new SIM, a landline, or a virtual number that can receive a
  verification code), or Meta's free **test number** for development.
- A website visitor has never messaged that business number, so there is no open 24-hour customer-service
  window. Free-form text would be rejected. The **only** message type that can reach you is a **pre-approved
  message template** (business-initiated). That is what the function sends.
- Business-initiated templates are billed per message by Meta (and Meta can reclassify a "Utility" template as
  "Marketing", which costs more). Check Meta's current pricing page and set a payment method.
- Consent: the recipient is **you**, so you are opting in to your own notifications.
- Test number limitation: Meta's test number can only message up to 5 recipient numbers you verify in the
  dashboard — add `250798978475` there. Confirm in your dashboard whether your own custom template can be used
  with the test number; if not, use `hello_world` only for connectivity testing.

## One-time setup in Meta

1. [developers.facebook.com](https://developers.facebook.com) → create an app (type **Business**) → add the
   **WhatsApp** product. This creates a WhatsApp Business Account (WABA).
2. Register your sender number (or use the test number) and note the **Phone number ID**
   (API Setup page). This is `WHATSAPP_PHONE_NUMBER_ID`. It is **not** the phone number itself.
3. Create a **permanent token**: Business Settings → Users → **System users** → add a system user →
   assign the app and WABA → generate a token with `whatsapp_business_messaging` and
   `whatsapp_business_management`. Temporary tokens from the API Setup page expire in ~24 h — do not use them
   in production. This is `WHATSAPP_ACCESS_TOKEN`.
4. Create the template in **WhatsApp Manager → Message templates**:
   - Category: **Utility**, Language: **English** (code `en`), Name: `portfolio_contact`
   - Body (exactly 3 variables, in this order; Meta typically rejects a body that starts or ends with a variable — if yours is rejected, adjust the wording):

     ```
     New message from your portfolio website.

     Name: {{1}}
     Email: {{2}}
     Message: {{3}}

     Please reply to the sender by email.
     ```
   - Wait for **Approved** status.
5. Confirm the current Graph API version in Meta's changelog. The function defaults to `v26.0`; override with
   `GRAPH_API_VERSION` if needed.

## Deploy the backend

```bash
cd project
supabase link --project-ref <your-project-ref>      # already linked in this repo

# Secrets (values from Meta; nothing here is committed)
supabase secrets set \
  WHATSAPP_ACCESS_TOKEN='<system-user token>' \
  WHATSAPP_PHONE_NUMBER_ID='<phone number id>' \
  WHATSAPP_RECIPIENT='250798978475' \
  WHATSAPP_TEMPLATE_NAME='portfolio_contact' \
  WHATSAPP_TEMPLATE_LANGUAGE='en' \
  ALLOWED_ORIGINS='https://<your-portfolio-domain>,http://localhost:5173' \
  RATE_LIMIT_SALT="$(openssl rand -hex 16)"

supabase db push                                    # applies 20261101100000_whatsapp_contact_production_support.sql
supabase functions deploy whatsapp-contact --no-verify-jwt
```

`--no-verify-jwt` matches `supabase/config.toml` (and the existing `contact` function): the form is public.
Protection comes from the origin allow-list, validation, the honeypot, a 3-per-15-min per-visitor limit,
a 20-per-hour global cap (bounds Meta cost), and the DB-backed idempotency key.

### Smoke test the deployed function (sends one real WhatsApp message)

```bash
curl -i https://<project-ref>.supabase.co/functions/v1/whatsapp-contact \
  -H 'Content-Type: application/json' -H 'Origin: https://<your-portfolio-domain>' \
  -d '{"name":"Test","email":"test@example.com","message":"Hello from curl","submissionId":"'"$(uuidgen)"'"}'
```

Expected: `200 {"ok":true,"status":"accepted"}` and a WhatsApp message on your phone.
Anything else: `supabase functions logs whatsapp-contact` (Meta error codes are logged; the token and message
bodies are not). Common ones: `190` token invalid/expired, `131030` recipient not allowed (test number),
`132001` template name/language not found or not approved, `132000` wrong number of variables.

### Turn on the API mode in the site

Set `VITE_CONTACT_DELIVERY_MODE=api` in your hosting provider's **build** environment and redeploy the
frontend. (For local dev, add it to `.env`, which this change did not touch.) Revert to `click-to-chat` at any
time to fall back.

## Optional: delivery receipts (accepted vs delivered)

"Accepted" only means Meta's API took the request. To record *sent / delivered / read / failed*:

```bash
supabase secrets set WHATSAPP_APP_SECRET='<app secret>' WHATSAPP_WEBHOOK_VERIFY_TOKEN='<random string>'
supabase functions deploy whatsapp-webhook --no-verify-jwt
```

In the Meta app → WhatsApp → **Configuration → Webhook**: callback URL
`https://<project-ref>.supabase.co/functions/v1/whatsapp-webhook`, verify token = the string above, then
subscribe to the **messages** field. Statuses land in `contact_messages.delivery_status`
(`accepted → sent → delivered → read`, or `failed` with the Meta code in `delivery_detail`). Check them in the
Supabase table editor. The site itself never shows "delivered"; it only claims what the API confirmed.

## Behaviour reference

| Situation | Visitor sees | Form | Stored status |
|---|---|---|---|
| Meta accepts | "Message sent to WhatsApp… accepted for delivery… not a guarantee" | cleared | `accepted` |
| Meta rejects (bad token, template, recipient…) | "Your message wasn't sent" | **kept** | `failed` |
| Timeout / network / Meta 5xx | "Could not confirm delivery… check by email before resending" | **kept** | `unconfirmed` |
| Same text re-submitted after `unconfirmed` | blocked (HTTP 409) so no duplicate; editing the text allows a new send | kept | unchanged |
| Rate limited | "Too many messages…" | kept | — |
| Honeypot filled | nothing (no message sent) | — | not stored |

## The old Gmail function

The current repository contains no `supabase/functions/contact` Gmail Edge Function directory, and the site does not call it. If a previously deployed Gmail function still exists in your Supabase project, review it in the Supabase dashboard and disable/delete it only after confirming nothing else uses it. Remove obsolete `GOOGLE_*`/`GMAIL_SENDER` secrets only after that check. Keep the `health` function if you use it for monitoring.

## Data and privacy

In API mode each submission (name, email, message) is stored in `contact_messages` so nothing is lost if
WhatsApp fails; only the service role can read it. Visitor IPs are stored only as salted SHA-256 hashes in
`contact_rate_limits` (purged after 1 day). Message bodies and tokens are never logged. Delete old rows
periodically if you do not want to keep them. In click-to-chat mode nothing is stored.

## Tests

```bash
npm run typecheck && npm run lint && npm run build
node --test tests/contact.test.ts                                   # Node 22.18+
deno test supabase/functions/whatsapp-contact supabase/functions/whatsapp-webhook
```
Backend tests use a mocked Meta endpoint and an in-memory store; they verify our logic, not live delivery.
