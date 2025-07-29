export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      deliverables: {
        Row: {
          created_at: string
          declarable_hours: number | null
          description: string | null
          due_date: string | null
          id: string
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
      phases: {
        Row: {
          created_at: string
          id: string
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
          name?: string
          project_id?: string
          status?: string | null
          target_date?: string | null
          updated_at?: string
          user_id?: string | null
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
      projects: {
        Row: {
          budget: number | null
          client: string
          created_at: string
          description: string | null
          end_date: string | null
          hourly_rate: number | null
          id: string
          name: string
          progress: number | null
          project_value: number | null
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
          name: string
          progress?: number | null
          project_value?: number | null
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
          name?: string
          progress?: number | null
          project_value?: number | null
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
          id: string
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
          id?: string
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
          id?: string
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
