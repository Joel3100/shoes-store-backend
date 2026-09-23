import { PaymentProvider, InitializePaymentResult, VerifyPaymentResult } from "../payment.types";

export class ManualBankProvider implements PaymentProvider {
  name = "MANUAL_BANK" as const;

  async initializePayment(params: {
    orderId: string;
    amount: number;
    currency: string;
    customerEmail: string;
  }): Promise<InitializePaymentResult> {
    return {
      providerRef: `MANUAL-${params.orderId}`,
      instructions: `Transfer ${params.amount} ${params.currency} to CBE account 1000-XXXX-XXXX, then submit your transaction reference and receipt.`,
    };
  }

  async verifyPayment(): Promise<VerifyPaymentResult> {
    throw new Error(
      "ManualBankProvider does not verify automatically — verification is a manual admin action, handled separately in Phase 12."
    );
  }
}