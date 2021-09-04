const cacheName = 'fcm-test-app';
const cacheLists = ['/config.json'];

async function initializeCache() {
  const cache = await caches.open(cacheName)
  return cache.addAll(cacheLists)
}

async function removeCacheNotUse() {
  const cacheNames = await caches.keys();
  if (!Array.isArray(cacheNames)) { return false; }
  cacheNames.forEach(name => { 
    if (name !== cacheName) { return caches.delete(name); } 
  });
  self.clients.claim();
  return true;
}

async function notificationAction(urlLink) {
  // based on https://stackoverflow.com/a/65376596 + https://developer.mozilla.org/en-US/docs/Web/API/Clients/openWindow
  if (!urlLink) { return false; }
  const windowClients = await self.clients.matchAll({ type: 'window' });
  if (!windowClients) { return false; }
  // if a Window tab matching the targeted URL already exists, focus that.
  const hadWindowToFocus = windowClients.some(client => client.url === urlLink ? (client.focus(), true) : false);
  // otherwise, open a new tab to the applicable URL and focus it.
  if (!hadWindowToFocus && self.clients.openWindow) {
    self.clients.openWindow(urlLink);
  }
  return true;
}

self.addEventListener('install', (event) => {
  const isSkip = false;
  if (isSkip) {
    event.waitUntil(skipWaiting());
  } else {
    event.waitUntil(initializeCache());
  }
}, false);

self.addEventListener('activate', (event) => {
  event.waitUntil(removeCacheNotUse());
}, false);

self.addEventListener('push', (event) => {
  // based on https://github.com/firebase/quickstart-js/issues/71
  if (!event.data) { return false; }
  if (event.custom) { return false;} // skip if event is our own custom event

  const rawData = event.data;

  // create a new event to dispatch
  let newEvent = new Event('push');
  newEvent.waitUntil = event.waitUntil.bind(event);
  newEvent.data = {
    prevData: rawData.json(),
    json: () => {
      let newData = rawData.json();
      newData.data = { ...newData.data, ...newData.notification };
      delete newData.notification;
      return newData;
    }
  };     
  newEvent.custom = true;
  
  event.stopImmediatePropagation(); // stop event propagation
  dispatchEvent(newEvent); // dispatch the new wrapped event
});

self.addEventListener('notificationclick', (event) => {
  const clickedNotification = event.notification;
  const notificationData = (clickedNotification || {}).data;
  clickedNotification.close();
  if (notificationData) {
    const urlLink = notificationData.click_action || event.currentTarget.origin;
    event.waitUntil(notificationAction(urlLink));
  }
}, false);
