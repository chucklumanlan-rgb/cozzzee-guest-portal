import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  collection,
  addDoc,
} from "firebase/firestore/lite";

import { db, now } from "./firebase";

// Aligning with 'Reservation' type from types.ts, though simpler for Firestore helpers
export type GuestRecord = {
  reservationId: string;
  email: string;
  phone?: string;
  fullName: string;
  passportUrl?: string;
  passportVerified?: boolean;
  termsAccepted?: boolean;
  signatureUrl?: string;
  depositStatus?: "pending" | "authorized" | "released" | "failed";
  depositIntentId?: string;
  depositClientSecret?: string;
  checkinStatus:
    | "not_started"
    | "passport_uploaded"
    | "terms_signed"
    | "deposit_authorized"
    | "completed";
  createdAt: any;
  updatedAt: any;
};

// UPDATED: Use 'reservations' collection to match Cloud Functions and mockApi
const guestRef = (reservationId: string) =>
  doc(db, "reservations", reservationId);

export async function initGuestRecord(data: GuestRecord) {
  await setDoc(guestRef(data.reservationId), {
    ...data,
    createdAt: now(),
    updatedAt: now(),
  });
}

export async function getGuestRecord(reservationId: string) {
  const snap = await getDoc(guestRef(reservationId));
  return snap.exists() ? snap.data() : null;
}

export async function updateGuestRecord(
  reservationId: string,
  data: Partial<GuestRecord>
) {
  await updateDoc(guestRef(reservationId), {
    ...data,
    updatedAt: now(),
  });
}

export async function logEvent(
  reservationId: string,
  message: string,
  meta?: any
) {
  // Store events in subcollection
  await addDoc(collection(db, "reservations", reservationId, "events"), {
    message,
    meta: meta || null,
    createdAt: now(),
  });
}
