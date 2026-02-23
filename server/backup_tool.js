const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const BACKUP_DIR = path.join(__dirname, '../backup_mysql_data');

if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR);
}

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
};

async function backup() {
    console.log('Starting MySQL backup...');
    console.log(`Connecting to ${dbConfig.host}:${dbConfig.port}...`);

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to MySQL.');

        // Get list of tables
        const [tables] = await connection.query('SHOW TABLES');
        const tableKey = `Tables_in_${dbConfig.database}`;

        for (const row of tables) {
            const tableName = row[tableKey];
            console.log(`Backing up table: ${tableName}...`);

            const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``);
            const filePath = path.join(BACKUP_DIR, `${tableName}.json`);

            fs.writeFileSync(filePath, JSON.stringify(rows, null, 2));
            console.log(`  > Saved ${rows.length} records to ${filePath}`);
        }

        console.log('\nBackup completed successfully!');
        console.log(`Files saved in: ${BACKUP_DIR}`);

    } catch (error) {
        console.error('Backup failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

backup();
