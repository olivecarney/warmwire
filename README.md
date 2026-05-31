# Warmwire

Warmwire is a privacy-first Chrome extension for preparing one personalised cold outreach email at a time inside Gmail.

It helps you draft, review, and fill an email compose window, but you stay in control of every message. Warmwire does not use the Gmail API, OAuth, a backend, bulk sending, auto-send, hidden tracking pixels, or inbox scraping.

## Features

- Gmail sidebar for preparing outreach drafts
- One-at-a-time prospect workflow
- Local profile and settings storage using `chrome.storage.local`
- Rule-based draft generation
- Gmail compose opening and filling
- Clipboard fallback if Gmail's private DOM changes
- No auto-send, no bulk sending, no tracking pixels
- Provider adapter structure for future Proton Mail and Outlook support

## Install From Releases

1. Go to the [Warmwire Releases](https://github.com/olivecarney/warmwire/releases) page.
2. Download the latest `warmwire-extension-vX.Y.Z.zip` file.
3. Unzip the downloaded file.
4. Open Chrome and go to `chrome://extensions`.
5. Enable `Developer mode`.
6. Click `Load unpacked`.
7. Select the unzipped Warmwire extension folder.
8. Open `https://mail.google.com`.

Chrome should now load Warmwire when Gmail is open.

## Build Locally

Install dependencies:

```bash
npm install
```

Build the extension:

```bash
npm run build
```

Then load the generated `dist` folder in Chrome:

1. Open `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select the generated `dist` folder.
5. Open `https://mail.google.com`.

For development builds:

```bash
npm run dev
```

Reload the extension from `chrome://extensions` after rebuilds.

## How It Works

Warmwire injects a React app into Gmail as a content script. The app talks to a small mail adapter interface, currently implemented for Gmail.

For Gmail, Warmwire can:

- find and click Gmail's visible Compose button
- locate the active compose dialog
- fill the recipient field
- fill the subject field
- fill the editable message body

Gmail's DOM is private and can change. Those selectors are isolated in `src/gmail/gmailDom.ts`. If filling fails, Warmwire copies the recipient, subject, and body to the clipboard so the user can paste manually.

## Releases

GitHub Actions builds releases from extension-changing commits on `main`.

The release workflow runs when files under `src/`, `public/`, or build/version config files change. Documentation-only changes do not create extension releases.

The workflow:

- installs dependencies with `npm ci`
- runs `npm run build`
- validates matching versions in `package.json` and `public/manifest.json`
- packages the generated `dist` folder as a ZIP
- creates a release named `Warmwire v<version>`
- uploads `warmwire-extension-v<version>.zip`
- generates release notes from commits since the previous tag

When preparing a user-facing version, update both `package.json` and `public/manifest.json` to the same Chrome-compatible version, for example `0.2.0`.

## Project Structure

```text
public/manifest.json            MV3 manifest
public/assets/warmwirelogo.png  Toolbar popup brand image
public/icons/warmwire-*.png     Chrome extension toolbar icons
public/popup.*                  Extension toolbar popup
src/content/content.tsx         Gmail-injected React app
src/content/content.css         Sidebar styling
src/mail/mailAdapter.ts         Portable mail adapter interface
src/mail/currentAdapter.ts      Current site adapter selection
src/mail/gmailAdapter.ts        Gmail adapter implementation
src/gmail/gmailDom.ts           Gmail DOM selectors and compose fill helpers
src/generator/emailGenerator.ts Rule-based email generator interface
src/storage/storage.ts          chrome.storage.local helpers
src/storage/defaults.ts         Default profile/settings/storage
src/types.ts                    Shared strict TypeScript types
```

## Roadmap

- Proton Mail adapter
- Outlook adapter
- AI-assisted personalisation behind the existing generator interface
- LinkedIn or company website context extraction
- CSV import and export
- Optional cloud sync
