export interface InitializePaymentResult {
  providerRef: string;
  redirectUrl?: string;
  instructions?: string;
}

export interface VerifyPaymentResult {
  success: boolean;
  providerRef: string;
  amountPaid?: number;
  rawPayload: unknown;
}

export interface PaymentProvider {
  name: "CHAPA" | "MANUAL_BANK";

  initializePayment(params: {
    orderId: string;
    amount: number;
    currency: string;
    customerEmail: string;
  }): Promise<InitializePaymentResult>;

  verifyPayment(payload: unknown): Promise<VerifyPaymentResult>;
}