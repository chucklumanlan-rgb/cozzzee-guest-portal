
import Stripe from "stripe";
import { updateGuestRecord, logEvent } from "./firestore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "mock_key", {
  apiVersion: "2023-10-16" as any,
});

// Create PaymentIntent for authorization ONLY
export async function createDepositIntent(reservationId: string, amount = 3000) {
  try {
      const intent = await stripe.paymentIntents.create({
        amount,
        currency: "sgd",
        capture_method: "manual",
        description: `CoZzzee SGD30 Deposit for ${reservationId}`,
        metadata: { reservationId },
      });

      await updateGuestRecord(reservationId, {
        depositIntentId: intent.id,
        depositClientSecret: intent.client_secret || undefined,
        depositStatus: "pending",
      });

      await logEvent(reservationId, "Deposit intent created", intent);

      return intent.client_secret;
  } catch (e) {
      console.error("Stripe Error (Simulated if missing key):", e);
      return "mock_client_secret";
  }
}

// Release deposit authorization after 3 days
export async function releaseDeposit(reservationId: string, paymentIntentId: string) {
  try {
      const result = await stripe.paymentIntents.cancel(paymentIntentId);

      await updateGuestRecord(reservationId, {
        depositStatus: "released",
      });

      await logEvent(reservationId, "Deposit released", result);

      return result;
  } catch (e) {
       console.error("Stripe Release Error:", e);
       return null;
  }
}
