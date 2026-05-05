-- Add type column to owner_leads for classification
ALTER TABLE owner_leads 
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'INSTITUTE' CHECK (type IN ('INSTITUTE', 'PERSONAL_TEACHER'));

-- Update existing leads to default classification if needed
UPDATE owner_leads SET type = 'INSTITUTE' WHERE type IS NULL;
