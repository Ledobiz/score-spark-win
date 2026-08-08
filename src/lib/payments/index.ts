import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { flutterwaveClient } from "./flutterwave";
import { paystackClient } from "./paystack";
import { GATEWAY_PROVIDERS, type GatewayProvider, type PaymentGatewayClient, type VerifyResult } from "./types";

export type { GatewayProvider } from "./types";
export { GATEWAY_PROVIDERS } from "./types";

const DAY_MS = 86_400_000;

function clientFor(provider: GatewayProvider): PaymentGatewayClient {
  return provider === "flutterwave" ? flutterwaveClient : paystackClient;
}

/** Env-var presence only — never exposes key values. */
export function hasKeysConfigured(provider: GatewayProvider): boolean {
  if (provider === "flutterwave") return !!process.env.FLUTTERWAVE_SECRET_KEY;
  if (provider === "paystack") return !!process.env.PAYSTACK_SECRET_KEY;
  return false;
}

/** Providers an admin has toggled on AND that have real API keys in env. */
export async function getEnabledGateways(): Promise<GatewayProvider[]> {
  const configs = await prisma.paymentGatewayConfig.findMany({ where: { enabled: true } });
  return configs
    .map((c) => c.provider)
    .filter((p): p is GatewayProvider => (GATEWAY_PROVIDERS as string[]).includes(p))
    .filter(hasKeysConfigured);
}

export async function initiatePayment(
  userId: string,
  planId: string,
  provider: GatewayProvider,
): Promise<{ redirectUrl: string }> {
  const enabled = await getEnabledGateways();
  if (!enabled.includes(provider)) {
    throw new Error("This payment method is currently unavailable");
  }

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan || !plan.isActive || plan.priceNgn <= 0) {
    throw new Error("Select a valid paid plan");
  }

  const user = await prisma.profile.findUnique({ where: { id: userId } });
  if (!user?.email) throw new Error("Your account has no email on file");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) throw new Error("App URL is not configured");

  const reference = `ps_${randomBytes(12).toString("hex")}`;
  await prisma.payment.create({
    data: {
      userId,
      planId,
      provider,
      reference,
      amountNgn: plan.priceNgn,
      status: "pending",
    },
  });

  const { redirectUrl } = await clientFor(provider).initiate({
    reference,
    amountNgn: plan.priceNgn,
    email: user.email,
    redirectUrl: `${appUrl}/api/payments/callback/${provider}`,
  });
  return { redirectUrl };
}

/**
 * Verifies a payment with the gateway and, if genuinely successful, activates
 * the subscription. Idempotent — safe to call from both the redirect callback
 * and the webhook for the same payment. `transactionId` is only needed for
 * Flutterwave (its verify endpoint is keyed by the gateway's numeric id, not
 * our reference).
 */
export async function verifyAndActivate(
  provider: GatewayProvider,
  args: { reference: string; transactionId?: string },
): Promise<{ success: boolean }> {
  const payment = await prisma.payment.findUnique({ where: { reference: args.reference } });
  if (!payment || payment.provider !== provider) return { success: false };
  if (payment.status === "success") return { success: true };

  const identifier = provider === "flutterwave" ? args.transactionId : args.reference;
  if (!identifier) return { success: false };

  let result: VerifyResult;
  try {
    result = await clientFor(provider).verify(identifier);
  } catch {
    return { success: false };
  }

  if (
    !result.success ||
    result.ourReference !== payment.reference ||
    result.amountNgn < payment.amountNgn
  ) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "failed", providerRef: result.providerRef || null },
    });
    return { success: false };
  }

  const plan = await prisma.plan.findUnique({ where: { id: payment.planId } });
  if (!plan) {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "failed" } });
    return { success: false };
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "success", providerRef: result.providerRef },
  });

  const periodEnd = new Date(Date.now() + (plan.intervalDays || 30) * DAY_MS);
  const subData = {
    planId: plan.id,
    status: "active",
    trialEndsAt: null,
    currentPeriodEnd: periodEnd,
    paymentRef: payment.reference,
    paymentProvider: provider,
  };
  const existing = await prisma.subscription.findFirst({ where: { userId: payment.userId } });
  if (existing) {
    await prisma.subscription.update({ where: { id: existing.id }, data: subData });
  } else {
    await prisma.subscription.create({ data: { userId: payment.userId, ...subData } });
  }

  return { success: true };
}
