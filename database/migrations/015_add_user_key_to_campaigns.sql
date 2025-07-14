-- Migration: Add user_key to campaigns table
-- Description: Add user_key field to enable user-specific published URLs
-- This allows multiple users to have campaigns with the same slug
-- URL structure changes from /c/slug to /c/userkey/slug
-- Author: AI Assistant

-- Add user_key column to campaigns table
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS user_key VARCHAR(10) UNIQUE;

-- Create index for performance on user_key lookups
CREATE INDEX IF NOT EXISTS idx_campaigns_user_key ON campaigns (user_key);

-- Create a function to generate random user keys
CREATE OR REPLACE FUNCTION generate_user_key() RETURNS VARCHAR(10) AS $$
DECLARE
    chars VARCHAR(36) := 'abcdefghijklmnopqrstuvwxyz0123456789';
    result VARCHAR(10) := '';
    i INTEGER;
    char_pos INTEGER;
BEGIN
    FOR i IN 1..6 LOOP
        char_pos := floor(random() * length(chars) + 1);
        result := result || substr(chars, char_pos, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to ensure unique user key generation
CREATE OR REPLACE FUNCTION ensure_unique_user_key() RETURNS VARCHAR(10) AS $$
DECLARE
    new_key VARCHAR(10);
    key_exists BOOLEAN;
    attempts INTEGER := 0;
    max_attempts INTEGER := 100;
BEGIN
    LOOP
        new_key := generate_user_key();
        
        -- Check if key already exists
        SELECT EXISTS(SELECT 1 FROM campaigns WHERE user_key = new_key) INTO key_exists;
        
        -- If key doesn't exist, we can use it
        IF NOT key_exists THEN
            RETURN new_key;
        END IF;
        
        attempts := attempts + 1;
        IF attempts >= max_attempts THEN
            RAISE EXCEPTION 'Failed to generate unique user key after % attempts', max_attempts;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Generate user keys for existing campaigns
UPDATE campaigns 
SET user_key = ensure_unique_user_key()
WHERE user_key IS NULL;

-- Make user_key NOT NULL after populating existing records
ALTER TABLE campaigns 
ALTER COLUMN user_key SET NOT NULL;

-- Add trigger to auto-generate user_key for new campaigns
CREATE OR REPLACE FUNCTION set_campaign_user_key()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_key IS NULL THEN
        NEW.user_key := ensure_unique_user_key();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_campaign_user_key
    BEFORE INSERT ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION set_campaign_user_key();

-- Update the unique constraint on published_url to be scoped by user_key
-- First drop the existing unique constraint
ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS campaigns_published_url_key;

-- Add new compound unique constraint (user_key + published_url)
ALTER TABLE campaigns 
ADD CONSTRAINT campaigns_user_key_published_url_unique 
UNIQUE (user_key, published_url);

-- Add comment
COMMENT ON COLUMN campaigns.user_key IS 'Unique key per user for URL routing - enables multiple users to have same campaign slugs'; 