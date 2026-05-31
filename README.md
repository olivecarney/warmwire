# Warmwire

Warmwire is a Manifest V3 Chrome extension MVP for preparing one personalised cold outreach email at a time inside Gmail.

It does not use the Gmail API, OAuth, a backend, paid AI APIs, bulk sending, auto-send, hidden tracking pixels, or inbox scraping. The user reviews and sends every email manually.

## Install

```bash
npm install
npm run build
```

Then load the extension in Chrome:

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click "Load unpacked".
4. Select the generated `dist` folder.
5. Open `https://mail.google.com`.

For development, run:

```bash
npm run dev
```

Reload the extension from `chrome://extensions` after rebuilds.

## Releases

Every push to `main` builds the extension and creates a GitHub release.

The release workflow:

- runs `npm ci`
- runs `npm run build`
- validates that `package.json` and `public/manifest.json` use the same version
- packages the generated `dist` folder as a ZIP
- creates a release named `Warmwire v<version> (<short-sha>)`
- uploads `warmwire-extension-v<version>-<short-sha>.zip`
- generates release notes from commits since the previous tag

When preparing a user-facing version, update both `package.json` and `public/manifest.json` to the same Chrome-compatible version, for example `0.2.0`.

## Project Structure

```text
public/manifest.json           MV3 manifest
public/assets/warmwirelogo.png Toolbar popup brand image
public/icons/warmwire-*.png    Chrome extension toolbar icons
public/popup.*                 Extension toolbar popup
src/content/content.tsx        Gmail-injected React app
src/content/content.css        Sidebar styling
src/mail/mailAdapter.ts        Portable mail adapter interface
src/mail/currentAdapter.ts     Current site adapter selection
src/mail/gmailAdapter.ts       Gmail adapter implementation
src/gmail/gmailDom.ts          Gmail DOM selectors and compose fill helpers
src/generator/emailGenerator.ts Rule-based email generator interface
src/storage/storage.ts         chrome.storage.local helpers
src/storage/defaults.ts        Default profile/settings/storage
src/types.ts                   Shared strict TypeScript types
```

## Gmail Compose Filling

Warmwire runs as a content script on `mail.google.com`. The UI talks to a small `MailAdapter` interface so the compose/open/copy workflow can later be implemented for Proton Mail or Outlook without rewriting the React app.

For Gmail, the "Open Gmail compose" button searches for Gmail's visible Compose button and clicks it.

"Fill compose" looks for the active Gmail compose dialog, then attempts to populate:

- recipient field
- subject field
- editable message body

The selectors are isolated in `src/gmail/gmailDom.ts`, behind `src/mail/gmailAdapter.ts`, because Gmail's DOM is private and can change without notice. If a selector fails, Warmwire copies the recipient, subject, and body to the clipboard and shows a message so the user can paste manually.

Warmwire never clicks Send and does not try to bypass Gmail protections.

## Future Extension Points

The code is structured so later versions can add:

- Proton Mail and Outlook DOM adapters
- AI-generated personalisation behind the `EmailGenerator` interface
- LinkedIn or company website context extraction
- CSV import/export
- backend accounts and sync
