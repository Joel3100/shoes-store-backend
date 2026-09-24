import axios from "axios";
import { PaymentProvider, InitializePaymentResult, VerifyPaymentResult } from "../payment.types";
import { AppError } from "../../../utils/AppError";
import crypto from "crypto";

function getChapaClient() {
  return axios.create({
    baseURL: process.env.CHAPA_BASE_URL,
    headers: {
      Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  });
}

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
      const response = await getChapaClient().post("/transaction/initialize", {
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

  async verifyPayment(payload: any): Promise<VerifyPaymentResult> {
    const txRef = payload?.tx_ref;

    if (!txRef) {
      throw new AppError("Webhook payload missing tx_ref", 400);
    }

    const response = await getChapaClient().get(`/transaction/verify/${txRef}`);
    const data = response.data.data;

    return {
      success: data.status === "success",
      providerRef: txRef,
      amountPaid: Number(data.amount),
      rawPayload: payload,
    };
  }
}

export function verifyChapaSignature(payload: unknown, signatureHeader: string | undefined): boolean {
  if (!signatureHeader) return false;

  const expected = crypto
    .createHmac("sha256", process.env.CHAPA_WEBHOOK_SECRET as string)
    .update(JSON.stringify(payload))
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
}