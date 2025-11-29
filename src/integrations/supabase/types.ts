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
      case_notes: {
        Row: {
          case_id: string
          created_at: string
          created_by: string
          id: string
          note: string
        }
        Insert: {
          case_id: string
          created_at?: string
          created_by: string
          id?: string
          note: string
        }
        Update: {
          case_id?: string
          created_at?: string
          created_by?: string
          id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_notes_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          case_number: string
          created_at: string
          description: string | null
          id: string
          incident_date: string | null
          location: string | null
          officer_badge: string | null
          officer_name: string
          status: Database["public"]["Enums"]["case_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          case_number: string
          created_at?: string
          description?: string | null
          id?: string
          incident_date?: string | null
          location?: string | null
          officer_badge?: string | null
          officer_name: string
          status?: Database["public"]["Enums"]["case_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          case_number?: string
          created_at?: string
          description?: string | null
          id?: string
          incident_date?: string | null
          location?: string | null
          officer_badge?: string | null
          officer_name?: string
          status?: Database["public"]["Enums"]["case_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      criminals: {
        Row: {
          age_range: string | null
          aliases: string[] | null
          build: string | null
          conviction_dates: string[] | null
          created_at: string
          created_by: string | null
          criminal_history: string | null
          distinguishing_marks: string | null
          ethnicity: string | null
          gender: string | null
          height: string | null
          id: string
          is_active: boolean
          known_associates: string[] | null
          known_offenses: string[] | null
          last_known_location: string | null
          name: string
          photo_url: string
          special_instructions: string | null
          threat_level: Database["public"]["Enums"]["threat_level"]
          updated_at: string
          warrant_status: string | null
          weight: string | null
        }
        Insert: {
          age_range?: string | null
          aliases?: string[] | null
          build?: string | null
          conviction_dates?: string[] | null
          created_at?: string
          created_by?: string | null
          criminal_history?: string | null
          distinguishing_marks?: string | null
          ethnicity?: string | null
          gender?: string | null
          height?: string | null
          id?: string
          is_active?: boolean
          known_associates?: string[] | null
          known_offenses?: string[] | null
          last_known_location?: string | null
          name: string
          photo_url: string
          special_instructions?: string | null
          threat_level?: Database["public"]["Enums"]["threat_level"]
          updated_at?: string
          warrant_status?: string | null
          weight?: string | null
        }
        Update: {
          age_range?: string | null
          aliases?: string[] | null
          build?: string | null
          conviction_dates?: string[] | null
          created_at?: string
          created_by?: string | null
          criminal_history?: string | null
          distinguishing_marks?: string | null
          ethnicity?: string | null
          gender?: string | null
          height?: string | null
          id?: string
          is_active?: boolean
          known_associates?: string[] | null
          known_offenses?: string[] | null
          last_known_location?: string | null
          name?: string
          photo_url?: string
          special_instructions?: string | null
          threat_level?: Database["public"]["Enums"]["threat_level"]
          updated_at?: string
          warrant_status?: string | null
          weight?: string | null
        }
        Relationships: []
      }
      detections: {
        Row: {
          alerted: boolean
          case_id: string | null
          confidence_score: number | null
          created_at: string
          criminal_id: string | null
          detection_type: string
          frame_timestamp: string | null
          id: string
          location: string | null
          notes: string | null
          reviewed: boolean
          snapshot_url: string | null
          suspect_id: string | null
          video_url: string | null
        }
        Insert: {
          alerted?: boolean
          case_id?: string | null
          confidence_score?: number | null
          created_at?: string
          criminal_id?: string | null
          detection_type: string
          frame_timestamp?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          reviewed?: boolean
          snapshot_url?: string | null
          suspect_id?: string | null
          video_url?: string | null
        }
        Update: {
          alerted?: boolean
          case_id?: string | null
          confidence_score?: number | null
          created_at?: string
          criminal_id?: string | null
          detection_type?: string
          frame_timestamp?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          reviewed?: boolean
          snapshot_url?: string | null
          suspect_id?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "detections_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detections_criminal_id_fkey"
            columns: ["criminal_id"]
            isOneToOne: false
            referencedRelation: "criminals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detections_suspect_id_fkey"
            columns: ["suspect_id"]
            isOneToOne: false
            referencedRelation: "suspects"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence: {
        Row: {
          case_id: string
          created_at: string
          id: string
          image_url: string
          metadata: Json | null
          notes: string | null
          suspect_id: string | null
          type: Database["public"]["Enums"]["evidence_type"]
        }
        Insert: {
          case_id: string
          created_at?: string
          id?: string
          image_url: string
          metadata?: Json | null
          notes?: string | null
          suspect_id?: string | null
          type: Database["public"]["Enums"]["evidence_type"]
        }
        Update: {
          case_id?: string
          created_at?: string
          id?: string
          image_url?: string
          metadata?: Json | null
          notes?: string | null
          suspect_id?: string | null
          type?: Database["public"]["Enums"]["evidence_type"]
        }
        Relationships: [
          {
            foreignKeyName: "evidence_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_suspect_id_fkey"
            columns: ["suspect_id"]
            isOneToOne: false
            referencedRelation: "suspects"
            referencedColumns: ["id"]
          },
        ]
      }
      suspects: {
        Row: {
          age_range: string | null
          build: string | null
          case_id: string
          created_at: string
          distinguishing_marks: string | null
          ethnicity: string | null
          extracted_features: Json | null
          gender: string | null
          height: string | null
          id: string
          is_wanted: boolean
          name: string | null
          updated_at: string
        }
        Insert: {
          age_range?: string | null
          build?: string | null
          case_id: string
          created_at?: string
          distinguishing_marks?: string | null
          ethnicity?: string | null
          extracted_features?: Json | null
          gender?: string | null
          height?: string | null
          id?: string
          is_wanted?: boolean
          name?: string | null
          updated_at?: string
        }
        Update: {
          age_range?: string | null
          build?: string | null
          case_id?: string
          created_at?: string
          distinguishing_marks?: string | null
          ethnicity?: string | null
          extracted_features?: Json | null
          gender?: string | null
          height?: string | null
          id?: string
          is_wanted?: boolean
          name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suspects_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      case_status: "active" | "pending" | "solved" | "closed"
      evidence_type:
        | "sketch"
        | "generated"
        | "age_progression"
        | "angle_view"
        | "feature_extraction"
      threat_level: "low" | "medium" | "high" | "critical"
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
      case_status: ["active", "pending", "solved", "closed"],
      evidence_type: [
        "sketch",
        "generated",
        "age_progression",
        "angle_view",
        "feature_extraction",
      ],
      threat_level: ["low", "medium", "high", "critical"],
    },
  },
} as const
