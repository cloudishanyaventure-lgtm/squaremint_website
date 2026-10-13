# Squaremin

A responsive real-estate website inspired by `website_design_code.txt`. Warm ivory, forest green, architectural imagery, expressive typography, and three clear property pathways.

Built with HTML, CSS, and native JavaScript modules. No frontend dependencies, package installation, or framework runtime required. Use Node.js 22 or newer for the local scripts.

## Run locally

```sh
npm run dev
```

Open **http://127.0.0.1:5173**. To check the production output:

```sh
npm test
npm run build
npm run preview
```

Stop the dev server before starting preview; both use port 5173. Set `PORT` to use another port.

## Deploy to Cloudflare Pages

Push this directory to a GitHub or GitLab repository, then connect it to a new **Pages** project in Cloudflare's **Workers & Pages** dashboard.

| Setting | Value |
| --- | --- |
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | Repository root |
| Node version | 22 (also specified in `.node-version`) |

Cloudflare compiles the root `functions/` directory separately from the static output. Keep it in the repository. `public/_routes.json` restricts function invocation to `/api/*`.

Alternatively, with Wrangler installed/authenticated, run from the repository root:

```sh
npm run build
npx wrangler pages deploy dist --project-name nextnest
```

Use your own Pages project name. For a static-only deployment, upload `dist` using dashboard drag-and-drop. Dashboard drag-and-drop does **not** compile Pages Functions; use Git integration or Wrangler to enable enquiry delivery.

Official references: [static HTML deployment](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/), [build settings](https://developers.cloudflare.com/pages/configuration/build-configuration/), [Pages Functions](https://developers.cloudflare.com/pages/functions/get-started/).

## Connect the enquiry form

The optional `functions/api/enquiry.js` handler sends email using Resend. Configure the following in your Pages project's environment variables/secrets, then redeploy:

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Secret Resend API key with permission to send email |
| `ENQUIRY_FROM` | Sender address on a domain verified in Resend |
| `ENQUIRY_TO` | Your destination inbox |

Never place these values in `public/`. The endpoint validates inputs, rejects foreign origins and oversized payloads, includes a honeypot, and only reports success after the email provider accepts the request. It does not store enquiries in a database. Provider acceptance is not proof of inbox delivery.

Without configuration, the form clearly reports delivery is unavailable and offers a local text download. It never pretends an enquiry was sent. The local static server intentionally behaves the same way. For a full local Functions preview, copy `.dev.vars.example` to `.dev.vars`, populate it, build, and run `npx wrangler pages dev dist` from the root. No real test emails are sent by the unit tests.

See [Resend's send-email API](https://resend.com/docs/api-reference/emails/send-email). Configure production abuse controls in Cloudflare before exposing a real lead collection endpoint at scale.

## Included interactions

- Combined property pathway and city filters, a full-collection toggle, and empty states.
- Property details in accessible native dialogs, with downloadable illustrative overviews.
- Saved properties stored in the current browser, with a shortlist dialog.
- A bounded 1–100 share calculator and visual ownership grid.
- Mobile navigation, keyboard-operable tabs, FAQ accordions, reduced-motion support, and visible focus states.
- Validated enquiry form, clear delivery states, and a download fallback.
- Page metadata, favicon, security headers, and a custom 404 page.

## Edit the site

- `public/index.html`: layout, copy, enquiry form, and FAQs.
- `public/styles.css`: design tokens and responsive layouts.
- `public/model.js`: property inventory and calculator assumptions.
- `public/assets.js`: property image URLs from the supplied design.
- `public/app.js`: interface behavior.
- `functions/api/enquiry.js`: optional email endpoint.

The images currently use the Google-hosted URLs in the reference, and fonts load from Google Fonts. These require network access. For a self-contained production release, put approved image/font files in `public/assets/`, update the references, and adjust the content security policy in `public/_headers`. External images could not be downloaded or verified in the development session because network access was restricted.

All property inventory and financial figures are explicitly illustrative. Replace them with verified data before commercial launch. Update the concept privacy/terms copy with the actual operator, contact details, and retention policy before collecting live customer information. The supplied source file remains unchanged and is not included in the public build.

## Verification

`npm test` covers investment calculations, combined property filters, endpoint validation, payload limits, missing configuration, and mocked email success/failure. All 8 tests pass. `npm run build` produces the complete static site. Static validation also confirmed unique HTML IDs, valid in-page anchor targets, and required deployment assets. Browser visual verification was unavailable, and the development sandbox denied binding the local preview port; review desktop and mobile layouts and externally hosted images before launch.
