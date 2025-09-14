// Service Worker для TimeWork PWA
const CACHE_NAME = 'timework-v1.0.0';
const STATIC_CACHE = 'timework-static-v1';
const DYNAMIC_CACHE = 'timework-dynamic-v1';

// Файлы для кэширования
const STATIC_FILES = [
    '/',
    '/index.html',
    '/history.html',
    '/profile.html',
    '/style.css',
    '/scripts.js',
    '/history.js',
    '/profile.js',
    '/sounds.js',
    '/notifications.js',
    '/custom-timer.js',
    '/manifest.json',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Установка Service Worker
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Service Worker: Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('Service Worker: Installation complete');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Service Worker: Installation failed', error);
            })
    );
});

// Активация Service Worker
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activation complete');
                return self.clients.claim();
            })
    );
});

// Перехват запросов
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Стратегия кэширования для разных типов ресурсов
    if (request.method === 'GET') {
        // HTML страницы - Network First
        if (request.destination === 'document') {
            event.respondWith(networkFirstStrategy(request));
        }
        // CSS, JS, изображения - Cache First
        else if (request.destination === 'style' || 
                 request.destination === 'script' || 
                 request.destination === 'image') {
            event.respondWith(cacheFirstStrategy(request));
        }
        // API запросы - Network First
        else if (url.pathname.startsWith('/api/')) {
            event.respondWith(networkFirstStrategy(request));
        }
        // Остальные запросы - Stale While Revalidate
        else {
            event.respondWith(staleWhileRevalidateStrategy(request));
        }
    }
});

// Стратегия Cache First
async function cacheFirstStrategy(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.error('Cache First Strategy failed:', error);
        return new Response('Offline', { status: 503 });
    }
}

// Стратегия Network First
async function networkFirstStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.log('Network failed, trying cache:', error);
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Fallback для HTML страниц
        if (request.destination === 'document') {
            return caches.match('/index.html');
        }
        
        return new Response('Offline', { status: 503 });
    }
}

// Стратегия Stale While Revalidate
async function staleWhileRevalidateStrategy(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    const fetchPromise = fetch(request).then(networkResponse => {
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    }).catch(() => cachedResponse);
    
    return cachedResponse || fetchPromise;
}

// Обработка push уведомлений
self.addEventListener('push', event => {
    console.log('Service Worker: Push received');
    
    const options = {
        body: event.data ? event.data.text() : 'Новое уведомление от TimeWork',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Открыть приложение',
                icon: '/icons/action-open.png'
            },
            {
                action: 'close',
                title: 'Закрыть',
                icon: '/icons/action-close.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('TimeWork', options)
    );
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', event => {
    console.log('Service Worker: Notification clicked');
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    } else if (event.action === 'close') {
        // Просто закрываем уведомление
        return;
    } else {
        // Клик по самому уведомлению
        event.waitUntil(
            clients.matchAll().then(clientList => {
                if (clientList.length > 0) {
                    return clientList[0].focus();
                }
                return clients.openWindow('/');
            })
        );
    }
});

// Синхронизация в фоне
self.addEventListener('sync', event => {
    console.log('Service Worker: Background sync', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

// Функция фоновой синхронизации
async function doBackgroundSync() {
    try {
        // Здесь будет логика синхронизации с сервером
        console.log('Service Worker: Performing background sync');
        
        // Пример: отправка накопленных данных
        const pendingData = await getPendingData();
        if (pendingData.length > 0) {
            await sendDataToServer(pendingData);
            await clearPendingData();
        }
    } catch (error) {
        console.error('Service Worker: Background sync failed', error);
    }
}

// Получение накопленных данных
async function getPendingData() {
    // Здесь будет логика получения данных из IndexedDB
    return [];
}

// Отправка данных на сервер
async function sendDataToServer(data) {
    // Здесь будет логика отправки данных
    console.log('Service Worker: Sending data to server', data);
}

// Очистка отправленных данных
async function clearPendingData() {
    // Здесь будет логика очистки данных
    console.log('Service Worker: Clearing pending data');
}

// Обработка сообщений от клиента
self.addEventListener('message', event => {
    console.log('Service Worker: Message received', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
});

// Периодическая синхронизация
self.addEventListener('periodicsync', event => {
    console.log('Service Worker: Periodic sync', event.tag);
    
    if (event.tag === 'content-sync') {
        event.waitUntil(doPeriodicSync());
    }
});

// Функция периодической синхронизации
async function doPeriodicSync() {
    try {
        console.log('Service Worker: Performing periodic sync');
        // Здесь будет логика периодической синхронизации
    } catch (error) {
        console.error('Service Worker: Periodic sync failed', error);
    }
}

// Обработка ошибок
self.addEventListener('error', event => {
    console.error('Service Worker: Error occurred', event.error);
});

self.addEventListener('unhandledrejection', event => {
    console.error('Service Worker: Unhandled promise rejection', event.reason);
});

console.log('Service Worker: Loaded successfully');
