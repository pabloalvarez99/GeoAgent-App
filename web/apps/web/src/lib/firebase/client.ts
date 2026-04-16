'use client';

// Firebase client SDK — initializes lazily, safe during SSR
// All actual SDK calls happen in browser-only components (useEffect, event handlers)
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getAnalytics } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';
import { firebaseConfig } from './init';

// Prevent duplicate initialization in Next.js dev (hot reload)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// App Check — protege Firestore/Storage de abuso (solo en browser)
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY),
    isTokenAutoRefreshEnabled: true,
  });
}

export const auth = getAuth(app);

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

export const storage = getStorage(app);

export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const perf = typeof window !== 'undefined' ? getPerformance(app) : null;

export default app;
