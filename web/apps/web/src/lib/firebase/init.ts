// Firebase config — safe to import server-side (values are just strings, no SDK calls here)
// Using 'placeholder' fallback so Firebase doesn't throw auth/invalid-api-key during
// static builds where env vars aren't set. Real values must be set in .env.local or Vercel.
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'geoagent-placeholder-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'geoagent-app.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'geoagent-app',
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'geoagent-app.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '609077404870',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'geoagent-placeholder-app-id',
};
