export type GatewayProvider = "flutterwave" | "paystack";

export const GATEWAY_PROVIDERS: GatewayProvider[] = ["flutterwave", "paystack"];

export interface InitiateArgs {
  reference: string;
  amountNgn: number;
  email: string;
  redirectUrl: string;
}

export interface InitiateResult {
  redirectUrl: string;
}

export interface VerifyResult {
  success: boolean;
  /** The gateway's own transaction id/reference — stored on our Payment row. */
  providerRef: string;
  /** The reference *we* generated at initiate time, echoed back by the gateway — cross-checked against the stored Payment.reference. */
  ourReference: string;
  amountNgn: number;
}

export interface PaymentGatewayClient {
  initiate(args: InitiateArgs): Promise<InitiateResult>;
  /** `identifier` is whatever the provider's redirect/webhook gives us to look the transaction up by. */
  verify(identifier: string): Promise<VerifyResult>;
}
