import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import app from './client';

export async function requestPushPermission(): Promise<string | null> {
  if (typeof window === 'undefined' || !('Notification' in window)) return null;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;
  const messaging = getMessaging(app);
  return getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
  });
}

export function onForegroundMessage(callback: (payload: any) => void) {
  if (typeof window === 'undefined') return () => {};
  const messaging = getMessaging(app);
  return onMessage(messaging, callback);
}
