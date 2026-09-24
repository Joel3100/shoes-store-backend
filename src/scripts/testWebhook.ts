import crypto from "crypto";
import axios from "axios";
import "dotenv/config";

const txRef = process.argv[2];

if (!txRef) {
  console.error("Please provide a transaction reference.");
  process.exit(1);
}

const payload = {
  tx_ref: txRef,
  status: "success",
};

const secret = process.env.CHAPA_WEBHOOK_SECRET;

if (!secret) {
  console.error("CHAPA_WEBHOOK_SECRET is not configured.");
  process.exit(1);
}

const signature = crypto
  .createHmac("sha256", secret)
  .update(JSON.stringify(payload))
  .digest("hex");

console.log("Payload:", payload);
console.log("Signature:", signature);

axios
  .post(
    "http://localhost:3000/api/payments/webhook/chapa",
    payload,
    {
      headers: {
        "x-chapa-signature": signature,
      },
    }
  )
  .then((res) => {
    console.log("Status:", res.status);
    console.log("Response:", res.data);
  })
  .catch((err) => {
    console.log("Status:", err.response?.status);
    console.log("Response:", err.response?.data);
  });