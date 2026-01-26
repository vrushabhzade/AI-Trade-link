import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// The service account key should be provided by the user and placed in server/serviceAccountKey.json
// or the environment variables should be set.
// For now, we will expect a file or environment variable.

let adminApp;

try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        adminApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } else {
        // Fallback or placeholder for local development with a file
        // adminApp = admin.initializeApp({
        //     credential: admin.credential.cert('./serviceAccountKey.json')
        // });
        console.warn('⚠️ Firebase Admin initialized without credentials. Firestore operations may fail.');
        adminApp = admin.initializeApp();
    }
} catch (error) {
    console.error('❌ Firebase Admin Initialization Error:', error);
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export default adminApp;
