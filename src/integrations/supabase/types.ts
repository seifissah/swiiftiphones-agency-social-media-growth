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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          admin_id: string | null
          admin_name: string | null
          created_at: string
          details: string | null
          id: string
          target_customer_id: string | null
          target_customer_name: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          admin_name?: string | null
          created_at?: string
          details?: string | null
          id?: string
          target_customer_id?: string | null
          target_customer_name?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          admin_name?: string | null
          created_at?: string
          details?: string | null
          id?: string
          target_customer_id?: string | null
          target_customer_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_target_customer_id_fkey"
            columns: ["target_customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          current_value: number
          customer_id: string
          deadline: string | null
          id: string
          metric: string
          platform: string
          starting_value: number
          status: string
          target_value: number
        }
        Insert: {
          created_at?: string
          current_value?: number
          customer_id: string
          deadline?: string | null
          id?: string
          metric?: string
          platform: string
          starting_value?: number
          status?: string
          target_value?: number
        }
        Update: {
          created_at?: string
          current_value?: number
          customer_id?: string
          deadline?: string | null
          id?: string
          metric?: string
          platform?: string
          starting_value?: number
          status?: string
          target_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "goals_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          customer_id: string
          direction: string
          id: string
          read: boolean
          sender_id: string | null
          subject: string
        }
        Insert: {
          body: string
          created_at?: string
          customer_id: string
          direction?: string
          id?: string
          read?: boolean
          sender_id?: string | null
          subject: string
        }
        Update: {
          body?: string
          created_at?: string
          customer_id?: string
          direction?: string
          id?: string
          read?: boolean
          sender_id?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          customer_id: string
          id: string
          month: number
          performance_score: number
          recommendations: string | null
          status: string
          summary: string | null
          year: number
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          customer_id: string
          id?: string
          month: number
          performance_score?: number
          recommendations?: string | null
          status?: string
          summary?: string | null
          year: number
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          month?: number
          performance_score?: number
          recommendations?: string | null
          status?: string
          summary?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_reports_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          kind: string
          message: string | null
          read: boolean
          title: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          kind?: string
          message?: string | null
          read?: boolean
          title: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          kind?: string
          message?: string | null
          read?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          auto_approve: boolean
          id: number
          platform_name: string
          show_rankings_to_customers: boolean
          updated_at: string
          weight_activity: number
          weight_engagement: number
          weight_growth: number
          weight_reach: number
        }
        Insert: {
          auto_approve?: boolean
          id?: number
          platform_name?: string
          show_rankings_to_customers?: boolean
          updated_at?: string
          weight_activity?: number
          weight_engagement?: number
          weight_growth?: number
          weight_reach?: number
        }
        Update: {
          auto_approve?: boolean
          id?: number
          platform_name?: string
          show_rankings_to_customers?: boolean
          updated_at?: string
          weight_activity?: number
          weight_engagement?: number
          weight_growth?: number
          weight_reach?: number
        }
        Relationships: []
      }
      profile_admin_notes: {
        Row: {
          notes: string | null
          profile_id: string
          updated_at: string
        }
        Insert: {
          notes?: string | null
          profile_id: string
          updated_at?: string
        }
        Update: {
          notes?: string | null
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_admin_notes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_change_log: {
        Row: {
          changed_at: string
          changed_by: string | null
          field: string
          id: string
          new_value: string | null
          old_value: string | null
          profile_id: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          field: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          profile_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          field?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_change_log_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company_name: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_demo: boolean
          last_login: string | null
          phone: string | null
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
          user_id: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_demo?: boolean
          last_login?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          user_id?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_demo?: boolean
          last_login?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      social_accounts: {
        Row: {
          connection_status: string
          created_at: string
          customer_id: string
          data_source: string
          handle: string
          id: string
          last_synced_at: string | null
          platform: string
          profile_url: string | null
        }
        Insert: {
          connection_status?: string
          created_at?: string
          customer_id: string
          data_source?: string
          handle: string
          id?: string
          last_synced_at?: string | null
          platform: string
          profile_url?: string | null
        }
        Update: {
          connection_status?: string
          created_at?: string
          customer_id?: string
          data_source?: string
          handle?: string
          id?: string
          last_synced_at?: string | null
          platform?: string
          profile_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_accounts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_metrics: {
        Row: {
          comments: number
          created_at: string
          engagement_rate: number
          followers: number
          following: number
          id: string
          impressions: number
          likes: number
          posts: number
          reach: number
          recorded_on: string
          shares: number
          social_account_id: string
          source: string
          views: number
        }
        Insert: {
          comments?: number
          created_at?: string
          engagement_rate?: number
          followers?: number
          following?: number
          id?: string
          impressions?: number
          likes?: number
          posts?: number
          reach?: number
          recorded_on?: string
          shares?: number
          social_account_id: string
          source?: string
          views?: number
        }
        Update: {
          comments?: number
          created_at?: string
          engagement_rate?: number
          followers?: number
          following?: number
          id?: string
          impressions?: number
          likes?: number
          posts?: number
          reach?: number
          recorded_on?: string
          shares?: number
          social_account_id?: string
          source?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "social_metrics_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_customer_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      account_status: "pending" | "active" | "rejected" | "suspended"
      app_role: "admin" | "customer"
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
      account_status: ["pending", "active", "rejected", "suspended"],
      app_role: ["admin", "customer"],
    },
  },
} as const
