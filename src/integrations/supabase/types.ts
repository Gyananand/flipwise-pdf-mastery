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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cards: {
        Row: {
          answer: string
          created_at: string
          deck_id: string
          difficulty_hint: string
          due_date: string
          ease_factor: number
          id: string
          interval: number
          last_rating: number | null
          mastery_state: string
          question: string
          repetitions: number
          topic_tag: string
        }
        Insert: {
          answer: string
          created_at?: string
          deck_id: string
          difficulty_hint?: string
          due_date?: string
          ease_factor?: number
          id?: string
          interval?: number
          last_rating?: number | null
          mastery_state?: string
          question: string
          repetitions?: number
          topic_tag?: string
        }
        Update: {
          answer?: string
          created_at?: string
          deck_id?: string
          difficulty_hint?: string
          due_date?: string
          ease_factor?: number
          id?: string
          interval?: number
          last_rating?: number | null
          mastery_state?: string
          question?: string
          repetitions?: number
          topic_tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
        ]
      }
      decks: {
        Row: {
          color: string
          created_at: string
          description: string | null
          emoji: string
          id: string
          last_studied_at: string | null
          name: string
          source_filename: string | null
          total_cards: number
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          emoji?: string
          id?: string
          last_studied_at?: string | null
          name: string
          source_filename?: string | null
          total_cards?: number
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          emoji?: string
          id?: string
          last_studied_at?: string | null
          name?: string
          source_filename?: string | null
          total_cards?: number
          user_id?: string
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          cards_again: number
          cards_easy: number
          cards_good: number
          cards_hard: number
          cards_studied: number
          deck_id: string | null
          duration_seconds: number
          id: string
          studied_at: string
          user_id: string
        }
        Insert: {
          cards_again?: number
          cards_easy?: number
          cards_good?: number
          cards_hard?: number
          cards_studied?: number
          deck_id?: string | null
          duration_seconds?: number
          id?: string
          studied_at?: string
          user_id: string
        }
        Update: {
          cards_again?: number
          cards_easy?: number
          cards_good?: number
          cards_hard?: number
          cards_studied?: number
          deck_id?: string | null
          duration_seconds?: number
          id?: string
          studied_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stats: {
        Row: {
          current_streak: number
          last_studied_date: string | null
          longest_streak: number
          total_cards_studied: number
          total_sessions: number
          updated_at: string
          user_id: string
          xp_points: number
        }
        Insert: {
          current_streak?: number
          last_studied_date?: string | null
          longest_streak?: number
          total_cards_studied?: number
          total_sessions?: number
          updated_at?: string
          user_id: string
          xp_points?: number
        }
        Update: {
          current_streak?: number
          last_studied_date?: string | null
          longest_streak?: number
          total_cards_studied?: number
          total_sessions?: number
          updated_at?: string
          user_id?: string
          xp_points?: number
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
