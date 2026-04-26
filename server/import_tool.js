const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { initDB } = require('./db'); // Re-use init logic to ensure tables exist
require('dotenv').config();

const BACKUP_DIR = path.join(__dirname, '../backup_mysql_data');

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
};

// Import Order matches foreign key dependencies: Users first, then Articles, etc.
const IMPORT_ORDER = ['users', 'articles', 'comments', 'likes', 'verification_codes'];

async function importData() {
    console.log('Starting MySQL Data Import...');

    // 1. Initialize Tables
    console.log('Ensuring table structure...');
    await initDB();

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log(`Connected to ${dbConfig.host}`);

        // 2. Import Files
        for (const tableName of IMPORT_ORDER) {
            const filePath = path.join(BACKUP_DIR, `${tableName}.json`);

            if (!fs.existsSync(filePath)) {
                console.log(`Skipping ${tableName} (No backup file found)`);
                continue;
            }

            const fileContent = fs.readFileSync(filePath, 'utf8');
            const records = JSON.parse(fileContent);

            if (records.length === 0) {
                console.log(`Skipping ${tableName} (Empty records)`);
                continue;
            }

            console.log(`Importing ${tableName} (${records.length} records)...`);

            // Construct Insert Statement
            // Assuming all records have same keys, grab keys from first record
            const keys = Object.keys(records[0]);
            const placeholders = keys.map(() => '?').join(',');
            const sql = `INSERT IGNORE INTO \`${tableName}\` (\`${keys.join('`,`')}\`) VALUES (${placeholders})`;

            for (const record of records) {
                const values = keys.map(key => {
                    const val = record[key];
                    // Handle ISO Date strings if necessary, though mysql2 usually handles them
                    if (typeof val === 'string' && val.endsWith('Z') && !isNaN(Date.parse(val))) {
                        return new Date(val);
                    }
                    return val;
                });

                await connection.execute(sql, values);
            }
            console.log(`  > Done.`);
        }

        console.log('\nImport completed successfully!');

    } catch (error) {
        console.error('Import failed:', error);
    } finally {
        if (connection) await connection.end();
        // Since initDB creates a pool, we might need to exit explicitly if the pool hangs
        process.exit(0);
    }
}

importData();
