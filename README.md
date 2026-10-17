# DeutschMentor – Frontend (Angular 22)

Single-page web app for DeutschMentor, a platform that teaches German from A1 to C1 to Arabic speakers (English interface, Arabic translations inside the lessons).
Mobile-first and responsive: the same code runs in the browser today and is ready to be wrapped with Capacitor for Android and iOS.

## Contents

1. [Tech stack](#tech-stack)
2. [Getting started](#getting-started)
3. [Project structure](#project-structure)
4. [Configuration](#configuration)
5. [Architecture and conventions](#architecture-and-conventions)
6. [Routes](#routes)
7. [Features](#features)
8. [Design system](#design-system)
9. [Testing](#testing)
10. [Deployment (Cloudflare Pages)](#deployment-cloudflare-pages)
11. [Mobile apps](#mobile-apps)
12. [Troubleshooting](#troubleshooting)
13. [Known limitations](#known-limitations)

## Tech stack

* Angular 22, standalone components, signals, zoneless change detection, new control flow (`@if`, `@for`, `@switch`)
* Reactive forms, RxJS only for HTTP and timers
* Plain CSS with design tokens (CSS custom properties). No UI library
* Fonts bundled locally with `@fontsource/barlow` and `@fontsource/barlow-condensed` (nothing is loaded from a CDN except the Google Sign-In script)
* Vitest through `ng test`
* Node 22.22+ or 24.13.1+ is required by Angular 22

## Getting started

```bash
cd frontend/web
npm install
ng serve          # http://localhost:4200
ng build          # production build into dist/web/browser
ng test --watch=false
```

The API must be running (default `https://localhost:7080`) and `http://localhost:4200` must be in its `Cors:Origins`.

## Project structure

```
src/
├── index.html, main.ts, styles.css      global tokens and shared classes
├── environments/                        environment.ts (production), environment.development.ts
└── app/
    ├── app.ts, app.config.ts, app.routes.ts
    ├── core/            config, guards, interceptors, models (ApiError, PagedResult, Google types), services (storage, theme, clock, file download, query params)
    ├── domain/          enums and the User model (mirror of the API enums)
    ├── models/          request/response interfaces per feature (auth, learning, vocabulary, grammar, exercises, reading, writing, exams, certificates, review, progress, drills, admin)
    ├── services/        one thin HTTP service per API area (no logic)
    ├── state/           signal stores: auth (session), learning (levels), review (due counter)
    ├── components/      feature widgets: auth, learning, vocabulary, grammar, exercises, reading, writing, exams, certificates, progress
    ├── shared/          app shell (sidebar and bottom bar), icon, logo, validators, coming-soon
    └── pages/           route-level pages per feature
```

Import direction is always `pages → components/state → services → models/domain`. Nothing imports from `pages`.

## Configuration

| File | Used by | Content |
|---|---|---|
| `src/environments/environment.development.ts` | `ng serve` | local API URL and Google Client ID (git-ignored) |
| `src/environments/environment.ts` | `ng build` | production placeholders `__API_BASE_URL__` and `__GOOGLE_CLIENT_ID__` |
| `scripts/set-env.mjs` | `npm run build:ci` | replaces the placeholders from environment variables on the build server |

`core/config/app-settings.ts` reads from the environment file, so no other file contains URLs.

The Google Client ID is public by design. Secrets never belong in the front-end: everything shipped to the browser can be read.

## Architecture and conventions

* **English only in code and UI.** Arabic appears only as lesson data, always rendered with `lang="ar" dir="rtl"`.
* **Auth session:** `AuthStore` keeps tokens and the user in a signal and in `localStorage` (through `StorageService`, which survives blocked storage). `signOut()` clears the learning data too.
* **Interceptors:** `timezoneInterceptor` adds `X-Timezone-Offset` to every API call. `authInterceptor` adds the bearer token, and on a 401 refreshes the token once (a single shared request even if many calls fail together), retries, and signs the user out only if the refresh itself is rejected (not on network errors).
* **Guards:** `authGuard`, `guestGuard`, `adminGuard`. The server re-checks everything; guards are only for navigation.
* **Errors:** every call maps failures with `toApiError`, so the UI shows the server's `message` and can branch on `code`.
* **Time:** exam timers and cooldowns use the server clock offset (`clockOffsetMs`) and `parseUtc`, so a wrong phone clock does not matter.
* **Signals everywhere:** async state is held in signals so zoneless change detection updates the view.

## Routes

| Route | Page | Access |
|---|---|---|
| `/auth/sign-in`, `/auth/create-account`, `/auth/confirm-email`, `/auth/forgot-password`, `/auth/reset-password` | authentication | guests |
| `/verify`, `/verify/:code` | public certificate verification | everyone |
| `/today` | dashboard | signed in |
| `/learn`, `/learn/lesson/:id` | learning path, lesson (5 tabs) | signed in |
| `/vocabulary`, `/vocabulary/flashcards` | library with search/filters, flashcards | signed in |
| `/grammar`, `/grammar/:id` | grammar library, topic | signed in |
| `/review` | spaced review | signed in |
| `/drills/articles` | der/die/das drill | signed in |
| `/achievements` | all achievements | signed in |
| `/exams`, `/exams/take/:id`, `/exams/result/:id` | exam list, exam, result | signed in |
| `/certificates` | certificates | signed in |
| `/profile` | profile and password | signed in |
| `/admin`, `/admin/users` | content administration, user management | admin |

## Features

* **Authentication screens:** sign-in, create account (with the A1 or placement-test choice), 6-digit email confirmation with resend cooldown, forgot/reset password, Google sign-in button, profile (name, change/set password).
* **Password fields:** every password input uses `dm-password-field` with a show/hide button (accessible label, `aria-pressed`, keyboard friendly), including sign-in, registration, reset and profile.
* **App shell:** sidebar on desktop, top bar plus bottom navigation on phones (safe-area aware), dark/light theme remembered per device, red due-cards badge on Review, Admin tab only for admins.
* **Today:** greeting and German date, streak, continue card, daily plan, mentor messages, spaced-review card, week strip, recent achievements, level progress, placement-test card when available.
* **Learning path:** level chips (swipeable on phones), modules with lesson states, locked-level explanation, exam card.
* **Lesson:** five tabs with a "steps done" counter; vocabulary cards with article colours and "Add to review"; grammar tables with Arabic notes; practice player for the five exercise types with instant feedback; reading with questions; writing with rule-based feedback, model answer and a teacher-review request.
* **Spaced review:** show answer, four rating buttons with the next interval on each, keyboard shortcuts (Space, 1–4).
* **Exams:** list with availability states and a live retake countdown; the exam screen has a server-based timer, question grid (answered/flagged/current), flag, previous/next, debounced auto-save queue, auto-submit at zero, resume after refresh; the result screen shows the score, skill bars with the pass marker, weak areas and the next action. Placement result shows the starting level.
* **Certificates:** certificate view for every level (locked/not passed/placement states), PDF download (authenticated blob), copy ID and copy verification link, public verification page.
* **Admin:** statistics; import with "Check file" then "Import as draft" or "Import and publish" and a readable error report; lessons table with search, level and status filters, publish/unpublish/delete; writing review queue; exam-pool overview; **user management** with search and filters, sign-in method, last login, progress counters and lock/unlock (admins and your own account cannot be locked).

## Design system

* Tokens in `styles.css`: colours (black, red, gold of the German flag), light and dark palettes, radii, focus ring. The theme is applied before first paint from an inline script in `index.html`.
* Typography: Barlow Condensed for headings, Barlow for text; inputs use 16px to avoid iOS zoom; touch targets are at least 48px.
* Layout breakpoint at 900px; wide content scrolls inside its own container; the certificate view stays white in dark mode.
* Shared classes: `.btn`, `.card`, `.field`, `.input`, `.badge`, `.alert`, `.progress`, `.page`, `.card-grid`.

## Testing

```bash
ng test --watch=false
```

Included: clock helpers (countdown formatting, .NET date parsing, server offset) and the password validators. Add component tests next to the files they cover.

Manual checklist: register and confirm, Google sign-in, password show/hide on every form, forgot/reset, learn a lesson on a phone-sized viewport, review cards, take and resume an exam, download a certificate, verify it in a private window, admin import and user lock (a locked user is signed out on the next request).

## Deployment (Cloudflare Pages)

Any static host works. Cloudflare Pages is free, has unlimited bandwidth and serves `index.html` for unknown paths automatically, so deep links like `/learn` work after a refresh.

1. Push the repository to GitHub (never commit `environment.development.ts`).
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → choose the repository.
3. Settings: root directory `frontend/web` (if the repository has both apps), build command `npm run build:ci`, output directory `dist/web/browser`.
4. Environment variables (Production): `NODE_VERSION=24`, `API_BASE_URL=https://<your-api-host>` (https, no trailing slash), `GOOGLE_CLIENT_ID=<id>.apps.googleusercontent.com`.
5. Deploy. Add the resulting `https://<project>.pages.dev` URL to the Google OAuth client ("Authorized JavaScript origins") and to the API's `Cors:Origins`.
6. Changing a variable requires a new deployment because values are injected at build time.

Other free options: Netlify (add `public/_redirects` with `/* /index.html 200`), Firebase Hosting (rewrite to `/index.html`), GitHub Pages (needs a `404.html` copy of `index.html`).

## Mobile apps

The app is built for Capacitor. When wrapping it: replace `StorageService` internals with secure storage, replace the browser PDF download with a share/save plugin, use the native Google Sign-In plugin instead of the web button, and add push reminders for due reviews.

## Troubleshooting

| Symptom | Fix |
|---|---|
| 401 on every call after sign-in | The API's `Jwt:Issuer` or `Jwt:Audience` is empty. Fix the API settings and sign in again |
| CORS error | The front-end origin is missing from the API's `Cors:Origins` |
| Blank page after refresh on a deep link | The host lacks the SPA fallback (see Deployment) |
| Google button missing or failing | Wrong or missing Client ID, or the origin is not authorised |
| Build fails on the server | Node version below 22.22; set `NODE_VERSION=24` |
| Countdowns are off | The server date is missing the `Z` suffix; the API must send UTC dates |

## Known limitations

* No CSV import and no per-item content editor in the admin (packs are edited as JSON and re-imported).
* No offline mode yet.
* Writing feedback is rule-based and does not judge grammar.
