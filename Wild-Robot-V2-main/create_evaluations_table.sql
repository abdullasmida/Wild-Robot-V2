-- Create the evaluations table
CREATE TABLE IF NOT EXISTS public.evaluations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id TEXT, -- Changed to TEXT to match existing player IDs which might not be UUIDs
    coach_id UUID, -- Optional
    session_date DATE DEFAULT CURRENT_DATE,
    
    -- Numeric Data
    total_stars NUMERIC,
    max_stars NUMERIC,
    percentage NUMERIC,
    level_status TEXT, -- Bronze, Silver, etc.
    
    -- JSON Data
    skills_snapshot JSONB, 
    
    -- Notes
    auto_notes TEXT, -- Robot generated note
    coach_notes TEXT, -- Manual/Edited note
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

-- Create Policy (Allow all for now as requested)
CREATE POLICY "Enable read/write for all" ON "public.evaluations" USING (true) WITH CHECK (true);
