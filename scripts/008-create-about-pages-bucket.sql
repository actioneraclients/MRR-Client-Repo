-- Create the about-pages storage bucket for About Page Builder image uploads.
-- Run in Supabase Dashboard > SQL Editor.
-- If bucket already exists, this will fail harmlessly (use ON CONFLICT if supported).
INSERT INTO storage.buckets (id, name, public)
VALUES ('about-pages', 'about-pages', true)
ON CONFLICT (id) DO NOTHING;
