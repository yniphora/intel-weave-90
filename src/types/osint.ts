export type EntityType = "person" | "group" | "organization" | "website" | "other";
export type SocialPlatform = 
  | "telegram" 
  | "discord" 
  | "twitter" 
  | "instagram" 
  | "facebook"
  | "linkedin" 
  | "github" 
  | "reddit" 
  | "tiktok" 
  | "youtube"
  | "whatsapp" 
  | "signal" 
  | "snapchat" 
  | "twitch" 
  | "steam" 
  | "other";

export interface Entity {
  id: string;
  user_id: string;
  name: string;
  type: EntityType;
  avatar_url: string | null;
  notes: string | null;
  ips: string | null;
  domains: string | null;
  hosting_info: string | null;
  web_archive_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialAccount {
  id: string;
  entity_id: string;
  platform: SocialPlatform;
  username: string | null;
  user_id_platform: string | null;
  display_name: string | null;
  profile_url: string | null;
  avatar_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Relationship {
  id: string;
  user_id: string;
  entity_a_id: string;
  entity_b_id: string;
  relationship_type: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}
