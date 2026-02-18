const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Load environment variables
require('dotenv').config();

// Database connection
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: 5432,
});

async function runMigration() {
    try {
        console.log('Starting database migration...');
        
        // Read the migration file
        const migrationPath = path.join(__dirname, 'library_tables_migration.sql');
        let sql = fs.readFileSync(migrationPath, 'utf8');
        
        // Replace schema placeholder with actual schema name
        const schemaName = 'demo'; // Using demo schema as seen in your database
        sql = sql.replace(/\$\{schema\}/g, schemaName);
        
        // Split by semicolon to execute statements one by one
        const statements = sql.split(';').filter(stmt => stmt.trim() !== '');
        
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            for (let i = 0; i < statements.length; i++) {
                const statement = statements[i].trim();
                if (statement) {
                    console.log(`Executing statement ${i + 1}/${statements.length}...`);
                    await client.query(statement);
                }
            }
            
            await client.query('COMMIT');
            console.log('Migration completed successfully!');
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Migration failed:', error);
            throw error;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('Error running migration:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run the migration
runMigration();