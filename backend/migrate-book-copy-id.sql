-- Migration: Add book_copy_id to book_issues table
-- This links a specific book copy to an issue record and enables copy-level status tracking

BEGIN;

-- Add book_copy_id column to book_issues (nullable, so existing records are unaffected)
ALTER TABLE ${schema}.book_issues
    ADD COLUMN IF NOT EXISTS book_copy_id UUID;

-- Add foreign key constraint to book_copy table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_book_issues_book_copy'
          AND table_name = 'book_issues'
    ) THEN
        ALTER TABLE ${schema}.book_issues
        ADD CONSTRAINT fk_book_issues_book_copy
        FOREIGN KEY (book_copy_id)
        REFERENCES ${schema}.book_copy(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_book_issues_book_copy_id
    ON ${schema}.book_issues(book_copy_id);

-- Also ensure book_copy has an 'ISSUED' status option (it may only have AVAILABLE, BORROWED, etc.)
-- Update any copies that are currently linked to active issues but still show AVAILABLE
-- (safe to run even if no rows match)
UPDATE ${schema}.book_copy bc
SET status = 'ISSUED'
WHERE bc.id IN (
    SELECT bi.book_copy_id
    FROM ${schema}.book_issues bi
    WHERE bi.book_copy_id IS NOT NULL
      AND bi.return_date IS NULL
      AND bi.status = 'issued'
)
AND bc.status = 'AVAILABLE';

COMMIT;
