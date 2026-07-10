# New Business Dashboard — Setup

## 1. Deploy to Netlify
Drag this folder into Netlify (or connect the repo). `netlify.toml` already points it at `netlify/functions`.

## 2. Environment variables
Site settings → Environment variables → add:

- `SF_CLIENT_ID` — Connected App consumer key
- `SF_CLIENT_SECRET` — Connected App consumer secret
- `SF_LOGIN_URL` — usually `https://login.salesforce.com` (or your My Domain URL, e.g. `https://legalforlandlords.my.salesforce.com`)

Reuse the same Connected App you already set up for the Zoom → Salesforce integration, as long as it has the **Client Credentials Flow** enabled and is run as a user with access to all 8 reports' folders/objects.

## 3. Turn on site password
Site settings → Visitor access → Password protect this site. Requires a Netlify plan that supports it (Pro and above). Share the password with whoever in the company needs access.

## 4. Redeploy
Any change to env vars requires a redeploy to take effect.

## Notes
- No database. Every page load calls the Netlify Function, which calls Salesforce fresh. No history is stored.
- To add/remove/rename a report, edit the `REPORTS` array at the top of `netlify/functions/get-reports.js` and the `PLACEHOLDER_LABELS` array in `index.html`.
- If a card shows "Unavailable," check the function log in Netlify for the underlying Salesforce error (usually a permissions issue on the integration user).
