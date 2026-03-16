-- Create site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name TEXT DEFAULT 'My Site',
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  accent_color TEXT DEFAULT '#10B981',
  nav_visibility JSONB DEFAULT '{"dashboard": true, "education": true, "community": true, "inbox": true, "tools": true, "support": true, "profile": true}'::jsonb,
  meta_title TEXT,
  meta_description TEXT,
  favicon_url TEXT,
  og_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a single row for site settings (singleton pattern)
INSERT INTO site_settings (id)
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Only creators can read settings
CREATE POLICY "Creators can read site settings"
  ON site_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_creator = true
    )
  );

-- Policy: Only creators can update settings
CREATE POLICY "Creators can update site settings"
  ON site_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_creator = true
    )
  );
