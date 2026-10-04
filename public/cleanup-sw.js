// Limpia Service Workers y CacheStorage viejos para que el navegador descargue siempre el código nuevo
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function (registrations) {
    for (var i = 0; i < registrations.length; i++) {
      registrations[i].unregister();
    }
  });
}
if ('caches' in window) {
  caches.keys().then(function (names) {
    for (var i = 0; i < names.length; i++) {
      caches.delete(names[i]);
    }
  });
}
