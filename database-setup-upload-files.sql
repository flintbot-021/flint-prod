-- =======================================================================================
-- UPLOAD FILES DATABASE SETUP
-- =======================================================================================
-- This SQL creates the necessary database structure for tracking uploaded files
-- in the Flint Lead Magnet system.

-- 1. Create uploaded_files table to track all file uploads
-- =======================================================================================

CREATE TABLE IF NOT EXISTS uploaded_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- File identification
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_extension VARCHAR(10),
    
    -- Storage information
    storage_path TEXT NOT NULL UNIQUE,
    storage_bucket VARCHAR(100) NOT NULL DEFAULT 'campaign-uploads',
    public_url TEXT,
    
    -- Campaign and lead relationship
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    
    -- Response relationship (links to lead_responses table)
    response_id UUID REFERENCES lead_responses(id) ON DELETE CASCADE,
    
    -- Upload metadata
    upload_status VARCHAR(20) NOT NULL DEFAULT 'uploaded' CHECK (upload_status IN ('uploading', 'uploaded', 'processing', 'failed', 'deleted')),
    upload_progress INTEGER DEFAULT 100 CHECK (upload_progress >= 0 AND upload_progress <= 100),
    
    -- File validation
    is_valid BOOLEAN DEFAULT true,
    validation_errors JSONB DEFAULT '[]'::jsonb,
    
    -- Security and scanning
    virus_scan_status VARCHAR(20) DEFAULT 'pending' CHECK (virus_scan_status IN ('pending', 'clean', 'infected', 'error')),
    virus_scan_date TIMESTAMP WITH TIME ZONE,
    
    -- File processing metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Soft delete
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 2. Create indexes for performance
-- =======================================================================================

-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_uploaded_files_campaign_id ON uploaded_files(campaign_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_lead_id ON uploaded_files(lead_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_section_id ON uploaded_files(section_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_response_id ON uploaded_files(response_id);

-- Status and validation indexes
CREATE INDEX IF NOT EXISTS idx_uploaded_files_upload_status ON uploaded_files(upload_status);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_virus_scan_status ON uploaded_files(virus_scan_status);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_is_valid ON uploaded_files(is_valid);

-- Storage path index for file management
CREATE INDEX IF NOT EXISTS idx_uploaded_files_storage_path ON uploaded_files(storage_path);

-- Timestamp indexes for cleanup and analytics
CREATE INDEX IF NOT EXISTS idx_uploaded_files_created_at ON uploaded_files(created_at);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_deleted_at ON uploaded_files(deleted_at);

-- Composite index for active files by campaign
CREATE INDEX IF NOT EXISTS idx_uploaded_files_active_by_campaign 
ON uploaded_files(campaign_id, upload_status) 
WHERE deleted_at IS NULL;

-- 3. Create storage bucket policies (if not already exists)
-- =======================================================================================

-- Enable RLS on uploaded_files table
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access files from their own campaigns
CREATE POLICY "Users can view their own campaign files" ON uploaded_files
    FOR SELECT USING (
        campaign_id IN (
            SELECT id FROM campaigns 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can insert files to their own campaigns
CREATE POLICY "Users can upload to their own campaigns" ON uploaded_files
    FOR INSERT WITH CHECK (
        campaign_id IN (
            SELECT id FROM campaigns 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can update their own campaign files
CREATE POLICY "Users can update their own campaign files" ON uploaded_files
    FOR UPDATE USING (
        campaign_id IN (
            SELECT id FROM campaigns 
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can delete their own campaign files
CREATE POLICY "Users can delete their own campaign files" ON uploaded_files
    FOR DELETE USING (
        campaign_id IN (
            SELECT id FROM campaigns 
            WHERE user_id = auth.uid()
        )
    );

-- 4. Create functions for file management
-- =======================================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_uploaded_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_uploaded_files_updated_at
    BEFORE UPDATE ON uploaded_files
    FOR EACH ROW
    EXECUTE FUNCTION update_uploaded_files_updated_at();

-- Function to soft delete files
CREATE OR REPLACE FUNCTION soft_delete_uploaded_file(file_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE uploaded_files 
    SET deleted_at = NOW(), 
        upload_status = 'deleted',
        updated_at = NOW()
    WHERE id = file_id 
    AND deleted_at IS NULL;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get file statistics for a campaign
CREATE OR REPLACE FUNCTION get_campaign_file_stats(p_campaign_id UUID)
RETURNS TABLE (
    total_files BIGINT,
    total_size BIGINT,
    files_by_type JSONB,
    upload_status_count JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_files,
        COALESCE(SUM(file_size), 0) as total_size,
        COALESCE(
            jsonb_object_agg(file_type, type_count), 
            '{}'::jsonb
        ) as files_by_type,
        COALESCE(
            jsonb_object_agg(upload_status, status_count), 
            '{}'::jsonb
        ) as upload_status_count
    FROM (
        SELECT 
            file_type,
            upload_status,
            COUNT(*) as type_count,
            COUNT(*) as status_count
        FROM uploaded_files 
        WHERE campaign_id = p_campaign_id 
        AND deleted_at IS NULL
        GROUP BY file_type, upload_status
    ) stats;
END;
$$ LANGUAGE plpgsql;

-- 5. Storage bucket setup (run this in Supabase dashboard or via client)
-- =======================================================================================

/*
-- Create storage bucket if it doesn't exist (this is handled in the storage.ts file)
-- But you can also run this in Supabase SQL editor:

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'campaign-uploads',
    'campaign-uploads',
    true,
    104857600, -- 100MB in bytes
    ARRAY[
        'image/jpeg',
        'image/png', 
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/csv',
        'audio/mpeg',
        'audio/wav',
        'audio/mp4',
        'video/mp4',
        'video/avi',
        'video/mov'
    ]
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for the bucket
CREATE POLICY "Authenticated users can upload files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'campaign-uploads' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can view files from their campaigns" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'campaign-uploads'
        AND (
            auth.role() = 'authenticated'
            -- Additional logic could be added here to check campaign ownership
            -- based on the file path structure: campaigns/{campaign_id}/...
        )
    );

CREATE POLICY "Users can delete files from their campaigns" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'campaign-uploads'
        AND auth.role() = 'authenticated'
        -- Additional logic could be added here to check campaign ownership
    );
*/

-- 6. Sample queries for working with uploaded files
-- =======================================================================================

/*
-- Get all files for a specific campaign
SELECT 
    uf.*,
    c.title as campaign_title,
    l.email as lead_email,
    s.title as section_title
FROM uploaded_files uf
JOIN campaigns c ON uf.campaign_id = c.id
LEFT JOIN leads l ON uf.lead_id = l.id
LEFT JOIN sections s ON uf.section_id = s.id
WHERE uf.campaign_id = 'your-campaign-id'
AND uf.deleted_at IS NULL
ORDER BY uf.created_at DESC;

-- Get file statistics for a campaign
SELECT * FROM get_campaign_file_stats('your-campaign-id');

-- Find large files (over 10MB)
SELECT file_name, file_size, public_url, created_at
FROM uploaded_files
WHERE file_size > 10485760  -- 10MB in bytes
AND deleted_at IS NULL
ORDER BY file_size DESC;

-- Find files that need virus scanning
SELECT id, file_name, storage_path, created_at
FROM uploaded_files
WHERE virus_scan_status = 'pending'
AND deleted_at IS NULL
ORDER BY created_at ASC;

-- Clean up old deleted files (older than 30 days)
DELETE FROM uploaded_files 
WHERE deleted_at IS NOT NULL 
AND deleted_at < NOW() - INTERVAL '30 days';
*/ 