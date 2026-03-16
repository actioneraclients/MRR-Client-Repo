-- Add event_id column to comments table to link posts to events
-- This allows automatic creation of group feed posts when events are created/updated

ALTER TABLE comments 
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES group_events(id) ON DELETE SET NULL;

-- Create index for faster lookups of posts linked to events
CREATE INDEX IF NOT EXISTS idx_comments_event_id ON comments(event_id);
