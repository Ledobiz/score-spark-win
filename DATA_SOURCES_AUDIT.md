# Dashboard data sources audit — 2026-08-07

You asked me to confirm whether the fixtures shown on the dashboard are real
or dummy data, and to check every other piece of data displayed there for the
same thing. Short answer: **the external Python API is live and reachable
(`PYTHON_API_URL`/`PYTHON_API_KEY` are set in `.env.local`), but the fixture
list and recommendations it returns are synthetic placeholder data, not real
scheduled matches.** Everything else — activity, history, watchlist, plan
gating, single-fixture ML predictions — is real, wired to either your own
database or the model.

I did not change any code for this — this is a report only, per your request.

---

## 1. Confirmed synthetic — fixtures & recommendations

Hit the live endpoints directly against the running app (`GET /api/leagues`,
`GET /api/fixtures?league=epl`, `GET /api/recommendations`) with the external
API configured and reachable. The response is **not** our local
`MOCK_FIXTURES` fallback in `src/lib/predictions/service.ts` (different id
format, an extra `worldcup` league our local `LEAGUES` const doesn't even
have, 8 fixtures per league instead of our mock's 4) — this is genuinely
coming from `https://sportan-prediction-api.onrender.com`.

But the fixtures themselves are clearly placeholder data:

```
Premier League: Arsenal vs Aston Villa, Birmingham vs Blackburn,
Blackpool vs Bolton, Bournemouth vs Bradford, Brentford vs Brighton,
Burnley vs Cardiff, Charlton vs Chelsea, Coventry vs Crystal Palace
```

Every league's fixture list is just that league's clubs **sorted
alphabetically and paired off two-by-two** (Birmingham, Blackpool, Bradford,
Charlton, Coventry haven't been Premier League teams in years). This is a
generated list, not a real fixture calendar.

`GET /api/recommendations` confirms it from the other side — the upstream API
sets `"synthetic": true` on every single recommendation it returns, and some
entries are visibly malformed (`"fixture":"Fortuna Freiburg"` missing the
`vs`, `"id":"Bundesliga|Fortuna 1.5"` with the market string bled into the id).
Our own `mockRecommendations()` in `service.ts` sets `synthetic: true` too —
so this flag is doing its job, it's just that the *external* API is the one
returning synthetic data here, not our fallback.

**Where this shows up in the UI:**
- Dashboard → "Today's recommendations" table (all six market tabs)
- Predictions flow → step 1 (league) is real, step 2 (fixture list) is the
  synthetic list above

**Not a code bug on this side** — `callExternal()` is doing exactly what it
should (calling the configured API, returning what it gets). This needs a fix
on the Python API / upstream data source, or the fixtures endpoint there needs
to be pointed at a real fixtures provider.

## 2. Confirmed real — single-fixture prediction

Calling `POST /api/predictions/detailed` for one of the fake fixtures above
(`Arsenal vs Aston Villa`) returned `"method": "ml"` (not `"mock"`) with a
real-looking model output — win/draw/away probabilities, ELO ratings, xG,
score matrix, etc. So once you pick a fixture, the *prediction itself* is a
genuine model call, not `mockDetailed()`. The problem is upstream of this: the
fixture you're predicting on was never a real scheduled match to begin with.

This is used on: predictions step 3 (result), and `predictions/detail`.

## 3. Confirmed real — everything backed by your own database

These all read from Prisma / your Postgres instance, scoped to the logged-in
user, and were verified to update correctly after a live action (made one
detailed prediction, then re-fetched — counts went from 0→1 everywhere):

- **Dashboard → "Predictions viewed (7d)" chart, "Top league", "Day streak"**
  — `GET /api/activity`, from `UserActivity`, real per-user events.
- **Dashboard → "Model win rate"** — `GET /api/stats`, real (currently
  `success_rate: null` because nothing's settled yet; falls back to the
  honest ~54.5% placeholder only if the external API is unreachable, per the
  honesty guardrail in `CLAUDE.md`).
- **History page** — `GET /api/history`, from `UserPrediction`, confirmed
  showed the real Arsenal vs Aston Villa entry after making it.
- **Insights page** — `GET /api/insights`, real per-user counts (`predictions:
  1, pending: 1` after the same test), `recent` list matches.
- **Watchlist** — `GET /api/watchlist`, empty array for a fresh user, real
  DB-backed CRUD.
- **Accumulator lock state, plan badge, trial days left, daily limit
  counters** — all from `loadEntitlement()`/`computeEntitlement()`
  (`src/lib/entitlement.ts`, `src/lib/plans.ts`), reading the real
  `Subscription`/`Plan` rows.

## 4. Not checked

- `/insights` "Calibration" chart and "Confidence tiers" — these read the same
  `stats`/`tiers` shape from the external API; given the fixtures/recs feeding
  the model are synthetic, any settled predictions that eventually populate
  these will also trace back to fake fixtures until the fixtures endpoint is
  fixed upstream. Didn't independently re-verify since there's no settled data
  yet to inspect.
- The admin panel's activity/user overview pages — out of scope of "the
  dashboard" as you described it; happy to run the same check there if useful.

## 5. Suggested next step

Since the ML prediction call itself is real, the only gap is the fixtures
source. Worth checking with whoever owns `sportan-prediction-api.onrender.com`
whether `/leagues` and `/fixtures` are meant to hit a real fixtures provider
(e.g. an odds/fixtures API) and are just misconfigured/not-yet-wired, or
whether that's deliberately a placeholder for now.

---

## 6. Admin panel — Users / Plans / Activity tabs — 2026-08-07

You asked me to check the admin panel too. Traced every tab in
`src/app/(app)/admin/page.tsx` back through `src/lib/admin.ts` to its Prisma
query, and confirmed the auth guard on each `/api/admin/*` route. Summary:
**everything the admin UI reads and writes is real database data with a
correctly-enforced admin check on every route — except one dead widget, and
one access gap you'll want to close.**

### Confirmed real — Users tab, Plans tab, user detail sheet

- `GET /api/admin/users` (`listUsers()`) — real, joins `Profile` +
  `Subscription` + `UserRole`.
- `GET /api/admin/users/:id` (`getUserDetail()`) — real, scoped to that user:
  profile, subscription, `UserActivity`, `BetSlip`, `AdminAuditLog`.
- `POST /api/admin/roles` (`setRole()`) — real, writes `UserRole`.
- `POST /api/admin/subscription` (`changePlan()`) — real, writes
  `Subscription` + an `AdminAuditLog` row (audit trail actually gets used, not
  just displayed).
- `GET`/`PATCH /api/admin/plans` (`listPlans()`/`updatePlan()`) — real, reads
  and writes the `Plan` table that `computeEntitlement()` depends on.
- Activity tab's **"Total users"** stat and **"Recent user activity"** table —
  real (`Profile.count()`, `UserActivity`).
- Activity tab's **subscription-status badges** — real (`Subscription`
  grouped by plan/status).

Every one of the six route handlers under `src/app/api/admin/**` calls
`requireAdmin()` first and returns a 401/403 `NextResponse` directly if the
caller isn't authed or doesn't hold the `admin` role — no gaps there.

### Confirmed dead — Activity tab's "Recommendations" stat + table

`listActivityOverview()` (`src/lib/admin.ts`) populates the **"Recent
recommendations" table** and the **"Recommendations" stat count** from
`prisma.recommendation.findMany()` — the legacy `Recommendation` table
`CLAUDE.md` already documents as unused ("the dashboard/predictions pages now
get recommendations from the Python API... not this table").

I confirmed this two ways:
- Repo-wide grep for `prisma.recommendation.create` / `.createMany` /
  `.upsert` — **zero matches**, nothing ever writes to it.
- Live query against the actual database: **`Recommendation` table row count:
  0.**

So that stat will permanently read "0" and that table will always be empty,
even while the app is actively serving and displaying plenty of real
recommendations elsewhere (dashboard "Today's recommendations", via the
external Python API — see §1). This isn't fake/misleading data being shown —
it's an honestly-empty widget — but it's dead weight pointing at a table
nothing feeds. Either wire it to something real (e.g. a count of
`UserPrediction`/`UserActivity` rows of type "recommendation viewed") or
remove it.

### Worth flagging — no admin account currently exists

I ran a live query against `UserRole` for `role = "admin"`: **0 rows.**
Nobody currently holds the admin role in this database, which means `/admin`
and every `/api/admin/*` route is unreachable right now — `requireAdmin()`
would 403 any account that tried it, including yours. The earlier commit
"Enabled admin access for you" predates this Prisma/Auth.js stack (it was
against the old Supabase-based system before the migration), so it didn't
carry over. You'll need to grant yourself the `admin` role directly via
`npm run db:studio` (or a one-off script) before the admin panel is usable
again on this branch.
