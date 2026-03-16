-- Add brand_background_color column to site_settings table
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS brand_background_color text DEFAULT '#FFFFFF';

-- Update the existing row with default value
UPDATE site_settings
SET brand_background_color = '#FFFFFF'
WHERE brand_background_color IS NULL;
