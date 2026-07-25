import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import fs from 'fs';
import path from 'path';

// Path to the service account key (it should be placed in the root directory or configure path here)
// Make sure this file is added to .gitignore so it is not committed.
const serviceAccountPath = path.resolve('serviceAccountKey.json');

let messagingInstance = null;

export const initializeFirebase = () => {
    try {
        if (fs.existsSync(serviceAccountPath)) {
            const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
            const app = initializeApp({
                credential: cert(serviceAccount)
            });
            messagingInstance = getMessaging(app);
            console.log('✅ Firebase Admin initialized successfully');
        } else {
            console.warn('⚠️ Firebase Admin initialization skipped: serviceAccountKey.json not found in the root directory.');
        }
    } catch (error) {
        console.error('❌ Failed to initialize Firebase Admin:', error.message);
    }
};

// Returns the Messaging instance, or null if Firebase Admin was never initialized
// (e.g. serviceAccountKey.json is missing) — callers must handle the null case.
export const getFirebaseMessaging = () => messagingInstance;
