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

        // Create User Daily Tasks Table (每日任务)
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
                claimed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_task_date (user_id, task_id, date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);
        console.log('Table "user_daily_tasks" checked/created.');

        // ===== 游戏化中心表 =====
        await connection.query(`CREATE TABLE IF NOT EXISTS game_pets (
            id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL UNIQUE, name VARCHAR(50) NOT NULL DEFAULT '小猫咪',
            species ENUM('cat','dog','dragon','phoenix','rabbit','fox') DEFAULT 'cat', level INT DEFAULT 1, exp INT DEFAULT 0,
            mood INT DEFAULT 80, hunger INT DEFAULT 80, cleanliness INT DEFAULT 80,
            last_fed_at TIMESTAMP NULL, last_played_at TIMESTAMP NULL, last_cleaned_at TIMESTAMP NULL,
            accessory VARCHAR(50) DEFAULT '', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await connection.query(`CREATE TABLE IF NOT EXISTS game_pet_items (
            id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50) NOT NULL,
            type ENUM('food','toy','clean','accessory') NOT NULL,
            effect_mood INT DEFAULT 0, effect_hunger INT DEFAULT 0, effect_clean INT DEFAULT 0,
            price INT NOT NULL DEFAULT 0, emoji VARCHAR(10) DEFAULT '', description VARCHAR(200) DEFAULT ''
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await connection.query(`CREATE TABLE IF NOT EXISTS game_user_items (
            id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, item_id INT NOT NULL, quantity INT DEFAULT 1,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (item_id) REFERENCES game_pet_items(id),
            UNIQUE KEY unique_user_item (user_id, item_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await connection.query(`CREATE TABLE IF NOT EXISTS game_achievements (
            id INT AUTO_INCREMENT PRIMARY KEY, code VARCHAR(50) NOT NULL UNIQUE, name VARCHAR(100) NOT NULL,
            description VARCHAR(255), icon VARCHAR(10) DEFAULT '🏆', category VARCHAR(50) DEFAULT 'general',
            condition_type VARCHAR(50) NOT NULL, condition_value INT NOT NULL,
            reward_coins INT DEFAULT 0, reward_exp INT DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await connection.query(`CREATE TABLE IF NOT EXISTS game_user_achievements (
            id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, achievement_id INT NOT NULL,
            unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, claimed BOOLEAN DEFAULT FALSE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (achievement_id) REFERENCES game_achievements(id),
            UNIQUE KEY unique_user_achievement (user_id, achievement_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await connection.query(`CREATE TABLE IF NOT EXISTS game_challenges (
            id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(100) NOT NULL, description TEXT,
            type ENUM('daily','weekly','special') DEFAULT 'daily', reward_coins INT DEFAULT 0, reward_exp INT DEFAULT 0,
            condition_type VARCHAR(50) NOT NULL, condition_value INT NOT NULL,
            starts_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, ends_at TIMESTAMP NULL, is_active BOOLEAN DEFAULT TRUE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await connection.query(`CREATE TABLE IF NOT EXISTS game_user_challenges (
            id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, challenge_id INT NOT NULL,
            progress INT DEFAULT 0, completed BOOLEAN DEFAULT FALSE, claimed BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (challenge_id) REFERENCES game_challenges(id),
            UNIQUE KEY unique_user_challenge (user_id, challenge_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await connection.query(`CREATE TABLE IF NOT EXISTS game_lottery_prizes (
            id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL,
            type ENUM('coins','item','exp','title','empty') NOT NULL, value INT DEFAULT 0, item_id INT DEFAULT NULL,
            probability DECIMAL(5,2) NOT NULL, emoji VARCHAR(10) DEFAULT '', is_active BOOLEAN DEFAULT TRUE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await connection.query(`CREATE TABLE IF NOT EXISTS game_lottery_records (
            id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, prize_id INT DEFAULT NULL, prize_name VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await connection.query(`CREATE TABLE IF NOT EXISTS game_redeem_codes (
            id INT AUTO_INCREMENT PRIMARY KEY, code VARCHAR(50) NOT NULL UNIQUE, description VARCHAR(255),
            reward_coins INT DEFAULT 0, reward_exp INT DEFAULT 0, reward_item_id INT DEFAULT NULL,
            max_uses INT DEFAULT -1, used_count INT DEFAULT 0, expires_at TIMESTAMP NULL,
            is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await connection.query(`CREATE TABLE IF NOT EXISTS game_redeem_records (
            id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, code_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (code_id) REFERENCES game_redeem_codes(id),
            UNIQUE KEY unique_user_redeem (user_id, code_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await connection.query(`CREATE TABLE IF NOT EXISTS game_gifts (
            id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50) NOT NULL, emoji VARCHAR(10) DEFAULT '',
            price INT NOT NULL DEFAULT 0, description VARCHAR(200) DEFAULT ''
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await connection.query(`CREATE TABLE IF NOT EXISTS game_gift_records (
            id INT AUTO_INCREMENT PRIMARY KEY, sender_id INT NOT NULL, receiver_id INT NOT NULL, gift_id INT NOT NULL,
            message VARCHAR(200) DEFAULT '', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (gift_id) REFERENCES game_gifts(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await connection.query(`CREATE TABLE IF NOT EXISTS game_pk_records (
            id INT AUTO_INCREMENT PRIMARY KEY, challenger_id INT NOT NULL, defender_id INT NOT NULL,
            winner_id INT DEFAULT NULL, type ENUM('coin_flip','dice','rps','number_guess') NOT NULL,
            bet_amount INT DEFAULT 0, challenger_choice VARCHAR(50) DEFAULT '', defender_choice VARCHAR(50) DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (challenger_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (defender_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await connection.query(`CREATE TABLE IF NOT EXISTS game_riddles (
            id INT AUTO_INCREMENT PRIMARY KEY, question VARCHAR(255) NOT NULL, answer VARCHAR(100) NOT NULL,
            hint VARCHAR(255) DEFAULT '', category VARCHAR(50) DEFAULT 'general', difficulty INT DEFAULT 1,
            reward_coins INT DEFAULT 1, is_active BOOLEAN DEFAULT TRUE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await connection.query(`CREATE TABLE IF NOT EXISTS game_user_riddles (
            id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, riddle_id INT NOT NULL,
            answered_correctly BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (riddle_id) REFERENCES game_riddles(id),
            UNIQUE KEY unique_user_riddle (user_id, riddle_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await connection.query(`CREATE TABLE IF NOT EXISTS game_user_titles (
            id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, title VARCHAR(50) NOT NULL,
            source VARCHAR(100) DEFAULT '', equipped BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
        console.log('Game center tables checked/created.');

        // Migration: Add claimed column to user_daily_tasks if not exists
        try {
            await connection.query('ALTER TABLE user_daily_tasks ADD COLUMN claimed BOOLEAN DEFAULT FALSE');
            console.log('Added claimed column to user_daily_tasks.');
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.log('claimed column check:', e.message);
        }

        // Seed game data if tables are empty
        try {
            const [petItemCount] = await connection.query('SELECT COUNT(*) AS cnt FROM game_pet_items');
            if (petItemCount[0].cnt === 0) {
                await connection.query(`INSERT INTO game_pet_items (id, name, type, effect_mood, effect_hunger, effect_clean, price, emoji, description) VALUES
                    (1,'小鱼干','food',5,30,0,5,'🐟','猫咪最爱的零食'),
                    (2,'猫粮','food',2,50,0,8,'🍖','营养均衡的主食'),
                    (3,'牛奶','food',10,20,0,6,'🥛','新鲜的牛奶'),
                    (4,'骨头','food',5,40,0,7,'🦴','狗狗最爱的骨头'),
                    (5,'火龙果','food',15,25,0,10,'🐉','龙族的能量果实'),
                    (6,'毛线球','toy',30,0,0,5,'🧶','永远玩不腻的毛线球'),
                    (7,'飞盘','toy',25,0,0,6,'🥏','一起玩飞盘吧'),
                    (8,'魔法书','toy',20,0,0,12,'📖','凤凰的智慧之书'),
                    (9,'肥皂','clean',0,0,40,4,'🧼','干干净净香喷喷'),
                    (10,'沐浴露','clean',5,0,60,8,'🛁','豪华泡泡浴'),
                    (11,'蝴蝶结','accessory',10,0,0,15,'🎀','可爱的蝴蝶结'),
                    (12,'皇冠','accessory',20,0,0,50,'👑','王者之冠'),
                    (13,'披风','accessory',15,0,0,30,'🧣','英雄的披风')`);
                console.log('Seeded game_pet_items.');
            }
            const [achCount] = await connection.query('SELECT COUNT(*) AS cnt FROM game_achievements');
            if (achCount[0].cnt === 0) {
                await connection.query(`INSERT INTO game_achievements (id, code, name, description, icon, category, condition_type, condition_value, reward_coins, reward_exp) VALUES
                    (1,'first_login','初来乍到','首次登录网站','👋','general','login',1,5,10),
                    (2,'checkin_3','坚持三天','连续签到3天','🔥','checkin','checkin_streak',3,10,20),
                    (3,'checkin_7','一周达人','连续签到7天','🌟','checkin','checkin_streak',7,30,50),
                    (4,'checkin_30','月度之星','连续签到30天','⭐','checkin','checkin_streak',30,100,200),
                    (5,'checkin_100','百日传说','连续签到100天','💫','checkin','checkin_streak',100,500,1000),
                    (6,'article_1','初出茅庐','发布第一篇文章','✍️','content','articles',1,20,30),
                    (7,'article_10','笔耕不辍','发布10篇文章','📝','content','articles',10,100,150),
                    (8,'comment_1','互动新手','发表第一条评论','💬','social','comments',1,5,10),
                    (9,'comment_50','评论达人','发表50条评论','🗣️','social','comments',50,80,100),
                    (10,'liked_10','小有名气','文章累计被赞10次','❤️','social','liked',10,30,50),
                    (11,'liked_100','人气王','文章累计被赞100次','💝','social','liked',100,200,300),
                    (12,'coins_100','小有积蓄','累计获得100硬币','💰','coins','total_earned',100,0,50),
                    (13,'coins_1000','富甲一方','累计获得1000硬币','💎','coins','total_earned',1000,0,200),
                    (14,'pet_adopt','宠物主人','领养第一只宠物','🐾','pet','has_pet',1,10,20),
                    (15,'pet_lv5','宠物训练师','宠物达到5级','🐱','pet','pet_level',5,50,80),
                    (16,'lottery_1','试试手气','第一次抽奖','🎰','lottery','lottery_count',1,0,10),
                    (17,'lottery_50','抽奖狂人','累计抽奖50次','🎲','lottery','lottery_count',50,100,150),
                    (18,'gift_1','慷慨解囊','送出第一份礼物','🎁','social','gift_sent',1,5,10),
                    (19,'pk_win_1','初战告捷','PK对战首次获胜','⚔️','pk','pk_wins',1,10,20),
                    (20,'riddle_1','脑筋急转弯','答对第一道谜题','🧠','riddle','riddles_correct',1,5,10),
                    (21,'redeem_1','彩蛋猎人','首次使用兑换码','🥚','redeem','redeem_count',1,0,15)`);
                console.log('Seeded game_achievements.');
            }
            const [prizeCount] = await connection.query('SELECT COUNT(*) AS cnt FROM game_lottery_prizes');
            if (prizeCount[0].cnt === 0) {
                await connection.query(`INSERT INTO game_lottery_prizes (id, name, type, value, probability, emoji, is_active) VALUES
                    (1,'2硬币','coins',2,25.00,'🪙',TRUE),(2,'5硬币','coins',5,15.00,'💰',TRUE),
                    (3,'10硬币','coins',10,8.00,'💵',TRUE),(4,'50硬币','coins',50,2.00,'💎',TRUE),
                    (5,'10经验','exp',10,20.00,'⭐',TRUE),(6,'30经验','exp',30,10.00,'🌟',TRUE),
                    (7,'小鱼干','item',1,8.00,'🐟',TRUE),(8,'毛线球','item',6,5.00,'🧶',TRUE),
                    (9,'蝴蝶结','item',11,3.00,'🎀',TRUE),(10,'皇冠','item',12,0.50,'👑',TRUE),
                    (11,'称号：欧皇','title',0,0.50,'🏆',TRUE),(12,'谢谢参与','empty',0,3.00,'😅',TRUE)`);
                console.log('Seeded game_lottery_prizes.');
            }
            const [giftCount] = await connection.query('SELECT COUNT(*) AS cnt FROM game_gifts');
            if (giftCount[0].cnt === 0) {
                await connection.query(`INSERT INTO game_gifts (id, name, emoji, price, description) VALUES
                    (1,'鲜花','🌹',2,'送你一朵小红花'),(2,'巧克力','🍫',5,'甜蜜的巧克力'),
                    (3,'蛋糕','🎂',10,'生日快乐'),(4,'火箭','🚀',20,'一飞冲天'),
                    (5,'钻石','💎',50,'闪耀的钻石'),(6,'棒棒糖','🍭',3,'甜蜜棒棒糖'),
                    (7,'爱心','❤️',8,'满满的爱'),(8,'星星','⭐',1,'你是我的星星')`);
                console.log('Seeded game_gifts.');
            }
            const [riddleCount] = await connection.query('SELECT COUNT(*) AS cnt FROM game_riddles');
            if (riddleCount[0].cnt === 0) {
                await connection.query(`INSERT INTO game_riddles (id, question, answer, hint, category, difficulty, reward_coins, is_active) VALUES
                    (1,'什么东西越洗越脏？','水','和洗涤有关','brain',1,1,TRUE),
                    (2,'什么动物最容易被贴在墙上？','海豹','谐音梗','funny',1,1,TRUE),
                    (3,'世界上最长的单词是什么？','smiles','首尾之间','brain',1,1,TRUE),
                    (4,'什么门永远关不上？','球门','和运动有关','brain',1,1,TRUE),
                    (5,'有一个字，人人见了都会念错，这是什么字？','错','就是这个字本身','brain',2,2,TRUE),
                    (6,'什么路最窄？','冤家路窄','四字成语','brain',2,2,TRUE),
                    (7,'红口袋绿口袋有人怕有人爱（打一蔬菜）','辣椒','厨房常见','riddle',1,1,TRUE),
                    (8,'千条线万条线掉到水里看不见（打一自然现象）','雨','天上来的','riddle',1,1,TRUE),
                    (9,'小白花飞满天下到地上象白面下到水里看不见（打一自然现象）','雪','冬天才有','riddle',1,2,TRUE),
                    (10,'什么鸡没有翅膀？','田鸡','不是家禽','funny',2,2,TRUE)`);
                console.log('Seeded game_riddles.');
            }
            const [codeCount] = await connection.query('SELECT COUNT(*) AS cnt FROM game_redeem_codes');
            if (codeCount[0].cnt === 0) {
                await connection.query(`INSERT INTO game_redeem_codes (code, description, reward_coins, reward_exp, max_uses, expires_at, is_active) VALUES
                    ('WELCOME2026','欢迎来到游戏中心！',10,20,-1,NULL,TRUE),
                    ('HAKIMI_BLOG','站长的彩蛋',50,100,100,NULL,TRUE),
                    ('GAME_MASTER','游戏高手兑换码',30,50,50,'2027-12-31 23:59:59',TRUE),
                    ('LUCKY_DAY','幸运日！',20,30,200,'2027-06-30 23:59:59',TRUE),
                    ('EASTER_EGG','你找到了彩蛋！',100,200,10,NULL,TRUE)`);
                console.log('Seeded game_redeem_codes.');
            }
        } catch (seedErr) { console.error('Game data seed error:', seedErr.message); }

        // ===== 游戏化中心V2表 =====
        await connection.query(`CREATE TABLE IF NOT EXISTS game_chat_rooms (
            id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL, description VARCHAR(255) DEFAULT '',
            type ENUM('public','private','clan') DEFAULT 'public', creator_id INT DEFAULT NULL,
            max_members INT DEFAULT 50, last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT TRUE, FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await connection.query(`CREATE TABLE IF NOT EXISTS game_chat_messages (
            id INT AUTO_INCREMENT PRIMARY KEY, room_id INT NOT NULL, user_id INT NOT NULL,
            content TEXT NOT NULL, type ENUM('text','system','emoji') DEFAULT 'text',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (room_id) REFERENCES game_chat_rooms(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_room_time (room_id, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await connection.query(`CREATE TABLE IF NOT EXISTS game_chat_members (
            id INT AUTO_INCREMENT PRIMARY KEY, room_id INT NOT NULL, user_id INT NOT NULL,
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (room_id) REFERENCES game_chat_rooms(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_room_user (room_id, user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await connection.query(`CREATE TABLE IF NOT EXISTS game_clans (
            id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50) NOT NULL UNIQUE,
            description VARCHAR(255) DEFAULT '', emblem VARCHAR(10) DEFAULT '🛡️',
            leader_id INT NOT NULL, level INT DEFAULT 1, exp INT DEFAULT 0, coins INT DEFAULT 0,
            max_members INT DEFAULT 20, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await connection.query(`CREATE TABLE IF NOT EXISTS game_clan_members (
            id INT AUTO_INCREMENT PRIMARY KEY, clan_id INT NOT NULL, user_id INT NOT NULL UNIQUE,
            role ENUM('leader','elder','member') DEFAULT 'member', joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (clan_id) REFERENCES game_clans(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await connection.query(`CREATE TABLE IF NOT EXISTS game_clan_wars (
            id INT AUTO_INCREMENT PRIMARY KEY, challenger_id INT NOT NULL, defender_id INT NOT NULL,
            winner_id INT DEFAULT NULL, start_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, end_at TIMESTAMP NULL,
            FOREIGN KEY (challenger_id) REFERENCES game_clans(id), FOREIGN KEY (defender_id) REFERENCES game_clans(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await connection.query(`CREATE TABLE IF NOT EXISTS game_forum_posts (
            id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, title VARCHAR(200) NOT NULL,
            content TEXT NOT NULL, category VARCHAR(50) DEFAULT 'general', likes INT DEFAULT 0,
            replies INT DEFAULT 0, is_pinned BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_category (category), FULLTEXT INDEX ft_post (title, content)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await connection.query(`CREATE TABLE IF NOT EXISTS game_forum_replies (
            id INT AUTO_INCREMENT PRIMARY KEY, post_id INT NOT NULL, user_id INT NOT NULL,
            content TEXT NOT NULL, likes INT DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (post_id) REFERENCES game_forum_posts(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await connection.query(`CREATE TABLE IF NOT EXISTS game_cosmetics (
            id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(50) NOT NULL,
            type ENUM('avatar_frame','chat_bubble','background','name_color','name_effect') NOT NULL,
            value VARCHAR(255) NOT NULL, price INT NOT NULL DEFAULT 0,
            rarity ENUM('common','rare','epic','legendary') DEFAULT 'common',
            emoji VARCHAR(10) DEFAULT '', description VARCHAR(200) DEFAULT ''
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await connection.query(`CREATE TABLE IF NOT EXISTS game_user_cosmetics (
            id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, cosmetic_id INT NOT NULL,
            equipped BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (cosmetic_id) REFERENCES game_cosmetics(id),
            UNIQUE KEY unique_user_cosmetic (user_id, cosmetic_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await connection.query(`CREATE TABLE IF NOT EXISTS game_events (
            id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL, description TEXT,
            type ENUM('double_exp','double_coins','limited_shop','festival','boss_fight') NOT NULL,
            multiplier DECIMAL(3,2) DEFAULT 1.00, starts_at TIMESTAMP NOT NULL, ends_at TIMESTAMP NOT NULL,
            is_active BOOLEAN DEFAULT TRUE, config JSON DEFAULT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await connection.query(`CREATE TABLE IF NOT EXISTS game_stocks (
            id INT AUTO_INCREMENT PRIMARY KEY, symbol VARCHAR(10) NOT NULL UNIQUE, name VARCHAR(50) NOT NULL,
            current_price DECIMAL(10,2) NOT NULL DEFAULT 1.00, previous_price DECIMAL(10,2) NOT NULL DEFAULT 1.00,
            total_volume INT DEFAULT 0, volatility DECIMAL(3,2) DEFAULT 0.15,
            emoji VARCHAR(10) DEFAULT '📈', category VARCHAR(50) DEFAULT 'general',
            is_active BOOLEAN DEFAULT TRUE, last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await connection.query(`CREATE TABLE IF NOT EXISTS game_stock_history (
            id INT AUTO_INCREMENT PRIMARY KEY, stock_id INT NOT NULL, price DECIMAL(10,2) NOT NULL,
            volume INT DEFAULT 0, recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (stock_id) REFERENCES game_stocks(id) ON DELETE CASCADE,
            INDEX idx_stock_time (stock_id, recorded_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await connection.query(`CREATE TABLE IF NOT EXISTS game_stock_holdings (
            id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, stock_id INT NOT NULL,
            shares INT NOT NULL DEFAULT 0, avg_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (stock_id) REFERENCES game_stocks(id),
            UNIQUE KEY unique_user_stock (user_id, stock_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await connection.query(`CREATE TABLE IF NOT EXISTS game_minigame_scores (
            id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, game_type VARCHAR(30) NOT NULL,
            score INT NOT NULL DEFAULT 0, level INT DEFAULT 1, data JSON DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_game_score (game_type, score DESC)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
        console.log('Game center V2 tables checked/created.');

        // Seed V2 data
        try {
            const [chatCount] = await connection.query('SELECT COUNT(*) AS cnt FROM game_chat_rooms');
            if (chatCount[0].cnt === 0) {
                await connection.query("INSERT INTO game_chat_rooms (id, name, description, type) VALUES (1,'大厅','所有人欢迎的公共聊天室','public'),(2,'交易大厅','讨论股市和交易策略','public'),(3,'组队区','找队友一起PK','public')");
            }
            const [cosCount] = await connection.query('SELECT COUNT(*) AS cnt FROM game_cosmetics');
            if (cosCount[0].cnt === 0) {
                await connection.query(`INSERT INTO game_cosmetics (id, name, type, value, price, rarity, emoji, description) VALUES
                    (1,'经典银框','avatar_frame','border:2px solid #c0c0c0',10,'common','⭕','简约银色头像框'),
                    (2,'烈焰红框','avatar_frame','border:2px solid #ff4757;box-shadow:0 0 8px #ff4757',30,'rare','🔥','燃烧的红色边框'),
                    (3,'星耀金框','avatar_frame','border:2px solid #ffd700;box-shadow:0 0 12px #ffd700',80,'legendary','✨','金色传说头像框'),
                    (4,'幽蓝气泡','chat_bubble','background:linear-gradient(135deg,#1e90ff,#00bfff)',15,'common','💬','蓝色渐变气泡'),
                    (5,'彩虹气泡','chat_bubble','background:linear-gradient(90deg,#ff6b6b,#ffa502,#2ed573,#1e90ff,#a29bfe)',50,'epic','🌈','七彩渐变气泡'),
                    (6,'暗夜背景','background','background:linear-gradient(135deg,#0c0c1d,#1a1a2e)',20,'common','🌙','深夜星空背景'),
                    (7,'樱花背景','background','background:linear-gradient(135deg,#ffecd2,#fcb69f)',40,'rare','🌸','温柔樱花背景'),
                    (8,'红色昵称','name_color','color:#ff4757',25,'rare','🔴','让你的名字变成红色'),
                    (9,'金色昵称','name_color','color:#ffd700;text-shadow:0 0 6px rgba(255,215,0,0.5)',60,'legendary','🟡','闪耀金色昵称'),
                    (10,'发光昵称','name_effect','text-shadow:0 0 10px #667eea,0 0 20px #764ba2',45,'epic','💫','紫色光晕效果')`);
            }
            const [stockCount] = await connection.query('SELECT COUNT(*) AS cnt FROM game_stocks');
            if (stockCount[0].cnt === 0) {
                await connection.query(`INSERT INTO game_stocks (id, symbol, name, current_price, previous_price, volatility, emoji, category) VALUES
                    (1,'CAT','猫咪科技',10.00,10.00,0.12,'🐱','tech'),
                    (2,'DOG','狗狗能源',8.50,8.50,0.15,'🐕','energy'),
                    (3,'DRG','龙族金融',25.00,25.00,0.10,'🐉','finance'),
                    (4,'PHX','凤凰文娱',15.00,15.00,0.18,'🦅','media'),
                    (5,'RBT','兔兔消费',6.00,6.00,0.20,'🐰','consumer'),
                    (6,'FOx','狐狸通信',12.00,12.00,0.14,'🦊','telecom'),
                    (7,'BLOG','博客指数',20.00,20.00,0.08,'📝','index'),
                    (8,'GOLD','金猫币ETF',50.00,50.00,0.05,'🪙','etf')`);
            }
        } catch (seed2Err) { console.error('Game V2 seed error:', seed2Err.message); }

        // ===== 游戏化中心V3表 =====
        await connection.query(`CREATE TABLE IF NOT EXISTS game_fishing (
            id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL UNIQUE,
            energy INT DEFAULT 10, max_energy INT DEFAULT 10, bait VARCHAR(20) DEFAULT 'basic',
            total_caught INT DEFAULT 0, best_catch VARCHAR(50) DEFAULT NULL,
            last_refill TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            last_energy_refill TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await connection.query(`CREATE TABLE IF NOT EXISTS game_farm_plots (
            id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, plot_index INT NOT NULL,
            crop_name VARCHAR(50) DEFAULT NULL, crop_emoji VARCHAR(10) DEFAULT NULL,
            planted_at TIMESTAMP NULL, grow_minutes INT DEFAULT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_user_plot (user_id, plot_index)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await connection.query(`CREATE TABLE IF NOT EXISTS game_pet_battles (
            id INT AUTO_INCREMENT PRIMARY KEY, challenger_id INT NOT NULL, defender_id INT NOT NULL,
            winner_id INT DEFAULT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (challenger_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (defender_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await connection.query(`CREATE TABLE IF NOT EXISTS game_marriages (
            id INT AUTO_INCREMENT PRIMARY KEY, partner1_id INT NOT NULL, partner2_id INT NOT NULL,
            proposer_id INT NOT NULL, status ENUM('pending','married','divorced','rejected') DEFAULT 'pending',
            married_at TIMESTAMP NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (partner1_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (partner2_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (proposer_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await connection.query(`CREATE TABLE IF NOT EXISTS game_mentorship_requests (
            id INT AUTO_INCREMENT PRIMARY KEY, mentor_id INT NOT NULL, apprentice_id INT NOT NULL,
            status ENUM('pending','accepted','rejected') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (apprentice_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await connection.query(`CREATE TABLE IF NOT EXISTS game_mentorships (
            id INT AUTO_INCREMENT PRIMARY KEY, mentor_id INT NOT NULL, apprentice_id INT NOT NULL,
            status ENUM('active','ended') DEFAULT 'active', last_bonus DATE DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (apprentice_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await connection.query(`CREATE TABLE IF NOT EXISTS game_dice_records (
            id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, dice VARCHAR(20) NOT NULL,
            total INT NOT NULL, guess VARCHAR(20) NOT NULL, bet INT DEFAULT 0,
            won BOOLEAN DEFAULT FALSE, win_amount INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await connection.query(`CREATE TABLE IF NOT EXISTS game_lucky_number_daily (
            date DATE PRIMARY KEY, number INT NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await connection.query(`CREATE TABLE IF NOT EXISTS game_lucky_numbers (
            id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, date DATE NOT NULL,
            guess INT NOT NULL, actual INT NOT NULL, reward INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_user_date (user_id, date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await connection.query(`CREATE TABLE IF NOT EXISTS game_adventure_progress (
            id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL UNIQUE,
            current_stage INT DEFAULT 1, max_stage INT DEFAULT 1, total_runs INT DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

        await connection.query(`CREATE TABLE IF NOT EXISTS game_fortunes (
            id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, date DATE NOT NULL,
            level VARCHAR(10) NOT NULL, text VARCHAR(255) NOT NULL, emoji VARCHAR(10) DEFAULT '',
            luck DECIMAL(3,2) DEFAULT 1.0, lucky_color VARCHAR(10) DEFAULT '', lucky_number INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_user_fortune_date (user_id, date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
        console.log('Game center V3 tables checked/created.');

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
