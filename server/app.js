require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const { initDB, pool } = require('./db');
require('dotenv').config();

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
app.use(bodyParser.json());

// Request Logging Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    if (req.body && Object.keys(req.body).length > 0) {
        // Mask sensitive fields like password
        const safeBody = { ...req.body };
        if (safeBody.password) safeBody.password = '***';
        console.log('Body:', JSON.stringify(safeBody, null, 2));
    }
    next();
});

// Initialize Database
initDB();

// Routes
const authRoutes = require('./routes/auth');
const articleRoutes = require('./routes/articles');
const profileRoutes = require('./routes/profiles');
const interactionRoutes = require('./routes/interactions');
const adminRoutes = require('./routes/admin');
// const testRoutes = require('./routes/test'); // Removed for production

app.use('/auth', authLimiter, authRoutes);
// app.use('/test', testRoutes); // Removed for production
app.use('/articles', articleRoutes);
app.use('/profiles', profileRoutes);
app.use('/admin', adminRoutes);
app.use('/drive', require('./routes/drive'));
app.use('/', interactionRoutes); // Mount at root to match /articles/:id/like paths

app.get('/', (req, res) => {
    res.send('My Blog API is running!');
});

// Health Check
app.get('/api/health', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT 1');
        res.json({ status: 'ok', db: 'connected' });
    } catch (error) {
        res.status(500).json({ status: 'error', db: error.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
