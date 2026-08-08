/**
 * Seeds the initial plan catalog and payment gateway config. Plans are fully
 * admin-managed (CRUD) — these four rows are just a starting point, not ids
 * anything in the app assumes exist. Idempotent (upsert), safe to re-run.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const FREE_FEATURES = [
  "3 daily recommendations per market",
  "3 custom predictions per day",
  "Prediction history",
];

const PAID_FEATURES = [
  "Full daily recommendations across all markets",
  "Accumulator / bet-slip builder",
  "Exportable prediction history",
  "Watchlist for leagues & teams",
];

const plans = [
  {
    id: "free_trial",
    name: "Free Trial",
    interval: "7 days",
    intervalDays: 7,
    priceNgn: 0,
    dailyRecommendationLimit: 3,
    dailyCustomPredictionLimit: 3,
    canUseAccumulator: false,
    canExportHistory: false,
    isActive: true,
    features: FREE_FEATURES,
    sortOrder: 0,
  },
  {
    id: "weekly",
    name: "Weekly",
    interval: "week",
    intervalDays: 7,
    priceNgn: 2500,
    dailyRecommendationLimit: 50,
    dailyCustomPredictionLimit: 20,
    canUseAccumulator: true,
    canExportHistory: true,
    isActive: true,
    features: PAID_FEATURES,
    sortOrder: 1,
  },
  {
    id: "monthly",
    name: "Monthly",
    interval: "month",
    intervalDays: 30,
    priceNgn: 8000,
    dailyRecommendationLimit: 100,
    dailyCustomPredictionLimit: 50,
    canUseAccumulator: true,
    canExportHistory: true,
    isActive: true,
    features: PAID_FEATURES,
    sortOrder: 2,
  },
  {
    id: "annual",
    name: "Annual",
    interval: "year",
    intervalDays: 365,
    priceNgn: 75000,
    dailyRecommendationLimit: 200,
    dailyCustomPredictionLimit: 100,
    canUseAccumulator: true,
    canExportHistory: true,
    isActive: true,
    features: PAID_FEATURES,
    sortOrder: 3,
  },
];

for (const plan of plans) {
  await prisma.plan.upsert({
    where: { id: plan.id },
    update: plan,
    create: plan,
  });
}

console.log(`Seeded ${plans.length} plans.`);

const gateways = ["flutterwave", "paystack"];
for (const provider of gateways) {
  await prisma.paymentGatewayConfig.upsert({
    where: { provider },
    update: {},
    create: { provider, enabled: false },
  });
}

console.log(`Seeded ${gateways.length} payment gateway configs (disabled by default).`);
await prisma.$disconnect();
