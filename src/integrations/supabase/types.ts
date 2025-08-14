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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      client_portals: {
        Row: {
          access_count: number
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          last_accessed: string | null
          password_hash: string | null
          portal_hash: string
          project_id: string
          show_team_names: boolean
          updated_at: string
          user_id: string | null
        }
        Insert: {
          access_count?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_accessed?: string | null
          password_hash?: string | null
          portal_hash: string
          project_id: string
          show_team_names?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          access_count?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_accessed?: string | null
          password_hash?: string | null
          portal_hash?: string
          project_id?: string
          show_team_names?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      client_updates: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_visible_to_client: boolean
          message: string
          project_id: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_visible_to_client?: boolean
          message: string
          project_id: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_visible_to_client?: boolean
          message?: string
          project_id?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      deliverables: {
        Row: {
          created_at: string
          declarable_hours: number | null
          description: string | null
          due_date: string | null
          id: string
          manual_time_seconds: number | null
          phase_id: string | null
          project_id: string
          status: string
          target_date: string | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          declarable_hours?: number | null
          description?: string | null
          due_date?: string | null
          id?: string
          manual_time_seconds?: number | null
          phase_id?: string | null
          project_id: string
          status?: string
          target_date?: string | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          declarable_hours?: number | null
          description?: string | null
          due_date?: string | null
          id?: string
          manual_time_seconds?: number | null
          phase_id?: string | null
          project_id?: string
          status?: string
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliverables_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          category: Database["public"]["Enums"]["goal_category"]
          completed_at: string | null
          created_at: string
          current_value: number | null
          deadline: string | null
          description: string | null
          goal_type: Database["public"]["Enums"]["goal_type"]
          id: string
          is_completed: boolean | null
          notification_settings: Json | null
          status: Database["public"]["Enums"]["goal_status"]
          target_unit: string | null
          target_value: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["goal_category"]
          completed_at?: string | null
          created_at?: string
          current_value?: number | null
          deadline?: string | null
          description?: string | null
          goal_type?: Database["public"]["Enums"]["goal_type"]
          id?: string
          is_completed?: boolean | null
          notification_settings?: Json | null
          status?: Database["public"]["Enums"]["goal_status"]
          target_unit?: string | null
          target_value?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["goal_category"]
          completed_at?: string | null
          created_at?: string
          current_value?: number | null
          deadline?: string | null
          description?: string | null
          goal_type?: Database["public"]["Enums"]["goal_type"]
          id?: string
          is_completed?: boolean | null
          notification_settings?: Json | null
          status?: Database["public"]["Enums"]["goal_status"]
          target_unit?: string | null
          target_value?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lead_activities: {
        Row: {
          activity_date: string
          activity_type: string
          created_at: string
          description: string | null
          id: string
          lead_id: string
          title: string
          user_id: string
        }
        Insert: {
          activity_date?: string
          activity_type: string
          created_at?: string
          description?: string | null
          id?: string
          lead_id: string
          title: string
          user_id: string
        }
        Update: {
          activity_date?: string
          activity_type?: string
          created_at?: string
          description?: string | null
          id?: string
          lead_id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      lead_settings: {
        Row: {
          created_at: string
          enable_follow_up_reminders: boolean
          enable_stale_detector: boolean
          id: string
          notify_by_email: boolean
          notify_in_app: boolean
          stale_lead_days: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enable_follow_up_reminders?: boolean
          enable_stale_detector?: boolean
          id?: string
          notify_by_email?: boolean
          notify_in_app?: boolean
          stale_lead_days?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enable_follow_up_reminders?: boolean
          enable_stale_detector?: boolean
          id?: string
          notify_by_email?: boolean
          notify_in_app?: boolean
          stale_lead_days?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          company_name: string
          contact_person: string | null
          converted_to_project_id: string | null
          created_at: string
          email: string | null
          estimated_budget: number | null
          estimated_value: number | null
          expected_close_date: string | null
          id: string
          is_stale: boolean
          next_follow_up_date: string | null
          next_follow_up_description: string | null
          notes: string | null
          phone: string | null
          probability: number | null
          source: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name: string
          contact_person?: string | null
          converted_to_project_id?: string | null
          created_at?: string
          email?: string | null
          estimated_budget?: number | null
          estimated_value?: number | null
          expected_close_date?: string | null
          id?: string
          is_stale?: boolean
          next_follow_up_date?: string | null
          next_follow_up_description?: string | null
          notes?: string | null
          phone?: string | null
          probability?: number | null
          source?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string
          contact_person?: string | null
          converted_to_project_id?: string | null
          created_at?: string
          email?: string | null
          estimated_budget?: number | null
          estimated_value?: number | null
          expected_close_date?: string | null
          id?: string
          is_stale?: boolean
          next_follow_up_date?: string | null
          next_follow_up_description?: string | null
          notes?: string | null
          phone?: string | null
          probability?: number | null
          source?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      manual_time_entries: {
        Row: {
          created_at: string
          deliverable_id: string | null
          description: string | null
          id: string
          phase_id: string | null
          project_id: string
          task_id: string | null
          time_seconds: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deliverable_id?: string | null
          description?: string | null
          id?: string
          phase_id?: string | null
          project_id: string
          task_id?: string | null
          time_seconds: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deliverable_id?: string | null
          description?: string | null
          id?: string
          phase_id?: string | null
          project_id?: string
          task_id?: string | null
          time_seconds?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      moneybird_aggregates_daily: {
        Row: {
          basis: string
          cash_in: number
          cash_net: number
          cash_out: number
          connection_id: string | null
          costs_excl_vat: number
          created_at: string
          date: string
          group_key: string | null
          grouping: string
          id: string
          organization_id: string | null
          revenue_excl_vat: number
          source_counts: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          basis?: string
          cash_in?: number
          cash_net?: number
          cash_out?: number
          connection_id?: string | null
          costs_excl_vat?: number
          created_at?: string
          date: string
          group_key?: string | null
          grouping?: string
          id?: string
          organization_id?: string | null
          revenue_excl_vat?: number
          source_counts?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          basis?: string
          cash_in?: number
          cash_net?: number
          cash_out?: number
          connection_id?: string | null
          costs_excl_vat?: number
          created_at?: string
          date?: string
          group_key?: string | null
          grouping?: string
          id?: string
          organization_id?: string | null
          revenue_excl_vat?: number
          source_counts?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moneybird_aggregates_daily_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "moneybird_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moneybird_aggregates_daily_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "moneybird_connections_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      moneybird_connections: {
        Row: {
          access_token: string | null
          administration_id: string
          auth_type: string
          connection_label: string | null
          created_at: string
          id: string
          organization_id: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          administration_id: string
          auth_type: string
          connection_label?: string | null
          created_at?: string
          id?: string
          organization_id?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          administration_id?: string
          auth_type?: string
          connection_label?: string | null
          created_at?: string
          id?: string
          organization_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      moneybird_sync_state: {
        Row: {
          connection_id: string
          created_at: string
          cursor: string | null
          etag: string | null
          id: string
          last_synced_at: string | null
          resource: string
          updated_at: string
          user_id: string
        }
        Insert: {
          connection_id: string
          created_at?: string
          cursor?: string | null
          etag?: string | null
          id?: string
          last_synced_at?: string | null
          resource: string
          updated_at?: string
          user_id: string
        }
        Update: {
          connection_id?: string
          created_at?: string
          cursor?: string | null
          etag?: string | null
          id?: string
          last_synced_at?: string | null
          resource?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moneybird_sync_state_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "moneybird_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moneybird_sync_state_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "moneybird_connections_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          lead_id: string | null
          message: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          lead_id?: string | null
          message: string
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          lead_id?: string | null
          message?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      phases: {
        Row: {
          created_at: string
          id: string
          manual_time_seconds: number | null
          name: string
          project_id: string
          status: string | null
          target_date: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          manual_time_seconds?: number | null
          name: string
          project_id: string
          status?: string | null
          target_date?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          manual_time_seconds?: number | null
          name?: string
          project_id?: string
          status?: string | null
          target_date?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      portal_access_logs: {
        Row: {
          accessed_at: string
          id: string
          ip_address: unknown | null
          portal_id: string
          user_agent: string | null
        }
        Insert: {
          accessed_at?: string
          id?: string
          ip_address?: unknown | null
          portal_id: string
          user_agent?: string | null
        }
        Update: {
          accessed_at?: string
          id?: string
          ip_address?: unknown | null
          portal_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_meetings: {
        Row: {
          attendees: string | null
          created_at: string
          description: string | null
          id: string
          location: string | null
          meeting_date: string
          meeting_time: string | null
          project_id: string
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          attendees?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          meeting_date: string
          meeting_time?: string | null
          project_id: string
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          attendees?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: string | null
          meeting_date?: string
          meeting_time?: string | null
          project_id?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      project_messages: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          project_id: string
          sender_email: string | null
          sender_name: string | null
          sender_type: string
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          project_id: string
          sender_email?: string | null
          sender_name?: string | null
          sender_type: string
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          project_id?: string
          sender_email?: string | null
          sender_name?: string | null
          sender_type?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          budget: number | null
          client: string
          created_at: string
          description: string | null
          end_date: string | null
          hourly_rate: number | null
          id: string
          is_highlighted: boolean
          is_internal: boolean
          is_todo_list: boolean
          name: string
          progress: number | null
          project_value: number | null
          sort_order: number | null
          start_date: string | null
          status: string
          total_hours: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          budget?: number | null
          client: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          hourly_rate?: number | null
          id?: string
          is_highlighted?: boolean
          is_internal?: boolean
          is_todo_list?: boolean
          name: string
          progress?: number | null
          project_value?: number | null
          sort_order?: number | null
          start_date?: string | null
          status?: string
          total_hours?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          budget?: number | null
          client?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          hourly_rate?: number | null
          id?: string
          is_highlighted?: boolean
          is_internal?: boolean
          is_todo_list?: boolean
          name?: string
          progress?: number | null
          project_value?: number | null
          sort_order?: number | null
          start_date?: string | null
          status?: string
          total_hours?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed: boolean
          completed_at: string | null
          created_at: string
          deliverable_id: string
          description: string | null
          estimated_time_seconds: number | null
          id: string
          manual_time_seconds: number | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          deliverable_id: string
          description?: string | null
          estimated_time_seconds?: number | null
          id?: string
          manual_time_seconds?: number | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          deliverable_id?: string
          description?: string | null
          estimated_time_seconds?: number | null
          id?: string
          manual_time_seconds?: number | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_tasks_deliverable"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "deliverables"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          created_at: string
          deliverable_id: string | null
          description: string | null
          duration_minutes: number | null
          duration_seconds: number | null
          end_time: string | null
          id: string
          is_active: boolean | null
          project_id: string
          start_time: string
          task_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          deliverable_id?: string | null
          description?: string | null
          duration_minutes?: number | null
          duration_seconds?: number | null
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          project_id: string
          start_time: string
          task_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          deliverable_id?: string | null
          description?: string | null
          duration_minutes?: number | null
          duration_seconds?: number | null
          end_time?: string | null
          id?: string
          is_active?: boolean | null
          project_id?: string
          start_time?: string
          task_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "deliverables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      moneybird_connections_safe: {
        Row: {
          administration_id: string | null
          auth_type: string | null
          connection_label: string | null
          created_at: string | null
          id: string | null
          user_id: string | null
        }
        Insert: {
          administration_id?: string | null
          auth_type?: string | null
          connection_label?: string | null
          created_at?: string | null
          id?: string | null
          user_id?: string | null
        }
        Update: {
          administration_id?: string | null
          auth_type?: string | null
          connection_label?: string | null
          created_at?: string | null
          id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_portal_hash: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_portal_data: {
        Args: { portal_hash_param: string }
        Returns: Json
      }
      get_secure_portal_data: {
        Args: { portal_hash_param: string }
        Returns: Json
      }
      insert_client_message: {
        Args: {
          p_message: string
          p_portal_hash: string
          p_sender_email?: string
          p_sender_name?: string
          p_subject: string
        }
        Returns: string
      }
      update_portal_access: {
        Args: { portal_hash_param: string }
        Returns: undefined
      }
      validate_portal_access: {
        Args: { portal_hash_param: string }
        Returns: boolean
      }
    }
    Enums: {
      goal_category: "sales" | "projects" | "personal" | "team" | "financial"
      goal_status:
        | "not_started"
        | "in_progress"
        | "completed"
        | "overdue"
        | "paused"
      goal_type: "numeric" | "percentage" | "boolean" | "milestone"
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
      goal_category: ["sales", "projects", "personal", "team", "financial"],
      goal_status: [
        "not_started",
        "in_progress",
        "completed",
        "overdue",
        "paused",
      ],
      goal_type: ["numeric", "percentage", "boolean", "milestone"],
    },
  },
} as const
