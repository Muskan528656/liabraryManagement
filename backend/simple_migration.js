const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: 5432,
});

async function runMigration() {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        console.log('Starting migration...');
        
        // 1. Check if classification table exists, create if not
        const classificationExists = await client.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'demo' AND table_name = 'classification'
            )
        `);
        
        if (!classificationExists.rows[0].exists) {
            console.log('Creating classification table...');
            await client.query(`
                CREATE TABLE demo.classification (
                    id UUID NOT NULL DEFAULT uuid_generate_v4(),
                    classification_type VARCHAR(10) NOT NULL,
                    code VARCHAR(50),
                    category VARCHAR(255),
                    name VARCHAR(255) NOT NULL,
                    classification_from VARCHAR(50),
                    classification_to VARCHAR(50),
                    is_active BOOLEAN DEFAULT TRUE,
                    createddate TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    lastmodifieddate TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    createdbyid UUID,
                    lastmodifiedbyid UUID,
                    branch_id UUID,
                    CONSTRAINT classification_pkey PRIMARY KEY (id)
                )
            `);
            
            // Add indexes
            await client.query('CREATE INDEX IF NOT EXISTS idx_classification_type ON demo.classification(classification_type)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_classification_code ON demo.classification(code)');
            await client.query('CREATE INDEX IF NOT EXISTS idx_classification_branch ON demo.classification(branch_id)');
        }
        
        // 2. Add classification_id to books if not exists
        const booksColumnExists = await client.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'demo' AND table_name = 'books' AND column_name = 'classification_id'
            )
        `);
        
        if (!booksColumnExists.rows[0].exists) {
            console.log('Adding classification_id column to books...');
            await client.query('ALTER TABLE demo.books ADD COLUMN classification_id UUID');
            
            // Add foreign key constraint
            await client.query(`
                ALTER TABLE demo.books
                ADD CONSTRAINT fk_books_classification
                FOREIGN KEY (classification_id)
                REFERENCES demo.classification(id)
                ON DELETE SET NULL
            `);
            
            // Add indexes
            await client.query('CREATE INDEX IF NOT EXISTS idx_books_classification ON demo.books(classification_id)');
        }
        
        // 3. Add rack_mapping_id to items if not exists
        const itemsColumnExists = await client.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'demo' AND table_name = 'items' AND column_name = 'rack_mapping_id'
            )
        `);
        
        if (!itemsColumnExists.rows[0].exists) {
            console.log('Adding rack_mapping_id column to items...');
            await client.query('ALTER TABLE demo.book_copy ADD COLUMN rack_mapping_id UUID');
            
            // Add foreign key constraint
            await client.query(`
                ALTER TABLE demo.book_copy
                ADD CONSTRAINT fk_items_rack_mapping
                FOREIGN KEY (rack_mapping_id)
                REFERENCES demo.rack_mapping(id)
                ON DELETE SET NULL
            `);
            
            // Add indexes
            await client.query('CREATE INDEX IF NOT EXISTS idx_items_rack_mapping ON demo.book_copy(rack_mapping_id)');
        }
        
        // 4. Add indexes for better performance
        console.log('Creating additional indexes...');
        await client.query('CREATE INDEX IF NOT EXISTS idx_books_title ON demo.books(title)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_books_isbn ON demo.books(isbn)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_items_barcode ON demo.book_copy(barcode)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_items_callnumber ON demo.book_copy(itemcallnumber)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_items_status ON demo.book_copy(status)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_rack_mapping_branch ON demo.rack_mapping(branch_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_rack_mapping_classification ON demo.rack_mapping(classification_type, classification_from, classification_to)');
        
        // 5. Insert sample classification data if table is empty
        const classificationCount = await client.query('SELECT COUNT(*) FROM demo.classification');
        if (parseInt(classificationCount.rows[0].count) === 0) {
            console.log('Inserting sample classification data...');
            await client.query(`
                INSERT INTO demo.classification (id, classification_type, code, category, name, classification_from, classification_to, is_active) VALUES
                ('10000000-0000-0000-0000-000000000001', 'DDC', '000', 'Generalities', 'Computer science, information & general works', '000', '099', TRUE),
                ('10000000-0000-0000-0000-000000000002', 'DDC', '100', 'Philosophy & Psychology', 'Philosophy & psychology', '100', '199', TRUE),
                ('10000000-0000-0000-0000-000000000003', 'DDC', '200', 'Religion', 'Religion', '200', '299', TRUE),
                ('10000000-0000-0000-0000-000000000004', 'DDC', '300', 'Social Sciences', 'Social sciences', '300', '399', TRUE),
                ('10000000-0000-0000-0000-000000000005', 'DDC', '400', 'Language', 'Language', '400', '499', TRUE),
                ('10000000-0000-0000-0000-000000000006', 'DDC', '500', 'Science', 'Pure Science', '500', '599', TRUE),
                ('10000000-0000-0000-0000-000000000007', 'DDC', '600', 'Technology', 'Technology', '600', '699', TRUE),
                ('10000000-0000-0000-0000-000000000008', 'DDC', '700', 'Arts & Recreation', 'Arts & recreation', '700', '799', TRUE),
                ('10000000-0000-0000-0000-000000000009', 'DDC', '800', 'Literature', 'Literature', '800', '899', TRUE),
                ('10000000-0000-0000-0000-000000000010', 'DDC', '900', 'History & Geography', 'History & geography', '900', '999', TRUE)
                ON CONFLICT (id) DO NOTHING
            `);
        }
        
        await client.query('COMMIT');
        console.log('Migration completed successfully!');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration().catch(console.error);