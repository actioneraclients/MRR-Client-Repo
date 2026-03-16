-- Add community_guidelines column to site_settings table
ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS community_guidelines TEXT DEFAULT '1. Be respectful and courteous to all community members.

2. No spam, self-promotion, or irrelevant links.

3. Keep discussions on-topic and constructive.

4. No harassment, hate speech, or personal attacks.

5. Respect the privacy of others—do not share personal information.

6. Report inappropriate content using the report button.

7. Follow the specific rules of each group, course, or tool section.

Violations may result in comment removal or account suspension.';
