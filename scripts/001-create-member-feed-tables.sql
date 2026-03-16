-- Member Feed Tables for Community Feature
-- Run this script to create the necessary tables for posts, comments, attachments, and reports

-- 1. Posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  photo_url TEXT,
  document_url TEXT,
  document_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Reports table (for posts and comments)
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  -- Ensure either post_id or comment_id is set, but not both
  CONSTRAINT report_target CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR 
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

-- 4. Community Guidelines table (single row for admin-editable content)
CREATE TABLE IF NOT EXISTS community_guidelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL DEFAULT 'Be respectful to other members, avoid spam, and keep discussions constructive. Violations may result in content removal or account suspension.',
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insert default guidelines if not exists
INSERT INTO community_guidelines (content) 
SELECT 'Be respectful to other members, avoid spam, and keep discussions constructive. Violations may result in content removal or account suspension.'
WHERE NOT EXISTS (SELECT 1 FROM community_guidelines);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_post ON reports(post_id);
CREATE INDEX IF NOT EXISTS idx_reports_comment ON reports(comment_id);
