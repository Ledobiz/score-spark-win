-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "referral_code" TEXT,
ADD COLUMN     "referred_by_id" UUID;

-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "referrals_per_point" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "referral_credits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "referrer_id" UUID NOT NULL,
    "plan_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_credits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_redemptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "plan_id" TEXT NOT NULL,
    "points_used" INTEGER NOT NULL,
    "period_end_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "referral_credits_referrer_id_plan_id_idx" ON "referral_credits"("referrer_id", "plan_id");

-- CreateIndex
CREATE INDEX "referral_redemptions_user_id_idx" ON "referral_redemptions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_referral_code_key" ON "profiles"("referral_code");

-- AddForeignKey
ALTER TABLE "referral_credits" ADD CONSTRAINT "referral_credits_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_redemptions" ADD CONSTRAINT "referral_redemptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

