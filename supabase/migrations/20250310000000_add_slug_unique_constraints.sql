-- Add unique constraint on sales_pages.slug and opt_in_pages.slug (safety net for slug validation)
-- Run in Supabase SQL Editor. If a constraint already exists, you may need to adjust or skip.

-- sales_pages: ensure slug is unique
DO $$
BEGIN
  ALTER TABLE sales_pages ADD CONSTRAINT sales_pages_slug_unique UNIQUE (slug);
EXCEPTION
  WHEN duplicate_object THEN NULL; -- constraint already exists
END $$;

-- opt_in_pages: ensure slug is unique
DO $$
BEGIN
  ALTER TABLE opt_in_pages ADD CONSTRAINT opt_in_pages_slug_unique UNIQUE (slug);
EXCEPTION
  WHEN duplicate_object THEN NULL; -- constraint already exists
END $$;
