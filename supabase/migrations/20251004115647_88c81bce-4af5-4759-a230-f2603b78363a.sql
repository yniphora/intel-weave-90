-- Add 'website' to entity_type enum
ALTER TYPE entity_type ADD VALUE IF NOT EXISTS 'website';

-- Add website-specific fields to entities table
ALTER TABLE public.entities 
ADD COLUMN IF NOT EXISTS ips text,
ADD COLUMN IF NOT EXISTS domains text,
ADD COLUMN IF NOT EXISTS hosting_info text,
ADD COLUMN IF NOT EXISTS web_archive_url text;