import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";
import Stripe from "stripe";
import { GoogleGenAI } from "@google/genai";

admin.initializeApp();
const db = admin.firestore();

// ----------------------------------------------------------------------
// ENVIRONMENT CONFIGURATION
// ----------------------------------------------------------------------
const CLOUDBEDS_CLIENT_ID = process.env.CLOUDBEDS_CLIENT_ID || "live1_20205_a1ozIHWMfX7s92nqDliYBcZQ";
const CLOUDBEDS_CLIENT_SECRET = process.env.CLOUDBEDS_CLIENT_SECRET || "fAXc4CtnaoeQlK7M8S6Jsj9VEvIwpxWG";
const CLOUDBEDS_API_KEY = process.env.CLOUDBEDS_API_KEY || "cbat_3XhxsR2GvVQILcLLZ9XOk5Qims8F073P"; 
const CLOUDBEDS_PROPERTY_ID = "20205";

// Initialize Stripe
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_mock";
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" as any });

// Initialize Gemini
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || process.env.API_KEY || "YOUR_GEMINI_KEY_HERE"; 
const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });

// ----------------------------------------------------------------------
// HELPER: DATABASE LOGGING
// ----------------------------------------------------------------------
async function logEvent(reservationId: string, message: string, meta: any = {}) {
    try {
        await db.collection("reservations").doc(reservationId).collection("events").add({
            message,
            meta,
            created_at: admin.firestore.FieldValue.serverTimestamp()
        });
    } catch (e) {
        console.error("Failed to log event:", e);
    }
}

async function updateGuestStatus(reservationId: string, updates: any) {
    try {
        await db.collection("reservations").doc(reservationId).set(updates, { merge: true });
    } catch (e) {
        console.error("Failed to update guest status:", e);
    }
}

// ----------------------------------------------------------------------
// HELPER: CLOUDBEDS API
// ----------------------------------------------------------------------
async function getCloudbedsAccessToken(): Promise<string> {
    try {
        const tokenDoc = await db.collection("system").doc("cloudbeds_token").get();
        if (tokenDoc.exists) {
            const data = tokenDoc.data();
            if (data && data.expires_at && data.expires_at.toMillis() > Date.now() + 60000) {
                return data.access_token;
            }
        }
    } catch (e) {
        console.warn("Failed to read token cache:", e);
    }
    return CLOUDBEDS_API_KEY;
}

async function callCloudbedsAPI(endpoint: string, params: any = {}, retryCount = 0): Promise<any> {
    const token = await getCloudbedsAccessToken();
    const isStaticKey = token.startsWith("cbat_");

    try {
        const headers: any = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        if (isStaticKey) {
            headers['x-api-key'] = token;
        } else {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const finalParams = { ...params, propertyID: CLOUDBEDS_PROPERTY_ID };

        const response = await axios.get(endpoint, { params: finalParams, headers, validateStatus: () => true });

        if (response.status === 401) {
            if (retryCount < 1) {
                throw new Error("Cloudbeds 401 Unauthorized");
            }
        }
        return response.data;
    } catch (error) {
        console.error("API Call Failed:", error);
        throw error;
    }
}

// ----------------------------------------------------------------------
// HELPER: DATA MAPPING
// ----------------------------------------------------------------------
function mapCloudbedsToApp(cloudbedsData: any) {
    return {
        reservation_id: cloudbedsData.reservationID,
        property_id: cloudbedsData.propertyID,
        data_source: 'cloudbeds_live',
        guest_details: {
            firstName: cloudbedsData.guestFirstName || cloudbedsData.first_name || "",
            lastName: cloudbedsData.guestLastName || cloudbedsData.last_name || "",
            email: cloudbedsData.guestEmail || cloudbedsData.email || "",
            phone: cloudbedsData.guestPhone || cloudbedsData.phone || ""
        },
        dates: {
            checkin: cloudbedsData.startDate || cloudbedsData.start_date,
            checkout: cloudbedsData.endDate || cloudbedsData.end_date
        },
        pms_status: cloudbedsData.status,
        pre_checkin_started: true
    };
}

// ----------------------------------------------------------------------
// FUNCTION 1: SYNC RESERVATION
// ----------------------------------------------------------------------
export const syncReservationFromCloudbeds = functions.https.onCall(async (data: any, context: any) => {
    const payload = (data && data.data) ? data.data : data;
    if (!payload) return { success: false, message: "Missing data payload" };

    const { reservationId, firstName, lastName, checkInDate } = payload;
    const targetId = reservationId ? String(reservationId).trim() : null;
    const searchName = ((firstName || "") + " " + (lastName || "")).toLowerCase();
    
    // DEMO BYPASS
    if (targetId === "12345" || targetId === "7320576071587" || (searchName.includes('yang') && searchName.includes('ding'))) {
         const demoRes = {
            reservation_id: targetId || "7320576071587",
            property_id: "prop_demo",
            data_source: 'demo_fallback',
            guest_details: {
                firstName: firstName || "Yang",
                lastName: lastName || "Ding",
                email: "guest @example.com",
                phone: "+12345678"
            },
            dates: {
                checkin: checkInDate || "2025-11-25",
                checkout: "2025-11-26"
            },
            pms_status: "confirmed",
            pre_checkin_started: false,
            pre_checkin_complete: false,
            steps: {
                guest_details_complete: false,
                passport_complete: false,
                tnc_accepted: false,
                deposit_status: "pending"
            },
            access_code: "8899#",
            wifi_ssid: "CoZzzee_Guest",
            wifi_pass: "SleepTight"
        };
        await db.collection("reservations").doc(demoRes.reservation_id).set(demoRes, { merge: true });
        return { success: true, reservation: demoRes, source: 'cloudbeds_simulated' };
    }

    // REAL SYNC
    try {
        let cloudbedsData = null;
        if (targetId) {
            const response = await callCloudbedsAPI('https://hotels.cloudbeds.com/api/v1.1/getReservation', { reservationID: targetId });
            if (response.success) cloudbedsData = response.data;
        } else if (firstName && lastName) {
            const guestSearch = await callCloudbedsAPI('https://hotels.cloudbeds.com/api/v1.1/getGuests', { query: `${firstName} ${lastName}` });
            if (guestSearch.success && guestSearch.data && guestSearch.data.length > 0) {
                 const guestID = guestSearch.data[0].guestID;
                 const resSearch = await callCloudbedsAPI('https://hotels.cloudbeds.com/api/v1.1/getReservations', { guestID, status: 'confirmed,checked_in,not_confirmed' });
                 if (resSearch.success && resSearch.data && resSearch.data.length > 0) {
                     const relevant = resSearch.data.sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
                     const fullRes = await callCloudbedsAPI('https://hotels.cloudbeds.com/api/v1.1/getReservation', { reservationID: relevant.reservationID });
                     if (fullRes.success) cloudbedsData = fullRes.data;
                 }
            }
        }

        if (cloudbedsData) {
            const mappedRes = mapCloudbedsToApp(cloudbedsData);
            const docRef = db.collection("reservations").doc(mappedRes.reservation_id);
            const existing = await docRef.get();
            let finalData = mappedRes;

            if (!existing.exists) {
                finalData = {
                    ...mappedRes,
                    // @ts-ignore
                    steps: {
                        guest_details_complete: true,
                        passport_complete: false,
                        tnc_accepted: false,
                        deposit_status: 'pending'
                    }
                };
            }
            
            await docRef.set(finalData, { merge: true });
            return { success: true, reservation: finalData, source: 'cloudbeds_live' };
        }
        return { success: false, message: "Reservation not found in Cloudbeds" };
    } catch (error: any) {
        return { success: false, message: error.message || "Backend Sync Failed" };
    }
});

// ----------------------------------------------------------------------
// FUNCTION 2: ANALYZE PASSPORT
// ----------------------------------------------------------------------
export const analyzePassport = functions.https.onCall(async (data: any, context: any) => {
    const payload = (data && data.data) ? data.data : data;
    const { imageBase64 } = payload || {};

    if (!imageBase64) throw new functions.https.HttpsError('invalid-argument', 'Missing image data');

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    { inlineData: { mimeType: "image/jpeg", data: imageBase64 } },
                    { text: "Extract passport details in JSON." }
                ]
            },
            config: {
                systemInstruction: "You are a precise document extraction AI. Extract: First Name, Last Name, Passport Number, Nationality, and Date of Birth (YYYY-MM-DD). Return JSON.",
                responseMimeType: "application/json"
            }
        });

        const text = response.text;
        if (!text) throw new Error("No text response");
        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (error: any) {
        throw new functions.https.HttpsError('internal', 'Passport analysis failed');
    }
});

// ----------------------------------------------------------------------
// FUNCTION 3: CREATE DEPOSIT INTENT
// ----------------------------------------------------------------------
export const createDepositIntent = functions.https.onCall(async (data: any, context: any) => {
    const payload = (data && data.data) ? data.data : data;
    const { reservationId } = payload || {};
    
    if (!reservationId) throw new functions.https.HttpsError('invalid-argument', 'Missing reservationId');

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 3000, 
            currency: "sgd",
            description: `Security Deposit for Reservation ${reservationId}`,
            metadata: { reservationId },
            capture_method: 'manual', 
        });

        await logEvent(reservationId, "Deposit Intent Created", { pi: paymentIntent.id });
        await updateGuestStatus(reservationId, { depositIntentId: paymentIntent.id, depositStatus: 'pending' });
        return { clientSecret: paymentIntent.client_secret };
    } catch (error: any) {
        throw new functions.https.HttpsError('internal', 'Payment initialization failed');
    }
});

// ----------------------------------------------------------------------
// FUNCTION 4: STRIPE WEBHOOK
// ----------------------------------------------------------------------
export const stripeWebhook = functions.https.onRequest(async (req: any, res: any) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    try {
        if (endpointSecret && sig) event = stripe.webhooks.constructEvent(req.rawBody, sig as string, endpointSecret);
        else event = req.body;
    } catch (err: any) {
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    const intent = event.data.object as Stripe.PaymentIntent;
    const reservationId = intent.metadata?.reservationId;

    if (reservationId && (event.type === 'payment_intent.amount_capturable_updated' || event.type === 'payment_intent.succeeded')) {
         await updateGuestStatus(reservationId, { steps: { deposit_status: 'authorized' } });
         await logEvent(reservationId, "Deposit Authorized", { id: intent.id });
    }
    res.json({received: true});
});

// ----------------------------------------------------------------------
// FUNCTION 5: UTILS
// ----------------------------------------------------------------------
export const testConnection = functions.https.onCall(async (data: any, context: any) => {
    try {
        const res = await callCloudbedsAPI('https://hotels.cloudbeds.com/api/v1.1/getHotelDetails');
        if (res.success) return { success: true, message: `✅ Connected! Property: ${res.data.propertyName || 'Verified'}` };
        return { success: false, message: "❌ Credentials Invalid" };
    } catch (e: any) {
        return { success: false, message: `❌ Connection Failed: ${e.message}` };
    }
});

export const syncDailyArrivals = functions.https.onCall(async (data: any, context: any) => {
    try {
        // Robust Sync: Check Yesterday, Today, and Tomorrow to handle timezones
        const now = new Date();
        const datesToCheck = [
            new Date(now.getTime() - 86400000).toISOString().split('T')[0], // Yesterday
            now.toISOString().split('T')[0], // Today
            new Date(now.getTime() + 86400000).toISOString().split('T')[0]  // Tomorrow
        ];
        
        console.log(`Syncing arrivals for: ${datesToCheck.join(', ')}`);

        let totalSynced = 0;
        const batch = db.batch();
        const processedIds = new Set();

        for (const date of datesToCheck) {
            const res = await callCloudbedsAPI('https://hotels.cloudbeds.com/api/v1.1/getReservations', { 
                checkInFrom: date, 
                checkInTo: date,
                status: 'confirmed,checked_in,not_confirmed'
            });

            if (res.success && res.data) {
                for (const booking of res.data) {
                    if (processedIds.has(booking.reservationID)) continue; // Avoid duplicates across dates
                    
                    processedIds.add(booking.reservationID);
                    const mappedData = mapCloudbedsToApp(booking);
                    const docRef = db.collection("reservations").doc(mappedData.reservation_id);
                    batch.set(docRef, mappedData, { merge: true });
                    totalSynced++;
                }
            }
        }
        
        if (totalSynced > 0) {
            await batch.commit();
            return { success: true, count: totalSynced, message: `Synced ${totalSynced} arrivals across 3 days.` };
        }
        
        return { success: false, message: "No arrivals found (checked Yesterday, Today, Tomorrow)" };
    } catch (e: any) {
        console.error("Bulk Sync Error", e);
        return { success: false, message: e.message };
    }
});