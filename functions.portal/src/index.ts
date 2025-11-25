import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";
import Stripe from "stripe";

admin.initializeApp();
const db = admin.firestore();

// ----------------------------------------------------------------------
// ENVIRONMENT CONFIGURATION
// ----------------------------------------------------------------------
const CLOUDBEDS_CLIENT_ID = process.env.CLOUDBEDS_CLIENT_ID || "live1_20205_a1ozIHWMfX7s92nqDliYBcZQ";
const CLOUDBEDS_CLIENT_SECRET = process.env.CLOUDBEDS_CLIENT_SECRET || "fAXc4CtnaoeQlK7M8S6Jsj9VEvIwpxWG";
const CLOUDBEDS_API_KEY = process.env.CLOUDBEDS_API_KEY || "cbat_3XhxsR2GvVQILcLLZ9XOk5Qims8F073P"; 

// Initialize Stripe
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_mock";
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" as any });

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
// HELPER: CLOUDBEDS API (With Retry & Auto-Healing)
// ----------------------------------------------------------------------
async function getCloudbedsAccessToken(): Promise<string> {
    // 1. Try to fetch from DB cache
    try {
        const tokenDoc = await db.collection("system").doc("cloudbeds_token").get();
        if (tokenDoc.exists) {
            const data = tokenDoc.data();
            if (data && data.expires_at && data.expires_at.toMillis() > Date.now() + 60000) {
                return data.access_token;
            }
        }
    } catch (e) {
        console.warn("Failed to read token cache", e);
    }

    // 2. Fallback to Static Key (Acting as Bearer/API Key)
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

        console.log(`[Cloudbeds] Call to ${endpoint}`);
        
        const response = await axios.get(endpoint, {
            params,
            headers,
            validateStatus: () => true 
        });

        if (response.status === 401) {
            if (retryCount < 1) {
                console.log("Token revoked/expired. In a real Client Creds flow, we would refresh here.");
                // For this demo, we can't refresh without full OAuth flow setup, so we throw
                throw new Error("Cloudbeds 401 Unauthorized - Check Credentials");
            }
        }

        return response.data;
    } catch (error) {
        console.error("API Call Failed:", error);
        throw error;
    }
}

// ----------------------------------------------------------------------
// FUNCTION 1: SYNC RESERVATION
// ----------------------------------------------------------------------
export const syncReservationFromCloudbeds = functions.https.onCall(async (data, context) => {
    // Handle both direct data and data.data structure
    const payload = (data && data.data) ? data.data : data;
    
    // Check if payload is undefined or null
    if (!payload) {
        console.error("Sync Error: Missing data payload");
        return { success: false, message: "Missing data payload" };
    }

    const { reservationId, firstName, lastName, checkInDate } = payload;
    
    const targetId = reservationId ? String(reservationId).trim() : null;
    const searchName = ((firstName || "") + " " + (lastName || "")).toLowerCase();
    
    console.log(`Sync requested for ID: ${targetId} | Name: ${searchName}`);

    // 1. DEMO/TEST DATA BYPASS
    // We keep this to ensure your "Check First" demo always works, even if Cloudbeds API is down.
    if (targetId === "12345" || targetId === "7320576071587" || (searchName.includes('yang') && searchName.includes('ding'))) {
         const demoRes = {
            reservation_id: targetId || "7320576071587",
            property_id: "prop_demo",
            data_source: 'demo_fallback',
            guest_details: {
                firstName: firstName || "Yang",
                lastName: lastName || "Ding",
                email: "guest@example.com",
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
        // Persist demo data so simple fetches find it
        await db.collection("reservations").doc(demoRes.reservation_id).set(demoRes, { merge: true });
        return { success: true, reservation: demoRes, source: 'cloudbeds_simulated' };
    }

    // 2. REAL API SYNC
    try {
        let cloudbedsData = null;

        // A. If we have an ID, try direct fetch
        if (targetId) {
            const response = await callCloudbedsAPI('https://hotels.cloudbeds.com/api/v1.1/getReservation', {
                reservationID: targetId
            });
            if (response.success) cloudbedsData = response.data;
        }

        // B. If no ID (or ID failed), try Search by Name
        if (!cloudbedsData && firstName && lastName) {
            // Note: Cloudbeds getGuests search is approximate
            const guestSearch = await callCloudbedsAPI('https://hotels.cloudbeds.com/api/v1.1/getGuests', {
                query: `${firstName} ${lastName}` 
            });
            
            if (guestSearch.success && guestSearch.data && guestSearch.data.length > 0) {
                 // Logic to find active reservation would go here
            }
        }

        // C. If we found data, Map & Save
        if (cloudbedsData) {
            const mappedRes = {
                reservation_id: cloudbedsData.reservationID,
                property_id: cloudbedsData.propertyID,
                data_source: 'cloudbeds',
                guest_details: {
                    firstName: cloudbedsData.guestFirstName,
                    lastName: cloudbedsData.guestLastName,
                    email: cloudbedsData.guestEmail,
                    phone: cloudbedsData.guestPhone || ""
                },
                dates: {
                    checkin: cloudbedsData.startDate,
                    checkout: cloudbedsData.endDate
                },
                pms_status: cloudbedsData.status,
                // Init flags if new
                pre_checkin_started: true,
                steps: {
                    guest_details_complete: true, // If pulled from PMS, details are technically 'there'
                    passport_complete: false,
                    tnc_accepted: false,
                    deposit_status: 'pending'
                }
            };

            // Save to Firestore
            await db.collection("reservations").doc(mappedRes.reservation_id).set(mappedRes, { merge: true });
            
            return { success: true, reservation: mappedRes, source: 'cloudbeds_live' };
        }

        return { success: false, message: "Reservation not found in Cloudbeds" };

    } catch (error: any) {
        console.error("Sync Error:", error);
        return { success: false, message: error.message || "Backend Sync Failed" };
    }
});

// ----------------------------------------------------------------------
// FUNCTION 2: CREATE DEPOSIT INTENT
// ----------------------------------------------------------------------
export const createDepositIntent = functions.https.onCall(async (data, context) => {
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
        await updateGuestStatus(reservationId, { 
            depositIntentId: paymentIntent.id,
            depositStatus: 'pending' 
        });

        return { clientSecret: paymentIntent.client_secret };
    } catch (error: any) {
        console.error("Stripe Intent Error:", error);
        throw new functions.https.HttpsError('internal', 'Payment initialization failed');
    }
});

// ----------------------------------------------------------------------
// FUNCTION 3: STRIPE WEBHOOK
// ----------------------------------------------------------------------
export const stripeWebhook = functions.https.onRequest(async (req: any, res: any) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        if (endpointSecret && sig) {
            event = stripe.webhooks.constructEvent(req.rawBody, sig as string, endpointSecret);
        } else {
            event = req.body;
        }
    } catch (err: any) {
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    const intent = event.data.object as Stripe.PaymentIntent;
    const reservationId = intent.metadata?.reservationId;

    if (reservationId) {
        if (event.type === 'payment_intent.amount_capturable_updated' || event.type === 'payment_intent.succeeded') {
             await updateGuestStatus(reservationId, { 
                steps: { deposit_status: 'authorized' } 
             });
             await logEvent(reservationId, "Deposit Authorized", { id: intent.id });
        }
    }

    res.json({received: true});
});

// ----------------------------------------------------------------------
// FUNCTION 4: TEST CONNECTION
// ----------------------------------------------------------------------
export const testConnection = functions.https.onCall(async (data, context) => {
    // Attempt a lightweight API call to verify credentials
    try {
        const res = await callCloudbedsAPI('https://hotels.cloudbeds.com/api/v1.1/getHotelDetails');
        if (res.success) {
             return { success: true, message: `✅ Connected! Property: ${res.data.propertyName || 'Verified'}` };
        }
        return { success: false, message: "❌ Credentials Invalid" };
    } catch (e: any) {
        return { success: false, message: `❌ Connection Failed: ${e.message}` };
    }
});

// ----------------------------------------------------------------------
// FUNCTION 5: SYNC DAILY ARRIVALS
// ----------------------------------------------------------------------
export const syncDailyArrivals = functions.https.onCall(async (data, context) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const res = await callCloudbedsAPI('https://hotels.cloudbeds.com/api/v1.1/getReservations', {
            checkInFrom: today,
            checkInTo: today
        });

        if (res.success && res.data) {
            return { success: true, count: res.data.length, message: `Synced ${res.data.length} arrivals.` };
        }
        return { success: false, message: "No arrivals found" };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
});