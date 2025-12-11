-- 1. Add Missing Column
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS max_stars NUMERIC;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS total_stars NUMERIC; -- Ensuring this exists too

-- 2. Fix Permissions (Disable RLS for public access)
ALTER TABLE evaluations DISABLE ROW LEVEL SECURITY;

-- 3. Ensure other columns exist (Idempotent checks)
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS skill_details JSONB;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS auto_note TEXT;
ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS percentage NUMERIC;

-- 4. Verify columns (Optional comment to confirm)
COMMENT ON COLUMN evaluations.max_stars IS 'Maximum possible stars for the evaluation';
COMMENT ON COLUMN evaluations.total_stars IS 'Total stars achieved';
