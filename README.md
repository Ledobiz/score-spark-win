# Sport Savvy

Build a sports betting predictions web app called "PredictPro" (rename freely).

STACK: React + Tailwind + shadcn/ui, with Supabase for auth, Postgres, and edge functions.

DESIGN: Modern and sporty, data-dense but clean. Dark theme by default with a vibrant

accent (electric green). Card-based layouts, clear typography, subtle motion, fully

mobile-responsive. Include a light/dark toggle.

SCREENS & FLOWS:

1. AUTH — Register, login, forgot-password/reset using Supabase Auth (email+password and

   Google OAuth). Require email verification.

2. ONBOARDING / PLANS — Right after signup, the user picks a plan on a pricing table with a

   feature-comparison grid:

   - Free Trial (14 days, no card required)

   - Weekly, Monthly, Annual (paid)

   Integrate Paystack for payments in NGN. Store the plan, status, and trial/renewal expiry

   in Supabase.

3. PLAN GATING — Free/trial users are restricted: they can view only 3 of the daily

   recommendations per category, get a limited number of custom predictions per day, and

   cannot use the accumulator builder or export history. Show clear lock states and

   "Upgrade" prompts on gated features.

4. DASHBOARD —

   - Header: greeting, current-plan badge, and a trial countdown when applicable.

   - A 7-day activity breakdown using recharts: predictions viewed, win-rate of followed

     tips, most-viewed leagues, current streak — shown as stat cards + charts.

   - Recommendation tables, split by market in tabs or sections: Home Wins (10),

     Away Wins (10), Draws, Both Teams To Score, Over 1.5, Over 2.5, etc. Each row shows:

     fixture, league, kickoff time, market, confidence %, and odds. Sortable/filterable.

5. PREDICTIONS PAGE — a 3-step flow:

   - Step 1: choose sport/league (EPL, La Liga, Serie A, Bundesliga, Ligue 1, etc.)

   - Step 2: choose a fixture from that league

   - Step 3: show the prediction — predicted outcome, probabilities per market (1X2, BTTS,

     Over/Under), a confidence score, and a short form/H2H summary.

INTEGRATION — Predictions and recommendations come from MY external Python API. Create

Supabase Edge Functions that proxy to it, reading the base URL and API key from secrets:

`get-leagues`, `get-fixtures`, `get-prediction`, `get-recommendations`. For now, return

realistic MOCK data from these functions so the UI is fully usable, but keep the fetch

wiring in place so I can drop in my real endpoints.

EXTRA FEATURES:

- Accumulator/bet-slip builder (combine multiple tips, see combined odds).

- Prediction history + performance tracking (track how the system's past tips resolved).

- Watchlist/favorites for leagues and teams.

- Notification preferences (daily-tips email opt-in).

- Profile/settings: manage subscription, billing history, cancel/upgrade.

- Responsible gambling: 18+ age confirmation at signup, a persistent disclaimer footer,

  and a user-set daily view limit.

- An `is_admin` role flag on profiles.

DATA MODEL (Supabase tables): profiles, plans, subscriptions, recommendations,

predictions_cache, user_activity, watchlist, bet_slips.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://score-spark-win.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2462e44b-073d-4219-904d-de78171de87f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
