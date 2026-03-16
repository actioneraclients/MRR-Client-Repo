-- Saved Items table for lesson resources (video, audio, image, download)
-- Run this script to create the saved_items table for the Saved Resources feature

CREATE TABLE IF NOT EXISTS saved_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL,
  lesson_id UUID NOT NULL,
  block_id TEXT NOT NULL,
  block_type TEXT NOT NULL,
  title TEXT,
  resource_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_items_user ON saved_items(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_items_lesson ON saved_items(lesson_id);

-- Enable Row Level Security
ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see and manage their own saved items
CREATE POLICY "Users can view own saved items" ON saved_items
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own saved items" ON saved_items
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own saved items" ON saved_items
  FOR DELETE USING (user_id = auth.uid());
