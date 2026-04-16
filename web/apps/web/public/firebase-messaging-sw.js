importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyB7VnEFqOckTwm0wjEWdqCou-E4TWaR67k',
  authDomain: 'geoagent-app.firebaseapp.com',
  projectId: 'geoagent-app',
  storageBucket: 'geoagent-app.firebasestorage.app',
  messagingSenderId: '609077404870',
  appId: '1:609077404870:web:575fafdee7053e9886e3c7',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title = 'GeoAgent', body = '' } = payload.notification ?? {};
  self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
  });
});
