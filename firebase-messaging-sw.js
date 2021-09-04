importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js');
importScripts('/default-sw.js');

async function initialized() {
  let config = null;
  try {
    config = await fetch('/config.json').then(response => response.json()).then(config => config); 
  } catch (error) {
    console.debug('config not ready');
  }
  if (!config) { return false; }
  delete config.webPushApiId;
  firebase.initializeApp(config);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const data = payload.data;
    if (!data) { return false; }
    const notification = data;
    const notificationTitle = notification.title;
    if (!notificationTitle) { return false; }
    const notificationOptions = {
      body: notification.body,
      badge: 'images/firebase-120x120.png',
      icon: 'images/firebase-192x192.png',
      tag: 'from-background',
      data: data,
      renotify: false
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

initialized();
