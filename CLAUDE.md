# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

PredictScore (working title "PredictPro") — a sports (football) betting-predictions
web app: recommendations, a 3-step custom-prediction flow, an accumulator/bet-slip
builder, history, watchlist, and plan-gated subscriptions (Free Trial / Weekly /
Monthly / Annual). Originally built with Lovable + TanStack Router + Supabase; it is
now mid-migration to Next.js App Router with a self-contained Auth.js + Prisma stack
(current branch `next-js`). The pre-migration app lives untouched under `legacy/` for
reference only — it is excluded from `tsc`/`eslint` and should not be imported from.

## Commands

```sh
npm run dev          # next dev
npm run build         # prisma generate && next build
npm run lint           # next lint
npm run format         # prettier --write .
npx tsc --noEmit        # typecheck (no separate test runner is configured)

npm run db:pull        # prisma db pull
npm run db:generate     # prisma generate
npm run db:migrate      # prisma migrate dev — NEVER run against the shared/prod
                         # database without explicit confirmation first
npm run db:studio       # prisma studio
```

There is no test suite in this repo currently — verify changes with `npx tsc --noEmit`,
`npx eslint <changed files>`, and `npm run build`.

## Architecture

### Auth — self-contained, no Supabase auth
Auth.js (`next-auth` v5) with the Credentials provider (bcrypt against
`Profile.passwordHash`) and Google OAuth, both resolving into our own `Profile` table
(`prisma/schema.prisma`). Sessions are JWT-based — no database session/adapter tables.
`src/lib/auth/index.ts` is the NextAuth config; `src/lib/auth/server.ts` exports
`getAuthedUser()`, which every server handler that touches user data should call first.

**There is no Postgres RLS anywhere.** Row ownership is enforced entirely in
application code by scoping every Prisma query on `userId`. When adding a new
query or route handler, always filter by the authed user's id yourself — nothing
does it for you at the database layer.

Route protection is layered:
1. `src/proxy.ts` (Next's `proxy`/middleware) redirects unauthenticated requests
   away from the protected prefixes (`/dashboard`, `/predictions`, `/accumulator`,
   `/history`, `/watchlist`, `/settings`, `/insights`, `/admin`, `/onboarding`).
2. `src/app/(app)/layout.tsx` re-checks `getAuthedUser()` server-side as
   defence-in-depth and renders the authenticated app shell (`app-shell.tsx`).
3. Admin-only API routes additionally call `requireAdmin()` (`src/lib/admin.ts`),
   which checks the `UserRole` table (role enum: `admin` | `user`) and returns a
   401/403 `NextResponse` directly if it fails.

### Data access — Prisma is the only data layer
`src/lib/prisma.ts` exports the singleton client. All server-side data code lives in
`src/lib/*.ts` (`admin.ts`, `entitlement.ts`, `history.ts`, `legal.ts`, `plans.ts`,
`predictions/service.ts`) and is consumed by route handlers under `src/app/api/**`
or by server components. Client components never import Prisma — they call the
`/api/*` routes, typically via TanStack Query (`useQuery`)/hooks like
`useEntitlement()` (`src/lib/use-entitlement.ts`).

### Entitlement / plan-gating — one source of truth
`computeEntitlement()` (`src/lib/plans.ts`) turns a `Subscription` + `Plan` row into
an `EntitlementSnapshot` (`isActive`/`isTrial`/`isPaid`, `dailyRecommendationLimit`,
`dailyCustomPredictionLimit`, `canUseAccumulator`, `canExportHistory`). A `Plan`'s
`daily_*_limit` column only takes effect once an admin sets it above `0` in
`/admin`; left at the schema default of `0` it falls back to the tier default
(`9999` active / `3` free) so an unconfigured plan doesn't accidentally lock
everyone out.

`loadEntitlement()` (`src/lib/entitlement.ts`) is the **only** place this should be
computed server-side: it loads the subscription+plan, then intersects
`dailyCustomPredictionLimit` with the user's personal "responsible gambling"
`Profile.dailyViewLimit` (via `Math.min` — the personal setting can only tighten,
never loosen, the plan limit). Every consumer — the `/api/entitlement` route, the
`/api/predictions/detailed` 429 check, the dashboard/predictions pages — must read
from this, not re-derive limits locally. Duplicating limit logic outside
`loadEntitlement()`/`computeEntitlement()` has caused real bugs before (admin-set
limits and the user's self-limit being silently ignored).

### External prediction data — Python API with mock fallback
Real predictions/recommendations/insights come from an external Python FastAPI
service. `src/lib/admin.ts`'s `callExternal()` (despite the filename, this is the
shared external-fetch helper, not admin-only) calls it server-to-server with the
`x-api-key` secret (`PYTHON_API_URL`/`PYTHON_API_KEY`, never exposed to the
browser) and returns `null` on any failure or when unconfigured. Every caller in
`src/lib/predictions/service.ts` (`getLeagues`, `getFixtures`, `fetchDetailed`,
`getRecommendations`, `getInsights`, `getStats`) falls back to realistic
seeded-random mock data when the API is unset/unreachable, so the app stays fully
usable in local dev without the Python service running.

**Honesty guardrail:** never present fabricated/inflated performance figures as if
they were a user's real outcomes or the model's real track record — mock/fallback
data must be clearly synthetic in intent (e.g. `synthetic: true` on mock
recommendations) and any hardcoded success-rate placeholder should reflect the
model's actual realistic ceiling (currently ~54.5%, see `getStats()`), not an
inflated number. Prefer building charts/stats from real per-user data
(`UserActivity`, `UserPrediction`) over deriving synthetic personal stats from
global averages.

### Payments — Flutterwave + Paystack, NGN, admin-gated
`src/lib/payments/` is a small provider-abstraction (`flutterwave.ts`, `paystack.ts`,
shared `types.ts`, `index.ts`) built directly against each gateway's REST API with
plain `fetch` (no SDK deps), mirroring the `callExternal()` style already used for the
Python API. `initiatePayment()` creates a `Payment` row and returns a hosted-checkout
redirect URL; `verifyAndActivate()` is the single idempotent function called from both
`/api/payments/callback/[provider]` (browser redirect back) and
`/api/payments/webhook/[provider]` (server-to-server backstop) — it cross-checks the
gateway's echoed-back reference and amount before activating a `Subscription`.

A gateway is only ever offered to users when **both** conditions hold: an admin has
flipped `PaymentGatewayConfig.enabled` on for it (`/admin` → Payments tab) **and** its
secret/public keys are present in env (`hasKeysConfigured()`), via `getEnabledGateways()`
in `src/lib/payments/index.ts`. Both gateways ship seeded `enabled: false` with no keys
configured, so `/onboarding` currently shows paid plans as unavailable and only the free
trial is selectable — this is intentional, not a bug, until real keys are added.

Required env vars (none set by default in this environment):
- `FLUTTERWAVE_SECRET_KEY`, `FLUTTERWAVE_PUBLIC_KEY` — from the Flutterwave dashboard.
- `FLUTTERWAVE_WEBHOOK_SECRET_HASH` — the plain string Flutterwave sends back as the
  `verif-hash` header (Flutterwave webhook auth is a string-equality check, not HMAC).
- `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY` — from the Paystack dashboard.
- `NEXT_PUBLIC_APP_URL` — base URL used to build the `redirect_url`/`callback_url` sent
  to each gateway and the absolute redirect target in the callback route.

### Route structure
- `src/app/(app)/*` — authenticated pages (dashboard, predictions, predictions/detail,
  history, insights, accumulator, watchlist, settings, admin), gated by the layout
  described above.
- `src/app/api/**` — route handlers; the data logic itself should live in `src/lib`,
  not inline in the route file, so it can be reused/tested independently of Next's
  request/response plumbing.
- `src/app/(marketing pages)` — `auth`, `onboarding`, `privacy`, `terms`,
  `refund-policy`, `responsible-gambling`, `cookies`, `reset-password` are public.

### Prisma model notes worth knowing before touching schema-adjacent code
- `Profile` doubles as the credentials table (`passwordHash`, `emailVerified`) —
  there's no separate Auth.js adapter `User`/`Account` table.
- `UserPrediction.result` is currently never written anywhere in the codebase — it's
  always `null`. Win-rate/settlement displays that depend on it (History, Insights)
  are effectively unpopulated until a settlement pipeline exists.
- `Recommendation` is a legacy global table; the dashboard/predictions pages now get
  recommendations from the Python API (via `getRecommendations()`), not this table.
- `PredictionCache` is global (not scoped per-user), unlike every other user-facing
  model.

### Styling
Tailwind v4, CSS-first `@theme` config with OKLCH color tokens. Use the existing
`--color-*` CSS custom properties (e.g. `var(--color-chart-1)`, `var(--color-primary)`)
and `color-mix(in oklch, ...)` for theme-aware alpha blending instead of hardcoded hex
values — hardcoded colors won't track the light/dark theme.

### React idioms specific to this codebase
Avoid the `useEffect` + `setState`-from-query anti-pattern (flagged by eslint's
`react-hooks/set-state-in-effect`) for initializing form state from an async query
result. The established pattern here is a loading-gate parent component plus a child
component that mounts only once the data has loaded, initializing its state directly
from props — see `src/app/(app)/settings/page.tsx` (`SettingsPage` / `SettingsForm`)
for the reference implementation.

`sessionStorage` is used deliberately (not a bug) to stash detailed prediction
payloads across navigation from the predictions flow to `predictions/detail`
(`src/lib/predictions/detail-store.ts`).
