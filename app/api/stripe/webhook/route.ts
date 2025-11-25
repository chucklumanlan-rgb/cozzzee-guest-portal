
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { updateGuestRecord, logEvent } from "../../../../lib/firestore";

export const runtime = "nodejs"; // Needed for Stripe signature verification

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as any,
});

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature")!;

  // Stripe requires raw text — NOT JSON
  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("❌ Stripe Webhook Signature Error:", err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, {
      status: 400,
    });
  }

  //--------------------------------------------------------------
  // 🎯 Handle Webhook Events
  //--------------------------------------------------------------
  switch (event.type) {
    /* --------------------------------------------------------- */
    /* 1. Deposit Authorized (Our main success case)             */
    /* --------------------------------------------------------- */
    case "payment_intent.succeeded": {
      const intent = event.data.object as Stripe.PaymentIntent;
      const reservationId = intent.metadata.reservationId;

      await updateGuestRecord(reservationId, {
        depositStatus: "authorized",
      });

      await logEvent(reservationId, "Deposit Authorized (Stripe Success)", {
        paymentIntentId: intent.id,
      });

      break;
    }

    /* --------------------------------------------------------- */
    /* 2. Payment Failed (Card declined, etc.)                   */
    /* --------------------------------------------------------- */
    case "payment_intent.payment_failed": {
      const intent = event.data.object as Stripe.PaymentIntent;
      const reservationId = intent.metadata.reservationId;

      await updateGuestRecord(reservationId, {
        depositStatus: "failed",
      });

      await logEvent(reservationId, "Deposit Authorization Failed", {
        paymentIntentId: intent.id,
      });

      break;
    }

    /* --------------------------------------------------------- */
    /* 3. Payment Intent Canceled (We release hold after checkout) */
    /* --------------------------------------------------------- */
    case "payment_intent.canceled": {
      const intent = event.data.object as Stripe.PaymentIntent;
      const reservationId = intent.metadata.reservationId;

      await updateGuestRecord(reservationId, {
        depositStatus: "released",
      });

      await logEvent(reservationId, "Deposit Authorization Canceled/Released", {
        paymentIntentId: intent.id,
      });

      break;
    }

    default:
      console.log("Unhandled Stripe event:", event.type);
      break;
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
