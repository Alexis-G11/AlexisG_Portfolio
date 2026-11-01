# Alexis Praise George Portfolio — Local Testing Package

This package contains the portfolio source code and focused readiness improvements. It is intended for local testing before deployment. **It is not yet certified production-ready**: live Supabase/WhatsApp configuration, production hosting, browser/device testing and a final production build still need to be completed.

## Requirements

- Windows 10/11
- Node.js 20.19+ or 22.12+ (Node.js 22 LTS recommended)
- npm (installed with Node.js)
- VS Code (recommended)

## 1. Extract and open

1. Extract this ZIP to a normal folder, for example `C:\Users\YourName\Projects\Alexis_Portfolio`.
2. Open the extracted `project` folder in VS Code. It is the folder containing `package.json`.
3. In VS Code, choose **Terminal → New Terminal**.

## 2. Install dependencies

Run this once from the `project` folder:

```powershell
npm ci
```

If npm reports a lockfile/dependency issue, run `npm install` and then continue.

Do not copy a `node_modules` folder from another operating system. This package intentionally excludes `node_modules`; npm installs the correct Windows-specific packages on your computer.

## 3. Start the local website

```powershell
npm run dev
```

Vite will print a local address, usually:

`http://localhost:5173`

Open that address in Chrome.

To stop the development server, press `Ctrl + C` in the terminal.

## 4. Contact form behaviour in local testing

The safe default is:

`VITE_CONTACT_DELIVERY_MODE=click-to-chat`

In this mode, the form validates the visitor's details and opens a WhatsApp chat with a prepared message. The visitor **must press Send inside WhatsApp**. Opening WhatsApp does not mean the message was delivered.

The Email Me link opens the visitor's email application.

To test the Cloud API mode, first create/configure a Supabase project, apply the SQL migrations, deploy the `whatsapp-contact` Edge Function, configure its server-side secrets and verify a real approved WhatsApp template send. Only then set `VITE_CONTACT_DELIVERY_MODE=api` in a local `.env` file and add the public Supabase project URL and anon/publishable key. Never put a service-role key, Meta access token or Meta app secret in a `VITE_` variable.

Start from `.env.example`. Create a local `.env` file only if needed. Do not commit `.env`.

## 5. Run code checks

From the `project` folder:

```powershell
npm run typecheck
npm run lint
npm run build
```

To preview a successful production build locally:

```powershell
npm run preview
```

## Included improvements

- Restored the missing `Contact.tsx` section.
- Corrected WhatsApp Edge Function CORS headers for Supabase browser requests.
- Added the WhatsApp idempotency, delivery-tracking and database-backed rate-limit migration.
- Added favicon, robots.txt and baseline SEO/social metadata.
- Corrected the WhatsApp click-to-chat popup handling.
- Removed a misleading footer social icon.
- Added `docs/PRODUCTION_READINESS.md` with remaining deployment and security tasks.

## Important before public launch

Read `docs/PRODUCTION_READINESS.md` and `docs/WHATSAPP_CONTACT_SETUP.md`. Do not switch to API delivery until the Meta Business Platform sender, approved template, recipient eligibility, Supabase secrets and live test are all verified. Also add a privacy notice and retention policy before collecting public contact messages.
