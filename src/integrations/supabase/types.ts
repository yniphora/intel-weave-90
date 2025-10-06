export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      entities: {
        Row: {
          avatar_url: string | null
          created_at: string
          domains: string | null
          hosting_info: string | null
          id: string
          ips: string | null
          name: string
          notes: string | null
          type: Database["public"]["Enums"]["entity_type"]
          updated_at: string
          user_id: string
          web_archive_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          domains?: string | null
          hosting_info?: string | null
          id?: string
          ips?: string | null
          name: string
          notes?: string | null
          type?: Database["public"]["Enums"]["entity_type"]
          updated_at?: string
          user_id: string
          web_archive_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          domains?: string | null
          hosting_info?: string | null
          id?: string
          ips?: string | null
          name?: string
          notes?: string | null
          type?: Database["public"]["Enums"]["entity_type"]
          updated_at?: string
          user_id?: string
          web_archive_url?: string | null
        }
        Relationships: []
      }
      entity_images: {
        Row: {
          created_at: string
          entity_id: string
          id: string
          image_url: string
          notes: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          id?: string
          image_url: string
          notes?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          id?: string
          image_url?: string
          notes?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_images_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_tags: {
        Row: {
          entity_id: string
          tag_id: string
        }
        Insert: {
          entity_id: string
          tag_id: string
        }
        Update: {
          entity_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_tags_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      relationships: {
        Row: {
          created_at: string
          entity_a_id: string
          entity_b_id: string
          id: string
          notes: string | null
          relationship_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_a_id: string
          entity_b_id: string
          id?: string
          notes?: string | null
          relationship_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_a_id?: string
          entity_b_id?: string
          id?: string
          notes?: string | null
          relationship_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationships_entity_a_id_fkey"
            columns: ["entity_a_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relationships_entity_b_id_fkey"
            columns: ["entity_b_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      social_accounts: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          entity_id: string
          id: string
          notes: string | null
          platform: Database["public"]["Enums"]["social_platform"]
          profile_url: string | null
          updated_at: string
          user_id_platform: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          entity_id: string
          id?: string
          notes?: string | null
          platform: Database["public"]["Enums"]["social_platform"]
          profile_url?: string | null
          updated_at?: string
          user_id_platform?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          entity_id?: string
          id?: string
          notes?: string | null
          platform?: Database["public"]["Enums"]["social_platform"]
          profile_url?: string | null
          updated_at?: string
          user_id_platform?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_accounts_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      entity_type: "person" | "group" | "organization" | "other" | "website"
      social_platform:
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
        | "other"
        | "forums"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      entity_type: ["person", "group", "organization", "other", "website"],
      social_platform: [
        "telegram",
        "discord",
        "twitter",
        "instagram",
        "facebook",
        "linkedin",
        "github",
        "reddit",
        "tiktok",
        "youtube",
        "whatsapp",
        "signal",
        "snapchat",
        "twitch",
        "steam",
        "other",
        "forums",
      ],
    },
  },
} as const
