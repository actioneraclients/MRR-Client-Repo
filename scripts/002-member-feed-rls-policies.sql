-- Row Level Security Policies for Member Feed
-- Run this after creating the tables

-- Enable RLS on all tables
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_guidelines ENABLE ROW LEVEL SECURITY;

-- Posts policies
-- Everyone can read posts
CREATE POLICY "Posts are viewable by everyone" ON posts
  FOR SELECT USING (true);

-- Authenticated users can create posts
CREATE POLICY "Authenticated users can create posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Users can update their own posts
CREATE POLICY "Users can update their own posts" ON posts
  FOR UPDATE USING (auth.uid() = author_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete their own posts" ON posts
  FOR DELETE USING (auth.uid() = author_id);

-- Comments policies
-- Everyone can read comments
CREATE POLICY "Comments are viewable by everyone" ON comments
  FOR SELECT USING (true);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments" ON comments
  FOR UPDATE USING (auth.uid() = author_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments" ON comments
  FOR DELETE USING (auth.uid() = author_id);

-- Reports policies
-- Users can create reports
CREATE POLICY "Authenticated users can create reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own reports
CREATE POLICY "Users can view their own reports" ON reports
  FOR SELECT USING (auth.uid() = reporter_id);

-- Community Guidelines policies
-- Everyone can read guidelines
CREATE POLICY "Guidelines are viewable by everyone" ON community_guidelines
  FOR SELECT USING (true);
