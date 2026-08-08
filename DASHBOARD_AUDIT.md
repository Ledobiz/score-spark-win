# Dashboard audit — 2026-08-07

Full review of every authenticated `(app)` page (dashboard, predictions,
predictions/detail, history, insights, accumulator, watchlist, settings,
admin) for design, responsiveness, and functional correctness, per your
request. Bugs were fixed directly in code. This file covers (1) a critical
infra blocker, (2) judgment calls made while fixing things, and (3) valuable
features that aren't built yet.

---

## 0. Critical — the connected database has no tables

`DATABASE_URL`/`DIRECT_URL` in `.env` point at a Supabase Postgres instance
whose `public` schema is currently **completely empty** (`information_schema.tables`
returns zero rows; `npx prisma migrate status` reports "not managed by Prisma
Migrate", and there's no `prisma/migrations/` folder at all).

This means right now, on this database, **nothing that touches Prisma can
work** — sign-up, sign-in (the `profiles` table doesn't exist), the
dashboard, everything. I did not run any migration against it — creating the
schema is exactly the kind of shared-infrastructure change I'll hold for your
sign-off rather than guess at, since I don't know whether this project ref is
meant to be empty (e.g. you're mid-way through pointing `.env` at a fresh
Supabase project as part of the TanStack→Next.js move) or something else is
wrong (wrong project ref, wrong branch of `.env`, etc.).

**What I need from you:** confirm this is the right database, then either:
- run `npx prisma migrate dev --name init` yourself, or
- tell me to run it (it will generate an initial migration from the current
  `schema.prisma` and apply it — additive `CREATE TABLE`s only, nothing to
  lose on an empty database).

Everything below was reviewed and fixed at the **code level** (static
analysis + `tsc`/`eslint`/`next build`, all passing on 43 routes). I could not
click through the live app end-to-end because of this — see the "not visually
verified" note at the end.

---

## 1. Bugs fixed

### 1.1 Daily prediction limits were hardcoded in three places and ignored the DB
`computeEntitlement()` (`src/lib/plans.ts`) hardcoded `3` (free) / `9999`
(trial or paid) and never read the `Plan.daily_recommendation_limit` /
`Plan.daily_custom_prediction_limit` columns — the exact fields the admin
panel's "Daily recs" / "Daily custom" inputs let an admin edit per plan. Those
admin controls had **zero effect** on any user. The same `3 / 9999` logic was
also independently duplicated in `predictions/page.tsx` (client-side) and
`/api/predictions/detailed/route.ts` (server-side enforcement) — three
sources of truth that happened to agree only because none of them read the
real data.

**Fix:** `EntitlementSnapshot` now carries both a `dailyRecommendationLimit`
and a `dailyCustomPredictionLimit`, each sourced from the user's actual plan
row, with the old `3/9999` tier value kept only as the *fallback* for a plan
left at its schema default of `0` (so an admin who hasn't configured a new
plan yet doesn't accidentally lock its users out at zero). `loadEntitlement()`
is the single place this is computed; the API route and the client page both
just read `entitlement.dailyCustomPredictionLimit` now instead of
re-deriving it.

**Judgment call:** the dashboard's free-tier recommendation-row lock (used to
be a hardcoded `.slice(0, 3)`) now uses `dailyRecommendationLimit`, and the
custom-prediction daily cap uses `dailyCustomPredictionLimit` — i.e. I kept
these as two independently-configurable limits (matching the two separate DB
columns and the two separate admin inputs) rather than collapsing them into
one number. Please sanity-check the values on each plan in `/admin` → Plans —
right now whatever is currently stored (possibly still `0`) will just fall
back to the old 3/9999 behavior until you set real numbers.

### 1.2 The "responsible gambling" daily limit setting did nothing
`Settings` → "Responsible gambling" let a user set a `dailyViewLimit` and
described it as *"a soft limit reminding you when you've viewed enough
predictions today"* — but nothing in the codebase ever read that field
outside of displaying it back. It was pure decoration on a feature whose
entire purpose is self-protection for someone worried about their gambling
habits, which felt like the highest-priority fix in this whole audit.

**Fix:** `loadEntitlement()` now intersects the plan's
`dailyCustomPredictionLimit` with the user's personal `dailyViewLimit` (using
whichever is *stricter* — the personal limit can only tighten, never loosen,
the plan's limit) before returning it, so it's enforced everywhere the daily
limit is enforced (both the UI counter and the server-side 429).

**Judgment call — copy change:** I changed the label from "a soft limit
reminding you" to describe what it actually now does: *"Once you hit this
many predictions in a day, PredictPro stops you from running more until
tomorrow — even if your plan allows more."* A responsible-gambling feature
should never *undersell* what it does. I also changed the control from an
always-on number input (which silently defaulted to `50` for anyone who
opened Settings and hit Save without touching it — turning "no limit" into an
accidental real limit) to an explicit on/off switch, off by default, so a
personal limit is only ever applied when a user deliberately turns it on.
**Please review this UX choice** — an alternative would be a hard block vs.
what I built (which still lets you *view* the "limit reached" state and
upgrade, just not run more predictions); I judged a hard stop to be the
correct behavior for a responsible-gambling control specifically, even though
elsewhere in the app "limit reached" just means "upgrade to continue."

### 1.3 Dashboard chart fabricated "wins" from a global average
The dashboard's second chart ("Wins vs Views") computed
`wins = Math.round(views * modelRate)` — i.e. it invented a per-day "wins"
number by multiplying the user's *own* real view count by the *model's*
global success rate, then plotted it next to real data as if it were the
user's actual outcomes. There's no settlement pipeline that produces real
per-user win/loss data (see §3.1), so this number was 100% synthetic dressed
up as a personal stat. This directly conflicts with the project's own honesty
guardrail (CLAUDE.md §7: don't present inflated/fabricated performance
figures) — it's not a marketing page, but the principle is the same.

**Fix:** replaced it with "Top leagues (last 30 days)" — a horizontal bar
chart built from the same real `user_activity` data already powering the
"Top league" stat card, just showing the full breakdown instead of only the
#1 league. All real data, genuinely useful (shows a user where their
attention/betting interest actually goes), no fabrication.

### 1.4 Hardcoded hex colors on the prediction detail page
The goals over/under bar chart used raw `#3b82f6` / `#94a3b8`, and the
scoreline heatmap used raw `rgba(59,130,246,...)`, instead of the app's theme
tokens. These don't move with the light/dark theme or the blue palette change
made earlier this session (`--color-chart-1/2`, `--color-primary`) — in dark
mode in particular they'd look inconsistent with every other chart in the
app.

**Fix:** swapped to `var(--color-chart-1)` / `var(--color-chart-2)` for the
bars, and `color-mix(in oklch, var(--color-primary) X%, transparent)` for the
heatmap cell intensity.

### 1.5 Cleanup while in there
- Removed an unused `active` variable left over after 1.1's refactor in
  `predictions/page.tsx` (`eslint` flagged it).
- `predictions/page.tsx`: the "X / Y" daily-count display and the "limit
  reached" banner were both gated on `!active` (i.e. hidden for anyone on an
  active trial/paid plan) — but limits can now be finite for active plans too
  (§1.1), so both now key off whether the actual limit is finite
  (`dailyLimit < 9999`) rather than off plan-active status.
- `settings/page.tsx`: refactored the profile/notification/limit form off a
  `useEffect` that synced `useState` from the loaded entitlement query (an
  anti-pattern that also tripped `eslint`'s `react-hooks/set-state-in-effect`)
  to a child component that mounts once the data is available, so form state
  simply initializes from real data instead of syncing into it after the
  fact. Also added a loading spinner instead of rendering empty form fields
  before the query resolves.

### Not fixed — flagged only
`predictions/detail/page.tsx` has the same `set-state-in-effect` lint warning
(reading the stashed prediction from `sessionStorage` in a `useEffect`). I
left it: a correct fix needs `useSyncExternalStore` or similar to avoid an
SSR/hydration mismatch (sessionStorage doesn't exist on the server), which
felt like more surgery than this audit's scope justified for a
lint-only warning with no functional impact. Flagging in case you want it
cleaned up later.

---

## 2. Verification

- `npx tsc --noEmit` — clean.
- `npx eslint` on every touched file — clean.
- `npx next build` — succeeds, all 43 routes (both before and after every
  batch of changes in this audit).
- **Not done:** clicking through the live app / visually checking
  responsiveness at real breakpoints. The dev server needs a working database
  (§0) to render anything past the auth pages — signing in, loading the
  dashboard, running a prediction, etc. all depend on Prisma queries that
  currently fail against the empty database. Once §0 is resolved, worth a
  follow-up pass to actually click through mobile/tablet/desktop rather than
  relying on my read of the Tailwind classes (which consistently use
  `sm:`/`lg:` breakpoints and `overflow-x-auto` on every wide table — the
  patterns look correct, I just couldn't render them to confirm).

---

## 3. Nice-to-haves — not built, would give real value to gamblers

Roughly in priority order, based on what would most help someone actually
using this to inform bets:

1. **Prediction settlement pipeline.** `UserPrediction.result` is written
   nowhere in the codebase — it's `null` for every row, forever. That means:
   the History page's "Win rate" stat is permanently `—`, its per-row
   Win/Loss badges are permanently "Pending", and the Insights page's
   "recently settled" table is permanently empty. This is the single biggest
   gap for a betting-focused product — the entire pitch is "honest,
   trackable predictions," and right now nothing is ever actually tracked to
   a result. Needs: a source of real match results (the Python API may
   already have this via `/insights` for the *model's* global track record,
   but not scoped per fixture the way `user_predictions` needs) and a
   cron/admin job to match fixtures and write `result`.
2. **Accumulator: view/delete a saved slip.** "Recent slips" shows only
   name/pick-count/status/odds — there's no way to expand a saved slip to see
   which picks are in it, no delete button, and no combined win-probability
   (only combined odds, which isn't the same thing and could read as
   "guaranteed" without the caveat).
3. **Watchlist → predictions integration.** Watchlist entries are free-text
   and currently inert — adding "Arsenal" to your watchlist doesn't surface
   Arsenal fixtures anywhere, doesn't autocomplete against real team/league
   names (so typos silently create a dead entry), and there's no notification
   when a watched team/league has a new prediction or fixture.
4. **History: search, filter, and pagination.** Capped at the most recent 100
   rows with no way to filter by league/date/outcome or search by team name.
   Fine today, will become a real usability problem for an active user after
   a few months.
5. **Predictions page: fixture search.** Step 2 (pick a fixture) is a flat
   list — no search/filter by team name, which gets unwieldy for leagues with
   a full matchday of fixtures.
6. **"Add to accumulator" straight from a prediction result.** Right now
   there's no bridge between running a custom prediction (step 3 result card)
   and the accumulator builder — you'd have to separately find the same
   fixture again in the accumulator page's recommendation list.
7. **Personal ROI/streak analytics.** Beyond "day streak" (already real,
   dashboard), there's no view of e.g. "if you'd staked a flat amount on
   every prediction you viewed, what would your run look like" — this
   depends on #1 (settlement) existing first, but would be a strong
   differentiator once it does.
