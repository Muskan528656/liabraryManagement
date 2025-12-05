-- Migration: Add phone_number column to company table
-- Date: 2025-11-28
-- Description: Adds phone_number field to support phone number + country code combination feature

-- Add phone_number column to public.company table
ALTER TABLE public.company
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- Add comment to the column
COMMENT ON COLUMN public.company.phone_number IS 'Phone number without country code prefix (e.g., 9876543210)';

-- Verify the column was added
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'company' AND column_name = 'phone_number';
