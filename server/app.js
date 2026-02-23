require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
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
app.use(limiter); // Apply global limiter
app.use(cors());

// Body parser with error handling for malformed JSON
app.use(bodyParser.json({
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

app.use('/auth', authLimiter, authRoutes);
app.use('/articles', articleRoutes);
app.use('/profiles', profileRoutes);
app.use('/admin', adminRoutes);
app.use('/coins', coinRoutes);
app.use('/drive', require('./routes/drive'));
app.use('/', interactionRoutes); // Mount at root to match /articles/:id/like paths

app.get('/', (req, res) => {
    res.send('My Blog API is running!');
});

// Health Check
app.get('/api/health', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT 1');
        res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ status: 'error', db: error.message });
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
