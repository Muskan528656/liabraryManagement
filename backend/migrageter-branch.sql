BEGIN;

CREATE TABLE IF NOT EXISTS demo.branches (
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

INSERT INTO demo.branches (
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
ALTER TABLE demo.books ADD COLUMN IF NOT EXISTS branch_id UUID;

UPDATE demo.books
SET branch_id = 'eb35a3ca-fa8a-4702-859d-e409b314a039'
WHERE branch_id IS NULL;

ALTER TABLE demo.books ALTER COLUMN branch_id SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_books_branch'
    ) THEN
        ALTER TABLE demo.books
        ADD CONSTRAINT fk_books_branch
        FOREIGN KEY (branch_id)
        REFERENCES demo.branches(id)
        ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_books_branch
ON demo.books(branch_id);

---------------------------------------------------
-- SAME STRUCTURE FOR OTHER TABLES
---------------------------------------------------

-- book_issues
ALTER TABLE demo.book_issues ADD COLUMN IF NOT EXISTS branch_id UUID;
UPDATE demo.book_issues SET branch_id = 'eb35a3ca-fa8a-4702-859d-e409b314a039' WHERE branch_id IS NULL;
ALTER TABLE demo.book_issues ALTER COLUMN branch_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_book_issues_branch ON demo.book_issues(branch_id);

-- book_submissions
ALTER TABLE demo.book_submissions ADD COLUMN IF NOT EXISTS branch_id UUID;
UPDATE demo.book_submissions SET branch_id = 'eb35a3ca-fa8a-4702-859d-e409b314a039' WHERE branch_id IS NULL;
ALTER TABLE demo.book_submissions ALTER COLUMN branch_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_book_submissions_branch ON demo.book_submissions(branch_id);

-- library_members
ALTER TABLE demo.library_members ADD COLUMN IF NOT EXISTS branch_id UUID;
UPDATE demo.library_members SET branch_id = 'eb35a3ca-fa8a-4702-859d-e409b314a039' WHERE branch_id IS NULL;
ALTER TABLE demo.library_members ALTER COLUMN branch_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_library_members_branch ON demo.library_members(branch_id);

-- subscriptions
ALTER TABLE demo.subscriptions ADD COLUMN IF NOT EXISTS branch_id UUID;
UPDATE demo.subscriptions SET branch_id = 'eb35a3ca-fa8a-4702-859d-e409b314a039' WHERE branch_id IS NULL;
ALTER TABLE demo.subscriptions ALTER COLUMN branch_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_branch ON demo.subscriptions(branch_id);

-- purchases
ALTER TABLE demo.purchases ADD COLUMN IF NOT EXISTS branch_id UUID;
UPDATE demo.purchases SET branch_id = 'eb35a3ca-fa8a-4702-859d-e409b314a039' WHERE branch_id IS NULL;
ALTER TABLE demo.purchases ALTER COLUMN branch_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_purchases_branch ON demo.purchases(branch_id);

-- penalty_master
ALTER TABLE demo.penalty_master ADD COLUMN IF NOT EXISTS branch_id UUID;
UPDATE demo.penalty_master SET branch_id = 'eb35a3ca-fa8a-4702-859d-e409b314a039' WHERE branch_id IS NULL;
ALTER TABLE demo.penalty_master ALTER COLUMN branch_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_penalty_master_branch ON demo.penalty_master(branch_id);

-- shelf
ALTER TABLE demo.shelf ADD COLUMN IF NOT EXISTS branch_id UUID;
UPDATE demo.shelf SET branch_id = 'eb35a3ca-fa8a-4702-859d-e409b314a039' WHERE branch_id IS NULL;
ALTER TABLE demo.shelf ALTER COLUMN branch_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shelf_branch ON demo.shelf(branch_id);

-- vendors
ALTER TABLE demo.vendors ADD COLUMN IF NOT EXISTS branch_id UUID;
UPDATE demo.vendors SET branch_id = 'eb35a3ca-fa8a-4702-859d-e409b314a039' WHERE branch_id IS NULL;
ALTER TABLE demo.vendors ALTER COLUMN branch_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vendors_branch ON demo.vendors(branch_id);

-- notifications
ALTER TABLE demo.notifications ADD COLUMN IF NOT EXISTS branch_id UUID;
UPDATE demo.notifications SET branch_id = 'eb35a3ca-fa8a-4702-859d-e409b314a039' WHERE branch_id IS NULL;
ALTER TABLE demo.notifications ALTER COLUMN branch_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_branch ON demo.notifications(branch_id);

COMMIT;
