import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAuthedUser } from "@/lib/auth/server";
import { initiatePayment } from "@/lib/payments";
import { GATEWAY_PROVIDERS } from "@/lib/payments/types";

const bodySchema = z.object({
  planId: z.string(),
  provider: z.enum(GATEWAY_PROVIDERS as [string, ...string[]]),
});

export async function POST(request: NextRequest) {
  const user = await getAuthedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const { redirectUrl } = await initiatePayment(
      user.id,
      parsed.data.planId,
      parsed.data.provider as "flutterwave" | "paystack",
    );
    return NextResponse.json({ redirectUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not start payment";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
