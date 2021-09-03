var cacheName = 'fcm-test-app';
var cacheLists = ['/config.json'];

async function initializeCache() {
  var cache = await caches.open(cacheName)
  return cache.addAll(cacheLists)
}

async function removeCacheNotUse() {
  var cacheNames = await caches.keys();
  if (!Array.isArray(cacheNames)) { return false; }
  cacheNames.forEach(name => { 
    if (name !== cacheName) { return caches.delete(name); } 
  });
  self.clients.claim();
  return true;
}

function notificationAction(url) {
  // based on https://stackoverflow.com/a/65376596
  const theClient = selt.clients;
  if (!theClient) { return false; }
  theClient.matchAll({ type: 'window' }).then(windowClients => {
    for (var i = 0; i < windowClients.length; i++) {
      var client = windowClients[i];
      if (client.url === url && 'focus' in client) {
        return client.focus();
      }
    }
    if (theClient.openWindow) {
      return theClient.openWindow(url);
    }
  });
  return true;
}

self.addEventListener('install', (event) => {
  var isSkip = false;
  if (isSkip) {
    event.waitUntil(skipWaiting());
  } else {
    event.waitUntil(initializeCache());
  }
}, false);

self.addEventListener('activate', (event) => {
  event.waitUntil(removeCacheNotUse());
}, false);

self.addEventListener('notificationclick', (event) => {
  console.log('event = ', event);
  const clickedNotification = event.notification;
  clickedNotification.close();
  // event.notification.data.url
  //event.waitUntil(self.clients.openWindow());
}, false);
