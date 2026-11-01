# Portfolio production-readiness checklist

This repository has received a focused code-readiness pass. It is not yet deployed or certified production-ready. Complete the items below with the actual hosting, domain, Supabase and Meta accounts.

## Verified in this working copy

- TypeScript check: `npm run typecheck` passed.
- ESLint: passed when invoked directly with `node node_modules/eslint/bin/eslint.js .`.
- Contact Edge Function CORS now permits the Supabase `apikey` request header.
- A database migration now adds WhatsApp idempotency/delivery columns and the atomic database-backed rate-limit RPC expected by the Edge Function.
- The contact form retains the same idempotency ID after an uncertain attempt, preventing an unchanged retry from silently creating a second send. Editing the form creates a new ID.
- API acceptance is described as acceptance, not confirmed delivery.
- The fallback click-to-chat message explicitly tells visitors to press Send in WhatsApp.
- A skip-to-content link and mobile navigation accessibility attributes are present.
- The default Vite favicon has been replaced and basic SEO/social metadata added.

## Checks not completed in this environment

- Production Vite build: not verified. The supplied `node_modules` came from Windows and lacks the Linux Rollup optional binary. The environment could not reach the npm registry to install it. Run the build on the target Windows development machine after `npm ci`.
- Deno Edge Function tests: not run because Deno is not installed in this environment.
- PostgreSQL migration: written but not applied to a live Supabase project.
- Live Meta/WhatsApp send and delivery webhook: not tested; they require your Meta and Supabase configuration.
- Real device/browser, Lighthouse, accessibility and responsive tests: still required.
- Hosting, DNS, HTTPS, redirects, custom-domain canonical URL and production social preview URL: not configured because the hosting provider/domain have not been supplied.

## Local verification

Run from the `project` directory:

```bash
npm ci
npm run typecheck
npm run lint
npm run build
npm run dev
```

For the Edge Function tests, install/use Deno and run:

```bash
deno test supabase/functions/whatsapp-contact supabase/functions/whatsapp-webhook
```

## Supabase setup

1. Link the intended Supabase project.
2. Review the SQL migrations before applying them.
3. Apply migrations:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

4. Configure the `whatsapp-contact` Edge Function secrets as described in `WHATSAPP_CONTACT_SETUP.md`.
5. Set `ALLOWED_ORIGINS` to the exact production origin plus localhost only while developing.
6. Deploy `whatsapp-contact`; deploy `whatsapp-webhook` only if delivery receipts are required.
7. Keep `VITE_CONTACT_DELIVERY_MODE=click-to-chat` until the Cloud API template, sender number, recipient eligibility and a real test send have all been confirmed. Only then switch to `api` and rebuild the frontend.

## Before enabling automatic API delivery

- Choose and document a contact-message retention period, then implement a deletion/cleanup policy for stored submissions.
- Publish a privacy notice explaining that name, email and message content are stored in Supabase and sent to WhatsApp.
- Use a Meta-approved message template and a registered WhatsApp Business Platform sender number. The recipient is configured server-side.
- Verify the recipient number in Meta's test-number recipient allow-list if using a test sender.
- Confirm a real message is accepted. If delivery receipts are required, configure and verify the signed webhook.
- Never place the Meta access token, app secret or Supabase service-role key in a `VITE_` variable or client bundle.

## Content and launch details still needed

- The actual production domain and hosting provider.
- Final, factual case-study content for each project (problem, your contribution, technology used, screenshots and outcomes). The current case-study pages intentionally do not invent these details.
- Real public GitHub/LinkedIn URLs if you want those links shown.
- A decision on contact-data retention and the privacy-policy wording.
- Confirmation that the CV and profile image are approved for public display.

After the production domain is known, update Open Graph/Twitter image URLs to absolute HTTPS URLs, add the canonical URL, and generate a sitemap containing the real domain.
