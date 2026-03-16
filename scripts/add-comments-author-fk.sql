-- Add foreign key relationship from comments.author_id to profiles.id
-- This enables Supabase to resolve the profiles join in queries

ALTER TABLE comments
ADD CONSTRAINT comments_author_id_fkey
FOREIGN KEY (author_id)
REFERENCES profiles(id)
ON DELETE CASCADE;
