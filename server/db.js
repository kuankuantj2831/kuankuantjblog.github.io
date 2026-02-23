require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'my_blog_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
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

        // Seed Admin User
        try {
            const adminUsername = process.env.ADMIN_USERNAME || 'kuankuantj';
            const adminPassword = process.env.ADMIN_PASSWORD || '137abc,./';
            const hashedPassword = await bcrypt.hash(adminPassword, 10);

            // Check if admin exists
            const [admins] = await connection.query('SELECT id FROM users WHERE username = ?', [adminUsername]);

            if (admins.length > 0) {
                // Update existing admin
                await connection.query('UPDATE users SET role = "admin", password_hash = ? WHERE username = ?', [hashedPassword, adminUsername]);
                console.log('Admin user updated.');
            } else {
                // Create new admin
                await connection.query('INSERT INTO users (username, password_hash, role) VALUES (?, ?, "admin")', [adminUsername, hashedPassword]);
                console.log('Admin user created.');
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

    } catch (error) {
        console.error('Database initialization failed:', error);
        console.error('Please check your .env file and ensure MySQL is running.');
        // Don't exit process, just log error so api can still start (maybe)
    } finally {
        if (connection) connection.release();
    }
}

module.exports = {
    pool,
    initDB
};
