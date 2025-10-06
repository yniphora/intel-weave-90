-- Add 'tox' and 'session' to social_platform enum
ALTER TYPE social_platform ADD VALUE IF NOT EXISTS 'tox';
ALTER TYPE social_platform ADD VALUE IF NOT EXISTS 'session';