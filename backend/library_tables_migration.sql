-- Library Management System - Complete Table Migration
-- This script creates all required tables for the library management system

BEGIN;

-- Ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

---------------------------------------------------
-- 1. CLASSIFICATION TABLE (Check if exists)
---------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = '${schema}' AND table_name = 'classification') THEN
        CREATE TABLE ${schema}.classification (
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
        );
    END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_classification_type ON ${schema}.classification(classification_type);
CREATE INDEX IF NOT EXISTS idx_classification_code ON ${schema}.classification(code);
CREATE INDEX IF NOT EXISTS idx_classification_branch ON ${schema}.classification(branch_id);

---------------------------------------------------
-- 2. BOOKS TABLE (enhanced with classification reference)
---------------------------------------------------
-- Add classification_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = '${schema}' AND table_name = 'books' AND column_name = 'classification_id'
    ) THEN
        ALTER TABLE ${schema}.books ADD COLUMN classification_id UUID;
    END IF;
END $$;

-- Add foreign key constraint for classification
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_books_classification'
    ) THEN
        ALTER TABLE ${schema}.books
        ADD CONSTRAINT fk_books_classification
        FOREIGN KEY (classification_id)
        REFERENCES ${schema}.classification(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_books_classification ON ${schema}.books(classification_id);
CREATE INDEX IF NOT EXISTS idx_books_title ON ${schema}.books(title);
CREATE INDEX IF NOT EXISTS idx_books_isbn ON ${schema}.books(isbn);

---------------------------------------------------
-- 3. RACK_MAPPING (SHELF) TABLE (Check if exists)
---------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = '${schema}' AND table_name = 'rack_mapping') THEN
        CREATE TABLE ${schema}.rack_mapping (
            id UUID NOT NULL DEFAULT uuid_generate_v4(),
            branch_id UUID,
            name VARCHAR(100),
            floor VARCHAR(50),
            rack VARCHAR(50),
            shelf VARCHAR(50) NOT NULL,
            classification_type VARCHAR(10),
            classification_from VARCHAR(10),
            classification_to VARCHAR(10),
            capacity INTEGER DEFAULT 100,
            full_location_code VARCHAR(255) GENERATED ALWAYS AS (
                COALESCE(floor, '') || '-' || COALESCE(rack, '') || '-' || shelf
            ) STORED,
            createddate TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            lastmodifieddate TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            createdbyid UUID,
            lastmodifiedbyid UUID,
            is_active BOOLEAN DEFAULT TRUE,
            CONSTRAINT rack_mapping_pkey PRIMARY KEY (id),
            CONSTRAINT rack_mapping_branch_id_fkey FOREIGN KEY (branch_id)
                REFERENCES ${schema}.branches (id)
                ON DELETE NO ACTION
                ON UPDATE NO ACTION
        );
    END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_rack_mapping_branch ON ${schema}.rack_mapping(branch_id);
CREATE INDEX IF NOT EXISTS idx_rack_mapping_classification ON ${schema}.rack_mapping(classification_type, classification_from, classification_to);
CREATE INDEX IF NOT EXISTS idx_rack_mapping_floor ON ${schema}.rack_mapping(floor);
CREATE INDEX IF NOT EXISTS idx_rack_mapping_rack ON ${schema}.rack_mapping(rack);

---------------------------------------------------
-- 4. ITEMS TABLE (enhanced with rack mapping reference)
---------------------------------------------------
-- Add rack_mapping_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = '${schema}' AND table_name = 'items' AND column_name = 'rack_mapping_id'
    ) THEN
        ALTER TABLE ${schema}.items ADD COLUMN rack_mapping_id UUID;
    END IF;
END $$;

-- Add foreign key constraint for rack mapping
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_items_rack_mapping'
    ) THEN
        ALTER TABLE ${schema}.items
        ADD CONSTRAINT fk_items_rack_mapping
        FOREIGN KEY (rack_mapping_id)
        REFERENCES ${schema}.rack_mapping(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_items_rack_mapping ON ${schema}.items(rack_mapping_id);
CREATE INDEX IF NOT EXISTS idx_items_barcode ON ${schema}.items(barcode);
CREATE INDEX IF NOT EXISTS idx_items_callnumber ON ${schema}.items(itemcallnumber);
CREATE INDEX IF NOT EXISTS idx_items_status ON ${schema}.items(status);

---------------------------------------------------
-- 5. Insert Sample Classification Data (Optional)
---------------------------------------------------
-- DDC (Dewey Decimal Classification) Sample Data
INSERT INTO ${schema}.classification (
    id, classification_type, code, category, name, classification_from, classification_to, is_active, branch_id
) VALUES
-- General Works (000-099)
('10000000-0000-0000-0000-000000000001', 'DDC', '000', 'Generalities', 'Computer science, information & general works', '000', '099', TRUE, NULL),
('10000000-0000-0000-0000-000000000002', 'DDC', '100', 'Philosophy & Psychology', 'Philosophy & psychology', '100', '199', TRUE, NULL),
('10000000-0000-0000-0000-000000000003', 'DDC', '200', 'Religion', 'Religion', '200', '299', TRUE, NULL),
('10000000-0000-0000-0000-000000000004', 'DDC', '300', 'Social Sciences', 'Social sciences', '300', '399', TRUE, NULL),
('10000000-0000-0000-0000-000000000005', 'DDC', '400', 'Language', 'Language', '400', '499', TRUE, NULL),
('10000000-0000-0000-0000-000000000006', 'DDC', '500', 'Science', 'Pure Science', '500', '599', TRUE, NULL),
('10000000-0000-0000-0000-000000000007', 'DDC', '600', 'Technology', 'Technology', '600', '699', TRUE, NULL),
('10000000-0000-0000-0000-000000000008', 'DDC', '700', 'Arts & Recreation', 'Arts & recreation', '700', '799', TRUE, NULL),
('10000000-0000-0000-0000-000000000009', 'DDC', '800', 'Literature', 'Literature', '800', '899', TRUE, NULL),
('10000000-0000-0000-0000-000000000010', 'DDC', '900', 'History & Geography', 'History & geography', '900', '999', TRUE, NULL)

ON CONFLICT (id) DO NOTHING;

---------------------------------------------------
-- 6. Insert Sample Rack Mapping Data (Optional)
---------------------------------------------------
INSERT INTO ${schema}.rack_mapping (
    id, branch_id, name, floor, rack, shelf, classification_type, classification_from, classification_to, capacity, is_active
) VALUES
-- DDC Racks for Main Branch
('20000000-0000-0000-0000-000000000001', 'eb35a3ca-fa8a-4702-859d-e409b314a039', 'General Works', 'Ground Floor', 'Rack A', 'Shelf 1', 'DDC', '000', '099', 100, TRUE),
('20000000-0000-0000-0000-000000000002', 'eb35a3ca-fa8a-4702-859d-e409b314a039', 'Philosophy', 'Ground Floor', 'Rack A', 'Shelf 2', 'DDC', '100', '199', 100, TRUE),
('20000000-0000-0000-0000-000000000003', 'eb35a3ca-fa8a-4702-859d-e409b314a039', 'Religion', 'Ground Floor', 'Rack B', 'Shelf 1', 'DDC', '200', '299', 100, TRUE),
('20000000-0000-0000-0000-000000000004', 'eb35a3ca-fa8a-4702-859d-e409b314a039', 'Social Sciences', 'First Floor', 'Rack C', 'Shelf 1', 'DDC', '300', '399', 100, TRUE),
('20000000-0000-0000-0000-000000000005', 'eb35a3ca-fa8a-4702-859d-e409b314a039', 'Language', 'First Floor', 'Rack C', 'Shelf 2', 'DDC', '400', '499', 100, TRUE),
('20000000-0000-0000-0000-000000000006', 'eb35a3ca-fa8a-4702-859d-e409b314a039', 'Science', 'Second Floor', 'Rack D', 'Shelf 1', 'DDC', '500', '599', 100, TRUE),
('20000000-0000-0000-0000-000000000007', 'eb35a3ca-fa8a-4702-859d-e409b314a039', 'Technology', 'Second Floor', 'Rack D', 'Shelf 2', 'DDC', '600', '699', 100, TRUE),
('20000000-0000-0000-0000-000000000008', 'eb35a3ca-fa8a-4702-859d-e409b314a039', 'Arts', 'Third Floor', 'Rack E', 'Shelf 1', 'DDC', '700', '799', 100, TRUE),
('20000000-0000-0000-0000-000000000009', 'eb35a3ca-fa8a-4702-859d-e409b314a039', 'Literature', 'Third Floor', 'Rack E', 'Shelf 2', 'DDC', '800', '899', 100, TRUE),
('20000000-0000-0000-0000-000000000010', 'eb35a3ca-fa8a-4702-859d-e409b314a039', 'History', 'Fourth Floor', 'Rack F', 'Shelf 1', 'DDC', '900', '999', 100, TRUE)

ON CONFLICT (id) DO NOTHING;

---------------------------------------------------
-- 7. Update existing items to reference rack_mapping
---------------------------------------------------
-- This will need to be done based on your existing data
-- Example: UPDATE ${schema}.items SET rack_mapping_id = 'some-rack-id' WHERE book_id = 'some-book-id';

COMMIT;