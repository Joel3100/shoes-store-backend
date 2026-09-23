import axios from "axios";
import { PaymentProvider, InitializePaymentResult, VerifyPaymentResult } from "../payment.types";
import { AppError } from "../../../utils/AppError";

const chapaClient = axios.create({
  baseURL: process.env.CHAPA_BASE_URL,
  headers: {
    Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

export class ChapaProvider implements PaymentProvider {
  name = "CHAPA" as const;

  async initializePayment(params: {
    orderId: string;
    amount: number;
    currency: string;
    customerEmail: string;
  }): Promise<InitializePaymentResult> {
    const txRef = `SHOE-${params.orderId}`;

    try {
      const response = await chapaClient.post("/transaction/initialize", {
        amount: params.amount.toString(),
        currency: params.currency,
        email: params.customerEmail,
        first_name: "Customer",
        last_name: "Order",
        tx_ref: txRef,
        callback_url: process.env.CHAPA_CALLBACK_URL,
        return_url: `${process.env.CHAPA_RETURN_URL}?orderId=${params.orderId}`,
        customization: {
          title: "Shoe Store Order",
          description: `Payment for order ${params.orderId}`,
        },
      });

      return {
        providerRef: txRef,
        redirectUrl: response.data.data.checkout_url,
      };
    } catch (err: any) {
      throw new AppError(
        `Failed to initialize Chapa payment: ${err.response?.data?.message ?? err.message}`,
        502
      );
    }
  }

  async verifyPayment(): Promise<VerifyPaymentResult> {
    throw new Error(
      "ChapaProvider.verifyPayment is implemented in Phase 13, wired to the webhook handler."
    );
  }
}