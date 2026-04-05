require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initDB, pool } = require('./db');

const app = express();
const PORT = process.env.PORT || 9000;

// Rate Limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { message: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // limit each IP to 20 login/register requests per hour
    message: { message: 'Too many login attempts, please try again later.' }
});

// Middleware
app.use(helmet({
    contentSecurityPolicy: false, // 前端有内联脚本，暂不启用 CSP
    crossOriginEmbedderPolicy: false
}));
app.use(limiter); // Apply global limiter

// CORS 安全配置：只允许指定域名访问
const allowedOrigins = (process.env.CORS_ORIGINS || 'https://mcock.cn').split(',').map(s => s.trim());
app.use(cors({
    origin: function (origin, callback) {
        // 允许无 origin 的请求（如服务器间调用、curl）
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS not allowed'));
        }
    },
    credentials: true
}));

// 使用 Express 内置 JSON 解析器（无需 body-parser）
app.use(express.json({
    limit: '10mb' // 限制请求体大小
}));

// Handle JSON parse errors
app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'Invalid JSON in request body' });
    }
    if (err.type === 'entity.too.large') {
        return res.status(413).json({ message: 'Request body too large' });
    }
    next(err);
});

// Request Logging Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (req.body && Object.keys(req.body).length > 0) {
        // Mask sensitive fields like password
        const safeBody = { ...req.body };
        if (safeBody.password) safeBody.password = '***';
        if (safeBody.newPassword) safeBody.newPassword = '***';
        console.log('Body:', JSON.stringify(safeBody, null, 2));
    }
    next();
});

// Initialize Database (async, non-blocking)
initDB().catch(err => {
    console.error('Database initialization failed:', err.message);
});

// Routes
const authRoutes = require('./routes/auth');
const articleRoutes = require('./routes/articles');
const profileRoutes = require('./routes/profiles');
const interactionRoutes = require('./routes/interactions');
const adminRoutes = require('./routes/admin');
const coinRoutes = require('./routes/coins');
const donateRoutes = require('./routes/donate');
const driveRoutes = require('./routes/drive');
const messageRoutes = require('./routes/messages');
const gameRoutes = require('./routes/games');
const onlineRoutes = require('./routes/online');
const taskRoutes = require('./routes/tasks');
const knowledgeRoutes = require('./routes/knowledge');
const versionRoutes = require('./routes/versions');
const aiRoutes = require('./routes/ai-assistant');
const analyticsRoutes = require('./routes/analytics');
const searchRoutes = require('./routes/search');
const { router: socialRouter } = require('./routes/social');
const collectionRoutes = require('./routes/collections');
const readingRoutes = require('./routes/reading');
const { router: gamificationRouter } = require('./routes/gamification');
const recommendationRoutes = require('./routes/recommendations');
const communityRoutes = require('./routes/community');
const adminDashboardRoutes = require('./routes/admin-dashboard');
const aiFeaturesRoutes = require('./routes/ai-features');
const multimediaRoutes = require('./routes/multimedia');
const socialEnhancedRoutes = require('./routes/social-enhanced');
const seoMarketingRoutes = require('./routes/seo-marketing');
const securityBackupRoutes = require('./routes/security-backup');

// 第四轮功能 - 电商、付费内容、数据分析、国际化、第三方集成
const ecommerceRoutes = require('./routes/ecommerce');
const premiumContentRoutes = require('./routes/premium-content');
const analyticsAdvancedRoutes = require('./routes/analytics-advanced');
const integrationsRoutes = require('./routes/integrations');

app.use('/auth', authLimiter, authRoutes);
app.use('/articles', articleRoutes);
app.use('/profiles', profileRoutes);
app.use('/admin', adminRoutes);
app.use('/coins', coinRoutes);
app.use('/donate', donateRoutes);
app.use('/drive', driveRoutes);
app.use('/messages', messageRoutes);
app.use('/games', gameRoutes);
app.use('/online', onlineRoutes);
app.use('/tasks', taskRoutes);
app.use('/knowledge', knowledgeRoutes);
app.use('/', versionRoutes); // 文章版本历史和协作功能
app.use('/', aiRoutes); // AI智能写作助手
app.use('/', analyticsRoutes); // 数据分析
app.use('/', searchRoutes); // 高级搜索
app.use('/', interactionRoutes); // Mount at root to match /articles/:id/like paths
app.use('/', socialRouter); // 社交系统 - 关注、私信、@提及
app.use('/', collectionRoutes); // 收藏夹系统
app.use('/', readingRoutes); // 阅读体验 - 进度、偏好设置
app.use('/', gamificationRouter); // 用户成长系统 - 等级、徽章、任务、商城
app.use('/', recommendationRoutes); // 内容推荐 - 个性化推荐、热门、专题
app.use('/', communityRoutes); // 社区互动 - 投票、问答、评论置顶
app.use('/admin-dashboard', adminDashboardRoutes); // 管理后台 - 数据、审核、监控

// 第三轮功能 - AI增强、多媒体、社交深化、SEO营销、安全备份
app.use('/ai', aiFeaturesRoutes); // AI功能 - 写作助手、翻译、摘要
app.use('/', multimediaRoutes); // 多媒体 - 视频、音频、直播
app.use('/', socialEnhancedRoutes); // 社交深化 - 私信、群组、活动
app.use('/', seoMarketingRoutes); // SEO与营销 - 订阅、分享、推荐
app.use('/security', securityBackupRoutes); // 安全与备份 - 2FA、设备、加密

// 第四轮功能 - 电商系统、付费内容、数据分析、第三方集成
app.use('/', ecommerceRoutes); // 电子商务 - 商品、购物车、订单
app.use('/', premiumContentRoutes); // 付费内容 - 会员、付费文章、打赏
app.use('/', analyticsAdvancedRoutes); // 高级分析 - 热力图、漏斗、A/B测试
app.use('/', integrationsRoutes); // 第三方集成 - 社交登录、支付、推送

// 第五轮功能 - 企业级后台、RBAC权限、部署运维
const adminEnterpriseRoutes = require('./routes/admin-enterprise');
const { router: rbacRouter } = require('./routes/rbac');

app.use('/admin-enterprise', adminEnterpriseRoutes); // 企业级后台 - 数据大屏、审核、配置
app.use('/rbac', rbacRouter); // RBAC权限管理 - 角色、权限、部门、审计

// 第六轮功能 - Web3/区块链、AI大模型、实时协作、游戏化社交、低代码、边缘计算PWA
const web3Routes = require('./routes/web3');
const aiAdvancedRoutes = require('./routes/ai-advanced');
const collaborationRoutes = require('./routes/collaboration');
const gamificationSocialRoutes = require('./routes/gamification-social');
const lowcodeRoutes = require('./routes/lowcode');
const pwaEdgeRoutes = require('./routes/pwa-edge');
const wechatAuthRoutes = require('./routes/wechat-auth');

app.use('/web3', web3Routes); // Web3与区块链 - 钱包、NFT、代币、IPFS
app.use('/ai', aiAdvancedRoutes); // AI大模型深度集成 - 智能客服、内容生成、代码审查
app.use('/collab', collaborationRoutes); // 实时协作系统 - 多人编辑、白板、视频会议
app.use('/social-game', gamificationSocialRoutes); // 游戏化社交 - 虚拟宠物、任务、排行榜
app.use('/lowcode', lowcodeRoutes); // 低代码平台 - 页面构建、表单、工作流
app.use('/pwa', pwaEdgeRoutes); // 边缘计算与PWA - Service Worker、离线优先、背景同步
app.use('/wechat', wechatAuthRoutes); // 微信登录 - 扫码登录、公众号授权、小程序

// 第七轮功能 - 社区互动升级 - 问答悬赏、话题圈子、实时弹幕
const qnaBountyRoutes = require('./routes/qna-bounty');
const groupsRoutes = require('./routes/groups');

app.use('/qna', qnaBountyRoutes); // 问答悬赏系统 - 提问、回答、采纳、金币悬赏
app.use('/groups', groupsRoutes); // 话题圈子系统 - 创建圈子、发帖、评论

app.get('/', (req, res) => {
    res.send('My Blog API is running!');
});

// Health Check
app.get('/api/health', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT 1');
        res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('Health check DB error:', error.message);
        res.status(500).json({ status: 'error', db: 'disconnected' });
    }
});

// 404 Handler - 未匹配的路由
app.use((req, res) => {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.url}` });
});

// Global Error Handler - 捕获所有未处理的错误
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;
    res.status(statusCode).json({ message });
});

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    // 不立即退出，让当前请求完成
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
