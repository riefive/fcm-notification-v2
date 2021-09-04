function getDifferentTwoDate(date1, date2, target) {
  let divider = 0;
  target = (target && ['day', 'hour', 'minute', 'second'].includes(target) ? target : null) || 'day';
  switch (target) {
    case 'hour': divider = (1000 * 60 * 60 * 1);
      break;
    case 'minute': divider = (1000 * 60 * 1);
      break;
    case 'second': divider = (1000 * 1);
      break;
    default: divider = (1000 * 60 * 60 * 24);
      break;
  }
  return Math.ceil(Math.abs(date1 - date2) / divider);
}

function getStateNotification() {
  if (!('localStorage' in window)) { return null; }
  let notificationStates = null;
  const notificationStatesRaw = localStorage.getItem('notification');
  if (notificationStatesRaw) {
    try {
      notificationStates = JSON.parse(notificationStatesRaw);
    } catch (error) {}
  }
  return notificationStates;
}

function setStateDeviceToken(token) {
  if (!('localStorage' in window)) { return false; }
  localStorage.setItem('deviceToken', token);
}

function setStateNotification() {
  if (!('localStorage' in window)) { return false; }
  const data = {
    dateTime: new Date(),
    status: Notification.permission
  };
  localStorage.setItem('notification', JSON.stringify(data));
}

function displayToken() {
  if (document) {
    const target = document.getElementById('target')
    if (!target) { return false }
    if ('localStorage' in window) {
      const currentToken = localStorage.getItem('deviceToken');
      const objectData = Object.assign({ token: currentToken });
      target.innerText = JSON.stringify(objectData, null, 4);
    }
  }
}

async function registerServiceWorker() {
  // get environment
  let config = null;
  try {
    config = await fetch('/config.json').then(response => response.json()).then(config => config); 
  } catch (error) {
    console.debug('config not ready');
  }
  if (!config) { return false; }
  const validKey = config.webPushApiId || ''; // get valid key
  delete config.webPushApiId;
    
  // initialized firebase
  firebase.initializeApp(config);
  const messaging = firebase.messaging();

  const handleTokenRequest = async (status) => {
    const [error, currentToken] = await messaging.getToken({ vapidKey: validKey }).then(v => [null, v]).catch(e => [e, null]);
    if (error) {
      console.error('An error occurred while retrieving token. ', error);
    } else {
      if (!currentToken) {
        console.log('No Instance ID token available. Request permission to generate one.');
      } else {
        setStateDeviceToken(currentToken);
        displayToken();
        console.log(`${status} token:`, currentToken);
      }
    }
  };

  // handle incoming messages
  messaging.onMessage((payload) => {
    if (!('Notification' in window)) { return false; }
    const data = payload.data;
    if (!data) { return false; }
    const notification = data;
    const notificationTitle = notification.title;
    if  (!notificationTitle) { return false; }
    const notificationOptions = {
      body: notification.body,
      badge: 'images/firebase-120x120.png',
      icon: 'images/firebase-192x192.png',
      tag: 'from-foreground',
      data: data,
      renotify: false
    };
    return new Notification(notificationTitle, notificationOptions);
  });

  // callback fired if Instance ID token is updated.
  messaging.onTokenRefresh(() => {
    handleTokenRequest('refresh');
  });

  // registration service worker
  if (!('serviceWorker' in navigator)) { return false; }
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
  .then(() => navigator.serviceWorker.ready)
  .catch((err) => { 
    console.error('firebase service worker failed', err);
  })
  .then((registration) => {
    console.debug(`firebase service worker ${registration.scope}`);
    messaging.useServiceWorker(registration);
    messaging.requestPermission().then(() => {
      handleTokenRequest('generate');
    }).catch((err) => { 
      console.error('Unable to get permission to notify', err);
      setStateNotification();
    });
  });
}

registerServiceWorker();
