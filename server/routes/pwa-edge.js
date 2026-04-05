/**
 * 边缘计算与PWA路由
 * 第六轮创新性功能 - Edge Computing & PWA
 * 
 * 功能模块：
 * 6.1 Service Worker优化
 * 6.2 离线优先架构
 * 6.3 边缘缓存策略
 * 6.4 背景同步
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { createClient } = require('@supabase/supabase-js');

// Supabase客户端
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 缓存配置
const CACHE_CONFIG = {
    static: {
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1年
        patterns: [/\.(js|css|woff2?|png|jpg|jpeg|gif|svg|ico)$/]
    },
    pages: {
        maxAge: 24 * 60 * 60 * 1000, // 1天
        patterns: [/\/(article|profile|about)/]
    },
    api: {
        maxAge: 5 * 60 * 1000, // 5分钟
        patterns: [/^\/api\/(articles|categories|tags)/]
    },
    user: {
        maxAge: 60 * 1000, // 1分钟
        patterns: [/^\/api\/(user|notifications)/]
    }
};

// 中间件
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// ==================== 6.1 Service Worker优化 ====================

/**
 * 生成Service Worker
 * GET /sw.js
 */
router.get('/sw.js', async (req, res) => {
    try {
        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Cache-Control', 'no-cache');
        
        const swContent = generateServiceWorker();
        res.send(swContent);
    } catch (error) {
        res.status(500).send('// Service Worker generation failed');
    }
});

/**
 * 获取缓存策略配置
 * GET /api/pwa/cache-config
 */
router.get('/cache-config', async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                strategies: {
                    static: 'CacheFirst',
                    pages: 'StaleWhileRevalidate',
                    api: 'NetworkFirst',
                    images: 'CacheFirst'
                },
                precache: [
                    '/',
                    '/index.html',
                    '/offline.html',
                    '/css/chinese-style.css',
                    '/js/main.js'
                ],
                runtimeCache: [
                    { urlPattern: '/api/articles', strategy: 'NetworkFirst', maxAge: 300 },
                    { urlPattern: '/api/categories', strategy: 'CacheFirst', maxAge: 3600 },
                    { urlPattern: '/uploads/', strategy: 'CacheFirst', maxAge: 86400 }
                ]
            }
        });
    } catch (error) {
        res.status(500).json({ error: '获取缓存配置失败' });
    }
});

/**
 * 更新Service Worker
 * POST /api/pwa/sw/update
 */
router.post('/sw/update', async (req, res) => {
    try {
        const { version, releaseNotes } = req.body;
        
        // 记录新版本
        await supabase.from('pwa_versions').insert({
            version: version || Date.now().toString(),
            release_notes: releaseNotes,
            released_at: new Date(),
            active: true
        });

        // 通知所有客户端更新
        await notifyClientsToUpdate();

        res.json({
            success: true,
            data: { message: 'Service Worker更新已推送' }
        });
    } catch (error) {
        res.status(500).json({ error: '更新失败' });
    }
});

/**
 * 获取PWA清单
 * GET /manifest.json
 */
router.get('/manifest.json', async (req, res) => {
    try {
        res.setHeader('Content-Type', 'application/manifest+json');
        
        const manifest = {
            name: 'Hakimi的博客',
            short_name: 'Hakimi',
            description: 'Hakimi的猫爬架 - 个人博客平台',
            start_url: '/',
            display: 'standalone',
            background_color: '#ffffff',
            theme_color: '#667eea',
            orientation: 'portrait-primary',
            scope: '/',
            icons: [
                { src: '/icons/icon-72x72.png', sizes: '72x72', type: 'image/png' },
                { src: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
                { src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
                { src: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
                { src: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
                { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
                { src: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
                { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
            ],
            categories: ['blog', 'social'],
            shortcuts: [
                {
                    name: '写文章',
                    short_name: '写作',
                    description: '快速创建新文章',
                    url: '/editor.html',
                    icons: [{ src: '/icons/edit.png', sizes: '96x96' }]
                },
                {
                    name: '我的收藏',
                    short_name: '收藏',
                    description: '查看收藏的文章',
                    url: '/collections.html',
                    icons: [{ src: '/icons/star.png', sizes: '96x96' }]
                }
            ],
            share_target: {
                action: '/share-target',
                method: 'POST',
                enctype: 'multipart/form-data',
                params: {
                    title: 'title',
                    text: 'text',
                    url: 'url',
                    files: [
                        { name: 'media', accept: ['image/*', 'video/*'] }
                    ]
                }
            }
        };

        res.json(manifest);
    } catch (error) {
        res.status(500).json({ error: '获取Manifest失败' });
    }
});

// ==================== 6.2 离线优先架构 ====================

/**
 * 获取离线内容
 * GET /api/pwa/offline-content
 */
router.get('/offline-content', async (req, res) => {
    try {
        const userId = req.user?.id;

        // 获取离线可用的内容
        let content = {
            pages: [],
            articles: [],
            savedPages: []
        };

        // 热门文章
        const { data: hotArticles } = await supabase
            .from('articles')
            .select('id, title, summary, category, created_at, author:author_id(username)')
            .eq('status', 'published')
            .order('view_count', { ascending: false })
            .limit(20);

        content.articles = hotArticles || [];

        // 用户的离线保存内容
        if (userId) {
            const { data: saved } = await supabase
                .from('offline_saved')
                .select('*')
                .eq('user_id', userId);
            content.savedPages = saved || [];
        }

        res.json({ success: true, data: content });
    } catch (error) {
        res.status(500).json({ error: '获取离线内容失败' });
    }
});

/**
 * 保存离线页面
 * POST /api/pwa/offline-save
 */
router.post('/offline-save', [
    body('url').isURL(),
    body('title').trim(),
    validateRequest
], async (req, res) => {
    try {
        const userId = req.user.id;
        const { url, title, content } = req.body;

        // 检查是否已保存
        const { data: existing } = await supabase
            .from('offline_saved')
            .select('id')
            .eq('user_id', userId)
            .eq('url', url)
            .single();

        if (existing) {
            await supabase.from('offline_saved')
                .update({
                    title,
                    content,
                    updated_at: new Date()
                })
                .eq('id', existing.id);
        } else {
            await supabase.from('offline_saved').insert({
                user_id: userId,
                url,
                title,
                content,
                created_at: new Date()
            });
        }

        res.json({ success: true, data: { message: '已保存到离线阅读' } });
    } catch (error) {
        res.status(500).json({ error: '保存失败' });
    }
});

/**
 * 获取离线页面列表
 * GET /api/pwa/offline-saved
 */
router.get('/offline-saved', async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20 } = req.query;

        const { data, count, error } = await supabase
            .from('offline_saved')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        if (error) throw error;

        res.json({
            success: true,
            data: {
                items: data,
                pagination: { page: parseInt(page), limit: parseInt(limit), total: count }
            }
        });
    } catch (error) {
        res.status(500).json({ error: '获取失败' });
    }
});

/**
 * 删除离线保存
 * DELETE /api/pwa/offline-saved/:id
 */
router.delete('/offline-saved/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        await supabase.from('offline_saved')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: '删除失败' });
    }
});

// ==================== 6.3 边缘缓存策略 ====================

/**
 * 预缓存内容
 * POST /api/pwa/precache
 */
router.post('/precache', async (req, res) => {
    try {
        const { urls } = req.body;
        const results = [];

        for (const url of urls) {
            try {
                // 获取内容并缓存
                const response = await fetch(url);
                const content = await response.text();

                // 存储到边缘缓存
                await cacheToEdge(url, content, {
                    contentType: response.headers.get('content-type'),
                    maxAge: 3600
                });

                results.push({ url, success: true });
            } catch (err) {
                results.push({ url, success: false, error: err.message });
            }
        }

        res.json({ success: true, data: { results } });
    } catch (error) {
        res.status(500).json({ error: '预缓存失败' });
    }
});

/**
 * 清除边缘缓存
 * POST /api/pwa/cache/clear
 */
router.post('/cache/clear', async (req, res) => {
    try {
        const { pattern, scope = 'user' } = req.body;

        if (scope === 'global' && req.user?.role !== 'admin') {
            return res.status(403).json({ error: '无权限清除全局缓存' });
        }

        // 清除缓存逻辑
        await clearEdgeCache(pattern, scope === 'global' ? null : req.user.id);

        res.json({ success: true, data: { message: '缓存已清除' } });
    } catch (error) {
        res.status(500).json({ error: '清除缓存失败' });
    }
});

/**
 * 获取缓存统计
 * GET /api/pwa/cache/stats
 */
router.get('/cache/stats', async (req, res) => {
    try {
        // 模拟缓存统计
        const stats = {
            totalSize: 1024 * 1024 * 50, // 50MB
            itemCount: 1250,
            hitRate: 0.85,
            byType: {
                static: { size: 1024 * 1024 * 30, count: 800 },
                api: { size: 1024 * 1024 * 15, count: 350 },
                pages: { size: 1024 * 1024 * 5, count: 100 }
            },
            lastCleared: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        };

        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ error: '获取统计失败' });
    }
});

/**
 * 智能预加载推荐
 * GET /api/pwa/prefetch-predictions
 */
router.get('/prefetch-predictions', async (req, res) => {
    try {
        const userId = req.user?.id;
        const predictions = [];

        if (userId) {
            // 基于用户历史行为预测
            const { data: history } = await supabase
                .from('reading_history')
                .select('article:article_id(category)')
                .eq('user_id', userId)
                .order('read_at', { ascending: false })
                .limit(10);

            const categories = history?.map(h => h.article?.category).filter(Boolean);
            const topCategory = categories?.length > 0 
                ? categories.sort((a, b) => 
                    categories.filter(c => c === a).length - categories.filter(c => c === b).length
                ).pop()
                : null;

            if (topCategory) {
                const { data: suggestions } = await supabase
                    .from('articles')
                    .select('id, title, slug')
                    .eq('category', topCategory)
                    .eq('status', 'published')
                    .limit(5);

                predictions.push(...(suggestions || []).map(a => ({
                    url: `/article.html?id=${a.id}`,
                    confidence: 0.8,
                    reason: `基于您对"${topCategory}"的兴趣`
                })));
            }
        }

        // 添加热门内容
        predictions.push(
            { url: '/', confidence: 0.95, reason: '首页' },
            { url: '/articles.html', confidence: 0.7, reason: '文章列表' }
        );

        res.json({
            success: true,
            data: {
                predictions: predictions.slice(0, 10)
            }
        });
    } catch (error) {
        res.status(500).json({ error: '预测失败' });
    }
});

// ==================== 6.4 背景同步 ====================

/**
 * 注册后台同步任务
 * POST /api/pwa/background-sync/register
 */
router.post('/background-sync/register', [
    body('tag').isString(),
    body('data').optional(),
    validateRequest
], async (req, res) => {
    try {
        const userId = req.user.id;
        const { tag, data, priority = 'normal' } = req.body;

        const syncTask = {
            id: `${userId}_${tag}_${Date.now()}`,
            user_id: userId,
            tag,
            data,
            priority,
            status: 'pending',
            attempts: 0,
            max_attempts: 3,
            created_at: new Date(),
            scheduled_at: new Date()
        };

        await supabase.from('background_sync_tasks').insert(syncTask);

        res.json({
            success: true,
            data: {
                taskId: syncTask.id,
                message: '同步任务已注册'
            }
        });
    } catch (error) {
        res.status(500).json({ error: '注册失败' });
    }
});

/**
 * 获取待同步任务
 * GET /api/pwa/background-sync/pending
 */
router.get('/background-sync/pending', async (req, res) => {
    try {
        const userId = req.user.id;

        const { data: tasks } = await supabase
            .from('background_sync_tasks')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'pending')
            .order('created_at', { ascending: true });

        res.json({
            success: true,
            data: { tasks: tasks || [] }
        });
    } catch (error) {
        res.status(500).json({ error: '获取任务失败' });
    }
});

/**
 * 处理同步任务
 * POST /api/pwa/background-sync/process
 */
router.post('/background-sync/process', async (req, res) => {
    try {
        const { taskId, result } = req.body;
        const userId = req.user.id;

        const { data: task } = await supabase
            .from('background_sync_tasks')
            .select('*')
            .eq('id', taskId)
            .eq('user_id', userId)
            .single();

        if (!task) {
            return res.status(404).json({ error: '任务不存在' });
        }

        if (result.success) {
            await supabase.from('background_sync_tasks')
                .update({
                    status: 'completed',
                    completed_at: new Date(),
                    result: result.data
                })
                .eq('id', taskId);
        } else {
            const newAttempts = task.attempts + 1;
            await supabase.from('background_sync_tasks')
                .update({
                    status: newAttempts >= task.max_attempts ? 'failed' : 'pending',
                    attempts: newAttempts,
                    last_error: result.error,
                    scheduled_at: new Date(Date.now() + Math.pow(2, newAttempts) * 60000) // 指数退避
                })
                .eq('id', taskId);
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: '处理失败' });
    }
});

/**
 * 定期同步检查
 * GET /api/pwa/background-sync/check
 */
router.get('/background-sync/check', async (req, res) => {
    try {
        const userId = req.user?.id;

        // 检查是否有待同步数据
        const checks = {
            offlineArticles: false,
            draftSync: false,
            readingProgress: false,
            formSubmissions: false
        };

        if (userId) {
            // 检查离线文章
            const { data: offlineArticles } = await supabase
                .from('offline_saved')
                .select('id', { count: 'exact' })
                .eq('user_id', userId);
            checks.offlineArticles = (offlineArticles?.length || 0) > 0;

            // 检查草稿同步
            const { data: drafts } = await supabase
                .from('article_drafts')
                .select('id', { count: 'exact' })
                .eq('author_id', userId)
                .eq('sync_status', 'pending');
            checks.draftSync = (drafts?.length || 0) > 0;

            // 检查待同步任务
            const { data: tasks } = await supabase
                .from('background_sync_tasks')
                .select('id', { count: 'exact' })
                .eq('user_id', userId)
                .eq('status', 'pending');
            checks.hasPendingTasks = (tasks?.length || 0) > 0;
        }

        res.json({
            success: true,
            data: {
                hasDataToSync: Object.values(checks).some(v => v),
                checks
            }
        });
    } catch (error) {
        res.status(500).json({ error: '检查失败' });
    }
});

/**
 * 推送订阅
 * POST /api/pwa/push-subscribe
 */
router.post('/push-subscribe', async (req, res) => {
    try {
        const userId = req.user?.id;
        const { subscription, preferences = {} } = req.body;

        await supabase.from('push_subscriptions').upsert({
            endpoint: subscription.endpoint,
            user_id: userId,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            preferences: {
                articles: true,
                comments: true,
                mentions: true,
                system: true,
                ...preferences
            },
            created_at: new Date()
        }, { onConflict: 'endpoint' });

        res.json({ success: true, data: { message: '订阅成功' } });
    } catch (error) {
        res.status(500).json({ error: '订阅失败' });
    }
});

/**
 * 取消推送订阅
 * POST /api/pwa/push-unsubscribe
 */
router.post('/push-unsubscribe', async (req, res) => {
    try {
        const { endpoint } = req.body;

        await supabase.from('push_subscriptions')
            .delete()
            .eq('endpoint', endpoint);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: '取消订阅失败' });
    }
});

/**
 * 发送推送通知（内部使用）
 * POST /api/pwa/push-send
 */
router.post('/push-send', async (req, res) => {
    try {
        const { userIds, title, body, data = {}, icon = '/icons/icon-192x192.png' } = req.body;

        // 获取订阅
        let query = supabase.from('push_subscriptions').select('*');
        if (userIds && userIds.length > 0) {
            query = query.in('user_id', userIds);
        }
        const { data: subscriptions } = await query;

        // 发送推送
        const results = [];
        for (const sub of subscriptions || []) {
            try {
                await sendPushNotification(sub, { title, body, icon, data });
                results.push({ endpoint: sub.endpoint, success: true });
            } catch (err) {
                results.push({ endpoint: sub.endpoint, success: false, error: err.message });
            }
        }

        res.json({ success: true, data: { sent: results.length, results } });
    } catch (error) {
        res.status(500).json({ error: '发送失败' });
    }
});

// ==================== 辅助函数 ====================

function generateServiceWorker() {
    return `const CACHE_NAME = 'blog-cache-v' + new Date().toISOString().slice(0, 10);
const STATIC_CACHE = 'static-v1';
const API_CACHE = 'api-v1';
const IMAGE_CACHE = 'images-v1';

// 预缓存资源
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/offline.html',
    '/css/chinese-style.css',
    '/js/main.js'
];

// 安装
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

// 激活
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => !name.includes(STATIC_CACHE) && !name.includes(API_CACHE))
                    .map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// 获取策略
self.addEventListener('fetch', (e) => {
    const { request } = e;
    const url = new URL(request.url);

    // API请求 - Network First
    if (url.pathname.startsWith('/api/')) {
        e.respondWith(networkFirst(request, API_CACHE));
        return;
    }

    // 图片 - Cache First
    if (request.destination === 'image') {
        e.respondWith(cacheFirst(request, IMAGE_CACHE));
        return;
    }

    // 静态资源 - Cache First
    e.respondWith(cacheFirst(request, STATIC_CACHE));
});

// Cache First 策略
async function cacheFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    
    if (cached) return cached;
    
    try {
        const response = await fetch(request);
        cache.put(request, response.clone());
        return response;
    } catch (err) {
        return cached || new Response('Offline', { status: 503 });
    }
}

// Network First 策略
async function networkFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    
    try {
        const networkResponse = await fetch(request);
        cache.put(request, networkResponse.clone());
        return networkResponse;
    } catch (err) {
        const cached = await cache.match(request);
        if (cached) return cached;
        throw err;
    }
}

// Stale While Revalidate 策略
async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    
    const networkPromise = fetch(request).then(response => {
        cache.put(request, response.clone());
        return response;
    }).catch(() => cached);
    
    return cached || networkPromise;
}

// 后台同步
self.addEventListener('sync', (e) => {
    if (e.tag === 'background-sync') {
        e.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
        client.postMessage({ type: 'BACKGROUND_SYNC' });
    });
}

// 推送通知
self.addEventListener('push', (e) => {
    const data = e.data.json();
    e.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: data.icon || '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            data: data.data,
            actions: data.actions || []
        })
    );
});

// 通知点击
self.addEventListener('notificationclick', (e) => {
    e.notification.close();
    const { action, data } = e.notification;
    
    e.waitUntil(
        clients.openWindow(data?.url || '/')
    );
});

// 消息处理
self.addEventListener('message', (e) => {
    if (e.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
`;
}

async function cacheToEdge(url, content, options) {
    // 实际的边缘缓存实现
    // 可以使用 Cloudflare Workers KV、Redis 等
}

async function clearEdgeCache(pattern, userId) {
    // 清除缓存逻辑
}

async function notifyClientsToUpdate() {
    // 通知客户端更新Service Worker
}

async function sendPushNotification(subscription, payload) {
    // 使用 web-push 库发送推送
    const webPush = require('web-push');
    
    webPush.setVapidDetails(
        'mailto:admin@example.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );

    await webPush.sendNotification(subscription, JSON.stringify(payload));
}

module.exports = router;
