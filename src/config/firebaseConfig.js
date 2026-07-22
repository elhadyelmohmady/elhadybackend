import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Path to the service account key (it should be placed in the root directory or configure path here)
// Make sure this file is added to .gitignore so it is not committed.
const serviceAccountPath = path.resolve('serviceAccountKey.json');

export const initializeFirebase = () => {
    try {
        if (fs.existsSync(serviceAccountPath)) {
            const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log('✅ Firebase Admin initialized successfully');
        } else {
            console.warn('⚠️ Firebase Admin initialization skipped: serviceAccountKey.json not found in the root directory.');
        }
    } catch (error) {
        console.error('❌ Failed to initialize Firebase Admin:', error.message);
    }
};

export { admin };
