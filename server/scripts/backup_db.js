const fs = require('fs');
const path = require('path');
const { pool } = require('../db');

// Ensure backups directory exists
const backupDir = path.join(__dirname, '../../backups');
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

async function backup() {
    console.log('📦 Starting database backup...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupFile = path.join(backupDir, `backup_${timestamp}.json`);

    const tables = ['users', 'articles', 'comments', 'likes', 'verification_codes'];
    const data = {};

    let connection;
    try {
        connection = await pool.getConnection();

        for (const table of tables) {
            console.log(`Reading table: ${table}...`);
            const [rows] = await connection.query(`SELECT * FROM ${table}`);
            data[table] = rows;
        }

        fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
        console.log(`✅ Backup successful! Saved to: ${backupFile}`);
        console.log(`   (Size: ${(fs.statSync(backupFile).size / 1024).toFixed(2)} KB)`);

    } catch (error) {
        console.error('❌ Backup failed:', error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

backup();
