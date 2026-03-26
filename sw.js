/**
 * Service Worker - Hakimi 的猫爬架 PWA
 * 缓存策略：网络优先，离线回退
 */

const CACHE_NAME = 'hakimi-blog-v7';
const OFFLINE_URL = '/offline.html';

// 预缓存的核心资源（不带版本号，fetch 时用 ignoreSearch 匹配）
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/offline.html',
    '/css/chinese-style.css',
    '/css/auth.css',
    '/css/tianjg-theme.css',
    '/css/theme.css',
    '/js/api-config.js',
    '/js/auth.js',
    '/js/utils.js',
    '/js/theme.js',
    '/js/bg-loader.js',
    '/js/pwa-install.js',
    '/js/theme-enhancements.js',
    '/js/polyfill.js',
    '/js/music-player.js',
    '/js/follow.js',
    '/js/browser-detect.js',
    '/images/icons/icon-192x192.png',
    '/favicon.ico'
];

// 安装：预缓存核心资源
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

// 激活：清理旧缓存
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

// 请求拦截：网络优先策略
self.addEventListener('fetch', event => {
    const { request } = event;

    // 跳过非 GET 请求和 API 请求
    if (request.method !== 'GET') return;
    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;

    // API 请求不缓存
    if (url.pathname.startsWith('/auth') ||
        url.pathname.startsWith('/articles') && (request.headers.get('accept') || '').includes('application/json') ||
        url.pathname.startsWith('/profiles') ||
        url.pathname.startsWith('/coins') ||
        url.pathname.startsWith('/messages') ||
        url.pathname.startsWith('/donate') ||
        url.pathname.startsWith('/games') ||
        url.pathname.startsWith('/tasks') ||
        url.pathname.startsWith('/online')) {
        return;
    }

    // 静态资源：stale-while-revalidate（ignoreSearch 匹配带版本号的请求）
    if (url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|ico|woff2?)$/)) {
        event.respondWith(
            caches.match(request, { ignoreSearch: true }).then(cached => {
                const fetchPromise = fetch(request).then(response => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                    }
                    return response;
                }).catch(() => cached);
                return cached || fetchPromise;
            })
        );
        return;
    }

    // HTML 页面：网络优先，离线回退
    event.respondWith(
        fetch(request)
            .then(response => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                }
                return response;
            })
            .catch(() =>
                caches.match(request).then(cached => cached || caches.match(OFFLINE_URL))
            )
    );
});
