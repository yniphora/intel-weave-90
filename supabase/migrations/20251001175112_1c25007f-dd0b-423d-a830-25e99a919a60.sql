-- Create enum for entity types
CREATE TYPE entity_type AS ENUM ('person', 'group', 'organization', 'other');

-- Create enum for social platforms
CREATE TYPE social_platform AS ENUM (
  'telegram', 'discord', 'twitter', 'instagram', 'facebook', 
  'linkedin', 'github', 'reddit', 'tiktok', 'youtube', 
  'whatsapp', 'signal', 'snapchat', 'twitch', 'steam', 'other'
);

-- Create entities table
CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type entity_type NOT NULL DEFAULT 'person',
  avatar_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create social accounts table
CREATE TABLE social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  platform social_platform NOT NULL,
  username TEXT,
  user_id_platform TEXT,
  display_name TEXT,
  profile_url TEXT,
  avatar_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create relationships table
CREATE TABLE relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_a_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  entity_b_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT different_entities CHECK (entity_a_id != entity_b_id)
);

-- Create tags table
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#7C3AED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Create entity_tags junction table
CREATE TABLE entity_tags (
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (entity_id, tag_id)
);

-- Enable Row Level Security
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for entities
CREATE POLICY "Users can view their own entities"
  ON entities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own entities"
  ON entities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entities"
  ON entities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entities"
  ON entities FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for social_accounts
CREATE POLICY "Users can view social accounts of their entities"
  ON social_accounts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM entities WHERE entities.id = social_accounts.entity_id AND entities.user_id = auth.uid()
  ));

CREATE POLICY "Users can create social accounts for their entities"
  ON social_accounts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM entities WHERE entities.id = social_accounts.entity_id AND entities.user_id = auth.uid()
  ));

CREATE POLICY "Users can update social accounts of their entities"
  ON social_accounts FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM entities WHERE entities.id = social_accounts.entity_id AND entities.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete social accounts of their entities"
  ON social_accounts FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM entities WHERE entities.id = social_accounts.entity_id AND entities.user_id = auth.uid()
  ));

-- RLS Policies for relationships
CREATE POLICY "Users can view their own relationships"
  ON relationships FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own relationships"
  ON relationships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own relationships"
  ON relationships FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own relationships"
  ON relationships FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for tags
CREATE POLICY "Users can view their own tags"
  ON tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tags"
  ON tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags"
  ON tags FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
  ON tags FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for entity_tags
CREATE POLICY "Users can view entity tags of their entities"
  ON entity_tags FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM entities WHERE entities.id = entity_tags.entity_id AND entities.user_id = auth.uid()
  ));

CREATE POLICY "Users can create entity tags for their entities"
  ON entity_tags FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM entities WHERE entities.id = entity_tags.entity_id AND entities.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete entity tags of their entities"
  ON entity_tags FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM entities WHERE entities.id = entity_tags.entity_id AND entities.user_id = auth.uid()
  ));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_entities_updated_at
  BEFORE UPDATE ON entities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_accounts_updated_at
  BEFORE UPDATE ON social_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_relationships_updated_at
  BEFORE UPDATE ON relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_entities_user_id ON entities(user_id);
CREATE INDEX idx_entities_type ON entities(type);
CREATE INDEX idx_social_accounts_entity_id ON social_accounts(entity_id);
CREATE INDEX idx_social_accounts_platform ON social_accounts(platform);
CREATE INDEX idx_relationships_user_id ON relationships(user_id);
CREATE INDEX idx_relationships_entity_a ON relationships(entity_a_id);
CREATE INDEX idx_relationships_entity_b ON relationships(entity_b_id);
CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_entity_tags_entity_id ON entity_tags(entity_id);
CREATE INDEX idx_entity_tags_tag_id ON entity_tags(tag_id);