BEGIN;

CREATE TABLE IF NOT EXISTS al_hedaya.branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_code VARCHAR(20) UNIQUE NOT NULL,
    branch_name VARCHAR(150) NOT NULL,
    address_line1 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    pincode VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    createddate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastmodifieddate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    createdbyid UUID,
    lastmodifiedbyid UUID
);

---------------------------------------------------
-- 2️⃣ Insert Default Main Branch (fixed UUID)
---------------------------------------------------

INSERT INTO al_hedaya.branches (
    id,
    branch_code,
    branch_name,
    address_line1,
    city,
    state,
    country,
    pincode,
    is_active
)
VALUES (
    'eb35a3ca-fa8a-4702-859d-e409b314a039',
    'MAIN',
    'Main Branch',
    '12 Ajmer',
    'Ajmer',
    'Rajasthan',
    'India',
    '341000',
    TRUE
)
ON CONFLICT (branch_code) DO NOTHING;

---------------------------------------------------
-- BOOKS
---------------------------------------------------
ALTER TABLE al_hedaya.books ADD COLUMN IF NOT EXISTS branch_id UUID;

UPDATE al_hedaya.books
SET branch_id = 'eb35a3ca-fa8a-4702-859d-e409b314a039'
WHERE branch_id IS NULL;

ALTER TABLE al_hedaya.books ALTER COLUMN branch_id SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_books_branch'
    ) THEN
        ALTER TABLE al_hedaya.books
        ADD CONSTRAINT fk_books_branch
        FOREIGN KEY (branch_id)
        REFERENCES al_hedaya.branches(id)
        ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_books_branch
ON al_hedaya.books(branch_id);

---------------------------------------------------
-- SAME STRUCTURE FOR OTHER TABLES
---------------------------------------------------

-- book_issues
ALTER TABLE al_hedaya.book_issues ADD COLUMN IF NOT EXISTS branch_id UUID;
UPDATE al_hedaya.book_issues SET branch_id = 'eb35a3ca-fa8a-4702-859d-e409b314a039' WHERE branch_id IS NULL;
ALTER TABLE al_hedaya.book_issues ALTER COLUMN branch_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_book_issues_branch ON al_hedaya.book_issues(branch_id);

-- book_submissions
ALTER TABLE al_hedaya.book_submissions ADD COLUMN IF NOT EXISTS branch_id UUID;
UPDATE al_hedaya.book_submissions SET branch_id = 'eb35a3ca-fa8a-4702-859d-e409b314a039' WHERE branch_id IS NULL;
ALTER TABLE al_hedaya.book_submissions ALTER COLUMN branch_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_book_submissions_branch ON al_hedaya.book_submissions(branch_id);

-- library_members
ALTER TABLE al_hedaya.library_members ADD COLUMN IF NOT EXISTS branch_id UUID;
UPDATE al_hedaya.library_members SET branch_id = 'eb35a3ca-fa8a-4702-859d-e409b314a039' WHERE branch_id IS NULL;
ALTER TABLE al_hedaya.library_members ALTER COLUMN branch_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_library_members_branch ON al_hedaya.library_members(branch_id);

-- subscriptions
ALTER TABLE al_hedaya.subscriptions ADD COLUMN IF NOT EXISTS branch_id UUID;
UPDATE al_hedaya.subscriptions SET branch_id = 'eb35a3ca-fa8a-4702-859d-e409b314a039' WHERE branch_id IS NULL;
ALTER TABLE al_hedaya.subscriptions ALTER COLUMN branch_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_branch ON al_hedaya.subscriptions(branch_id);

-- purchases
ALTER TABLE al_hedaya.purchases ADD COLUMN IF NOT EXISTS branch_id UUID;
UPDATE al_hedaya.purchases SET branch_id = 'eb35a3ca-fa8a-4702-859d-e409b314a039' WHERE branch_id IS NULL;
ALTER TABLE al_hedaya.purchases ALTER COLUMN branch_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_purchases_branch ON al_hedaya.purchases(branch_id);

-- penalty_master
ALTER TABLE al_hedaya.penalty_master ADD COLUMN IF NOT EXISTS branch_id UUID;
UPDATE al_hedaya.penalty_master SET branch_id = 'eb35a3ca-fa8a-4702-859d-e409b314a039' WHERE branch_id IS NULL;
ALTER TABLE al_hedaya.penalty_master ALTER COLUMN branch_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_penalty_master_branch ON al_hedaya.penalty_master(branch_id);

-- shelf
--ALTER TABLE al_hedaya.shelf ADD COLUMN IF NOT EXISTS branch_id UUID;
--UPDATE al_hedaya.shelf SET branch_id = 'eb35a3ca-fa8a-4702-859d-e409b314a039' WHERE branch_id IS NULL;
--ALTER TABLE al_hedaya.shelf ALTER COLUMN branch_id SET NOT NULL;
--CREATE INDEX IF NOT EXISTS idx_shelf_branch ON al_hedaya.shelf(branch_id);

-- vendors
ALTER TABLE al_hedaya.vendors ADD COLUMN IF NOT EXISTS branch_id UUID;
UPDATE al_hedaya.vendors SET branch_id = 'eb35a3ca-fa8a-4702-859d-e409b314a039' WHERE branch_id IS NULL;
ALTER TABLE al_hedaya.vendors ALTER COLUMN branch_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vendors_branch ON al_hedaya.vendors(branch_id);

-- notifications
ALTER TABLE al_hedaya.notifications ADD COLUMN IF NOT EXISTS branch_id UUID;
UPDATE al_hedaya.notifications SET branch_id = 'eb35a3ca-fa8a-4702-859d-e409b314a039' WHERE branch_id IS NULL;
ALTER TABLE al_hedaya.notifications ALTER COLUMN branch_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_branch ON al_hedaya.notifications(branch_id);

COMMIT;
