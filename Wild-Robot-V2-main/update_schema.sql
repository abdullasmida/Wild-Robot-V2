-- Add session_slot column to players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS session_slot TEXT DEFAULT '5-6 PM';
