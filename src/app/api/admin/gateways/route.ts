import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin, listGateways, setGatewayEnabled } from "@/lib/admin";
import { GATEWAY_PROVIDERS } from "@/lib/payments/types";

export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;
  const gateways = await listGateways();
  return NextResponse.json({ gateways });
}

const patchSchema = z.object({
  provider: z.enum(GATEWAY_PROVIDERS as [string, ...string[]]),
  enabled: z.boolean(),
});

export async function PATCH(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  await setGatewayEnabled(parsed.data.provider, parsed.data.enabled);
  return NextResponse.json({ ok: true });
}
