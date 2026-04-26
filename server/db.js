require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'my_blog_db',
    port: process.env.DB_PORT || 3306,
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 3, // SCF 冷启动环境优化，减少连接开销
    queueLimit: 0,
    connectTimeout: 10000, // 10秒连接超时
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
};

// Create a pool
const pool = mysql.createPool(dbConfig);

// Initialization function
async function initDB() {
    console.log('Initializing database...');
    let connection;
    try {
        // Connect directly to the database (User confirmed it exists)
        connection = await pool.getConnection();
        console.log(`Connected to database '${dbConfig.database}' successfully.`);

        // 确保连接和数据库使用 utf8mb4
        await connection.query("SET NAMES utf8mb4");
        await connection.query(`ALTER DATABASE \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`).catch(() => {});

        // Create Users Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                email VARCHAR(100) UNIQUE,
                phone VARCHAR(20) UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                avatar_url VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // Migration: Add phone column if not exists (for existing dbs)
        try {
            await connection.query('ALTER TABLE users ADD COLUMN phone VARCHAR(20) UNIQUE');
            console.log('Added phone column to users table.');
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.log('Phone column check:', e.message);
        }

        // Migration: Add role column if not exists
        try {
            await connection.query("ALTER TABLE users ADD COLUMN role VARCHAR(10) DEFAULT 'user'");
            console.log('Added role column to users table.');
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.log('Role column check:', e.message);
        }
        console.log('Table "users" checked/created.');

        // Migration: Add is_2fa_enabled column if not exists
        try {
            await connection.query("ALTER TABLE users ADD COLUMN is_2fa_enabled BOOLEAN DEFAULT FALSE");
            console.log('Added is_2fa_enabled column to users table.');
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.log('2FA column check:', e.message);
        }

        // Migration: Add total_donated column if not exists (累计赞助金额)
        try {
            await connection.query("ALTER TABLE users ADD COLUMN total_donated DECIMAL(10,2) NOT NULL DEFAULT 0");
            console.log('Added total_donated column to users table.');
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.log('total_donated column check:', e.message);
        }

        // Create Verification Codes Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS verification_codes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                code VARCHAR(6) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                type VARCHAR(20) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('Table "verification_codes" checked/created.');

        // Seed Admin User（密码从环境变量读取，不再硬编码）
        try {
            const adminUsername = process.env.ADMIN_USERNAME;
            const adminPassword = process.env.ADMIN_PASSWORD;
            if (!adminUsername || !adminPassword) {
                console.log('Admin credentials not set in .env, skipping admin seed.');
            } else {
                const hashedPassword = await bcrypt.hash(adminPassword, 10);
                const [admins] = await connection.query('SELECT id FROM users WHERE username = ?', [adminUsername]);
                if (admins.length > 0) {
                    await connection.query('UPDATE users SET role = "admin", password_hash = ? WHERE username = ?', [hashedPassword, adminUsername]);
                    console.log('Admin user updated.');
                } else {
                    await connection.query('INSERT INTO users (username, password_hash, role) VALUES (?, ?, "admin")', [adminUsername, hashedPassword]);
                    console.log('Admin user created.');
                }
            }
        } catch (e) {
            console.error('Admin seeding failed:', e);
        }

        // Create Articles Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS articles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content LONGTEXT NOT NULL,
                summary TEXT,
                category VARCHAR(50),
                tags VARCHAR(255),
                cover_image VARCHAR(255),
                author_id INT NOT NULL,
                author_name VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('Table "articles" checked/created.');

        // Migration: Add view_count column if not exists
        try {
            await connection.query('ALTER TABLE articles ADD COLUMN view_count INT NOT NULL DEFAULT 0');
            console.log('Added view_count column to articles table.');
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.log('view_count column check:', e.message);
        }

        // Create Likes Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS likes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                article_id INT NOT NULL,
                user_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_like (article_id, user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('Table "likes" checked/created.');

        // Create Comments Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS comments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                article_id INT NOT NULL,
                user_id INT NOT NULL,
                user_name VARCHAR(100),
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('Table "comments" checked/created.');

        // Migration: Add parent_id column for nested comments
        try {
            await connection.query('ALTER TABLE comments ADD COLUMN parent_id INT DEFAULT NULL');
            console.log('Added parent_id column to comments table.');
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.log('parent_id column check:', e.message);
        }

        // Create User Coins Table (硬币余额)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS user_coins (
                user_id INT PRIMARY KEY,
                balance INT NOT NULL DEFAULT 0,
                total_earned INT NOT NULL DEFAULT 0,
                total_spent INT NOT NULL DEFAULT 0,
                last_checkin DATE DEFAULT NULL,
                checkin_streak INT NOT NULL DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('Table "user_coins" checked/created.');

        // Create Coin Transactions Table (硬币交易记录)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS coin_transactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                amount INT NOT NULL,
                type ENUM('checkin', 'publish', 'liked', 'comment', 'donate', 'receive', 'admin') NOT NULL,
                description VARCHAR(255),
                related_id INT DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('Table "coin_transactions" checked/created.');

        // Create Donations Table (捐助记录)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS donations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_no VARCHAR(64) NOT NULL UNIQUE,
                trade_no VARCHAR(64) DEFAULT NULL,
                user_id INT DEFAULT NULL,
                donor_name VARCHAR(100) DEFAULT '匿名好心人',
                amount DECIMAL(10,2) NOT NULL,
                message VARCHAR(500) DEFAULT '',
                payment_method ENUM('wechat', 'alipay') DEFAULT 'wechat',
                status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
                paid_at TIMESTAMP NULL DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('Table "donations" checked/created.');

        // Create Donation Goals Table (捐助目标)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS donation_goals (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                target_amount DECIMAL(10,2) NOT NULL,
                current_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('Table "donation_goals" checked/created.');

        // Create Favorites Table (文章收藏)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS favorites (
                id INT AUTO_INCREMENT PRIMARY KEY,
                article_id INT NOT NULL,
                user_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_favorite (article_id, user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('Table "favorites" checked/created.');

        // Create Messages Table (站内消息/私信)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sender_id INT NOT NULL,
                receiver_id INT NOT NULL,
                content TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_receiver_read (receiver_id, is_read),
                INDEX idx_conversation (sender_id, receiver_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('Table "messages" checked/created.');

        // Create Notifications Table (系统通知)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                type ENUM('comment', 'like', 'favorite', 'system', 'article') NOT NULL,
                title VARCHAR(255) NOT NULL,
                content TEXT,
                related_id INT DEFAULT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_read (user_id, is_read)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('Table "notifications" checked/created.');

        // Create Game Scores Table (游戏排行榜)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS game_scores (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                game_name VARCHAR(50) NOT NULL,
                score INT NOT NULL DEFAULT 0,
                play_time INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_game_score (game_name, score DESC)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('Table "game_scores" checked/created.');

        // Create File Shares Table (网盘分享)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS file_shares (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                share_code VARCHAR(16) NOT NULL UNIQUE,
                file_key VARCHAR(500) NOT NULL,
                file_name VARCHAR(255) NOT NULL,
                password VARCHAR(32) DEFAULT NULL,
                expires_at TIMESTAMP NULL DEFAULT NULL,
                max_downloads INT DEFAULT NULL,
                download_count INT NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_share_code (share_code)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('Table "file_shares" checked/created.');

        // Create User Online Status Table (在线状态)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS user_online (
                user_id INT PRIMARY KEY,
                last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('Table "user_online" checked/created.');

        // Create Visitor Online Status Table (匿名访客在线状态)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS visitor_online (
                visitor_id VARCHAR(64) PRIMARY KEY,
                last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_last_active (last_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('Table "visitor_online" checked/created.');

        // Create Knowledge Table (知识库)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS knowledge (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content LONGTEXT NOT NULL,
                summary TEXT,
                category VARCHAR(50),
                tags VARCHAR(255),
                author_id INT NOT NULL,
                author_name VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
                FULLTEXT INDEX ft_knowledge (title, content)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('Table "knowledge" checked/created.');

        // Create Daily Tasks Table (每日任务)
        await connection.query(`
            CREATE TABLE IF NOT EXISTS user_daily_tasks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                task_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                reward INT NOT NULL DEFAULT 0,
                type VARCHAR(50) NOT NULL,
                date DATE NOT NULL,
                completed BOOLEAN DEFAULT FALSE,
                completed_at TIMESTAMP NULL DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_task_date (user_id, task_id, date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('Table "user_daily_tasks" checked/created.');

        // Seed default donation goal if none exists
        try {
            const [goals] = await connection.query('SELECT id FROM donation_goals LIMIT 1');
            if (goals.length === 0) {
                await connection.query(
                    'INSERT INTO donation_goals (title, description, target_amount) VALUES (?, ?, ?)',
                    ['服务器续费基金', '帮助猫爬架维持服务器运行，让更多人享受免费资源分享！', 500.00]
                );
                console.log('Default donation goal created.');
            }
        } catch (e) {
            console.log('Donation goal seed:', e.message);
        }
        try {
            const [goals] = await connection.query('SELECT id FROM donation_goals LIMIT 1');
            if (goals.length === 0) {
                await connection.query(
                    'INSERT INTO donation_goals (title, description, target_amount) VALUES (?, ?, ?)',
                    ['服务器续费基金', '帮助猫爬架维持服务器运行，让更多人享受免费资源分享！', 500.00]
                );
                console.log('Default donation goal created.');
            }
        } catch (e) {
            console.log('Donation goal seed:', e.message);
        }

        // 迁移：确保所有表都使用 utf8mb4（修复 emoji 显示为问号）
        try {
            const [tables] = await connection.query(
                "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_COLLATION != 'utf8mb4_unicode_ci'",
                [dbConfig.database]
            );
            for (const t of tables) {
                await connection.query(`ALTER TABLE \`${t.TABLE_NAME}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
                console.log(`Converted table ${t.TABLE_NAME} to utf8mb4.`);
            }
        } catch (e) {
            console.log('utf8mb4 migration:', e.message);
        }

    } catch (error) {
        console.error('Database initialization failed:', error);
        console.error('Please check your .env file and ensure MySQL is running.');
        // Don't exit process, just log error so api can still start (maybe)
    } finally {
        if (connection) connection.release();
    }
}

/**
 * 根据累计赞助金额计算用户头衔
 * @param {number} totalDonated - 累计赞助金额
 * @returns {string} 头衔：'' | 'VIP' | 'MVP'
 */
function getUserTitle(totalDonated, username) {
    if (username === 'kuankuantj') return '站长';
    const amount = parseFloat(totalDonated) || 0;
    if (amount >= 10) return 'MVP';
    if (amount >= 5) return 'VIP';
    return '';
}

/**
 * 等级经验阈值表（累计经验 → 等级）
 * Lv1: 0, Lv2: 50, Lv3: 150, Lv4: 350, Lv5: 700,
 * Lv6: 1200, Lv7: 2000, Lv8: 3500, Lv9: 6000, Lv10: 10000
 */
const LEVEL_THRESHOLDS = [0, 50, 150, 350, 700, 1200, 2000, 3500, 6000, 10000];

function calcLevel(exp) {
    let lv = 1;
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
        if (exp >= LEVEL_THRESHOLDS[i]) { lv = i + 1; break; }
    }
    const maxLv = LEVEL_THRESHOLDS.length;
    if (lv >= maxLv) return { level: maxLv, exp, nextExp: null, progress: 1 };
    const cur = LEVEL_THRESHOLDS[lv - 1];
    const next = LEVEL_THRESHOLDS[lv];
    return { level: lv, exp, nextExp: next, progress: (exp - cur) / (next - cur) };
}

/**
 * 获取用户等级信息（动态计算）
 * 经验来源：total_earned 硬币 + 发文数*20 + 评论数*5 + 被赞数*3
 */
async function getUserLevel(userId) {
    const [[coinRow]] = await pool.query(
        'SELECT COALESCE(total_earned, 0) AS total_earned FROM user_coins WHERE user_id = ?', [userId]
    );
    const [[artRow]] = await pool.query(
        'SELECT COUNT(*) AS cnt FROM articles WHERE author_id = ?', [userId]
    );
    const [[cmtRow]] = await pool.query(
        'SELECT COUNT(*) AS cnt FROM comments WHERE user_id = ?', [userId]
    );
    const [[likeRow]] = await pool.query(
        'SELECT COUNT(*) AS cnt FROM likes l JOIN articles a ON l.article_id = a.id WHERE a.author_id = ?', [userId]
    );
    const earned = (coinRow ? coinRow.total_earned : 0);
    const articles = artRow ? artRow.cnt : 0;
    const comments = cmtRow ? cmtRow.cnt : 0;
    const liked = likeRow ? likeRow.cnt : 0;
    const totalExp = earned + articles * 20 + comments * 5 + liked * 3;
    return { ...calcLevel(totalExp), breakdown: { earned, articles, comments, liked } };
}

module.exports = {
    pool,
    initDB,
    getUserTitle,
    getUserLevel,
    calcLevel,
    LEVEL_THRESHOLDS
};
