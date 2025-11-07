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
      pendo_events: {
        Row: {
          account_id: string | null
          browser_time: string | null
          city: string | null
          country: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          metadata: Json | null
          region: string | null
          remote_ip: string | null
          user_agent: string | null
          visitor_id: string | null
        }
        Insert: {
          account_id?: string | null
          browser_time?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id: string
          metadata?: Json | null
          region?: string | null
          remote_ip?: string | null
          user_agent?: string | null
          visitor_id?: string | null
        }
        Update: {
          account_id?: string | null
          browser_time?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          region?: string | null
          remote_ip?: string | null
          user_agent?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      pendo_features: {
        Row: {
          avg_usage_per_user: number | null
          created_at: string | null
          id: string
          last_synced: string | null
          last_updated_at: string | null
          name: string
          unique_users: number | null
          usage_count: number | null
        }
        Insert: {
          avg_usage_per_user?: number | null
          created_at?: string | null
          id: string
          last_synced?: string | null
          last_updated_at?: string | null
          name: string
          unique_users?: number | null
          usage_count?: number | null
        }
        Update: {
          avg_usage_per_user?: number | null
          created_at?: string | null
          id?: string
          last_synced?: string | null
          last_updated_at?: string | null
          name?: string
          unique_users?: number | null
          usage_count?: number | null
        }
        Relationships: []
      }
      pendo_guides: {
        Row: {
          avg_time_to_complete: number | null
          completion_rate: number | null
          completions: number | null
          created_at: string | null
          id: string
          last_synced: string | null
          last_updated_at: string | null
          name: string
          state: string | null
          steps: number | null
          steps_data: Json | null
          views: number | null
        }
        Insert: {
          avg_time_to_complete?: number | null
          completion_rate?: number | null
          completions?: number | null
          created_at?: string | null
          id: string
          last_synced?: string | null
          last_updated_at?: string | null
          name: string
          state?: string | null
          steps?: number | null
          steps_data?: Json | null
          views?: number | null
        }
        Update: {
          avg_time_to_complete?: number | null
          completion_rate?: number | null
          completions?: number | null
          created_at?: string | null
          id?: string
          last_synced?: string | null
          last_updated_at?: string | null
          name?: string
          state?: string | null
          steps?: number | null
          steps_data?: Json | null
          views?: number | null
        }
        Relationships: []
      }
      pendo_pages: {
        Row: {
          avg_time_on_page: number | null
          bounce_rate: number | null
          created_at: string | null
          geographic_data: Json | null
          id: string
          last_synced: string | null
          last_updated_at: string | null
          name: string
          top_accounts: Json | null
          unique_visitors: number | null
          url: string | null
          views: number | null
        }
        Insert: {
          avg_time_on_page?: number | null
          bounce_rate?: number | null
          created_at?: string | null
          geographic_data?: Json | null
          id: string
          last_synced?: string | null
          last_updated_at?: string | null
          name: string
          top_accounts?: Json | null
          unique_visitors?: number | null
          url?: string | null
          views?: number | null
        }
        Update: {
          avg_time_on_page?: number | null
          bounce_rate?: number | null
          created_at?: string | null
          geographic_data?: Json | null
          id?: string
          last_synced?: string | null
          last_updated_at?: string | null
          name?: string
          top_accounts?: Json | null
          unique_visitors?: number | null
          url?: string | null
          views?: number | null
        }
        Relationships: []
      }
      pendo_reports: {
        Row: {
          configuration: Json | null
          created_at: string | null
          description: string | null
          id: string
          last_success_run_at: string | null
          last_synced: string | null
          last_updated_at: string | null
          name: string
        }
        Insert: {
          configuration?: Json | null
          created_at?: string | null
          description?: string | null
          id: string
          last_success_run_at?: string | null
          last_synced?: string | null
          last_updated_at?: string | null
          name: string
        }
        Update: {
          configuration?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          last_success_run_at?: string | null
          last_synced?: string | null
          last_updated_at?: string | null
          name?: string
        }
        Relationships: []
      }
      sync_status: {
        Row: {
          created_at: string | null
          entity_type: string
          error_message: string | null
          id: number
          last_sync_end: string | null
          last_sync_start: string | null
          records_processed: number | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          entity_type: string
          error_message?: string | null
          id?: number
          last_sync_end?: string | null
          last_sync_start?: string | null
          records_processed?: number | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          entity_type?: string
          error_message?: string | null
          id?: number
          last_sync_end?: string | null
          last_sync_start?: string | null
          records_processed?: number | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      call_pendo_sync_edge_function: { Args: never; Returns: undefined }
      get_feature_analytics: {
        Args: { days_back?: number }
        Returns: {
          avg_usage_per_user: number
          id: string
          name: string
          unique_users: number
          usage_count: number
        }[]
      }
      get_guide_analytics: {
        Args: { days_back?: number }
        Returns: {
          avg_time_to_complete: number
          completion_rate: number
          completions: number
          id: string
          name: string
          sparkline_data: Json
          state: string
          views: number
        }[]
      }
      get_page_analytics: {
        Args: { days_back?: number }
        Returns: {
          avg_time_on_page: number
          geographic_data: Json
          id: string
          name: string
          top_accounts: Json
          unique_visitors: number
          url: string
          views: number
        }[]
      }
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