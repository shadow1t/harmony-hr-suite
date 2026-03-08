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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          check_in: string | null
          check_out: string | null
          company_id: string | null
          created_at: string
          date: string
          employee_id: string
          id: string
          notes: string | null
          status: string | null
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          company_id?: string | null
          created_at?: string
          date?: string
          employee_id: string
          id?: string
          notes?: string | null
          status?: string | null
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          company_id?: string | null
          created_at?: string
          date?: string
          employee_id?: string
          id?: string
          notes?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          city: string | null
          company_id: string | null
          created_at: string
          id: string
          name_ar: string
          name_en: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          name_ar: string
          name_en: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          name_ar?: string
          name_en?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "branches_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          currency: string
          domain: string | null
          id: string
          logo_url: string | null
          max_employees: number
          name_ar: string
          name_en: string
          social_insurance_pct: number
          status: Database["public"]["Enums"]["company_status"]
          subscription_plan: Database["public"]["Enums"]["subscription_plan"]
        }
        Insert: {
          created_at?: string
          currency?: string
          domain?: string | null
          id?: string
          logo_url?: string | null
          max_employees?: number
          name_ar: string
          name_en: string
          social_insurance_pct?: number
          status?: Database["public"]["Enums"]["company_status"]
          subscription_plan?: Database["public"]["Enums"]["subscription_plan"]
        }
        Update: {
          created_at?: string
          currency?: string
          domain?: string | null
          id?: string
          logo_url?: string | null
          max_employees?: number
          name_ar?: string
          name_en?: string
          social_insurance_pct?: number
          status?: Database["public"]["Enums"]["company_status"]
          subscription_plan?: Database["public"]["Enums"]["subscription_plan"]
        }
        Relationships: []
      }
      departments: {
        Row: {
          company_id: string | null
          created_at: string
          description_ar: string | null
          description_en: string | null
          id: string
          manager_id: string | null
          name_ar: string
          name_en: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          manager_id?: string | null
          name_ar: string
          name_en: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          manager_id?: string | null
          name_ar?: string
          name_en?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          basic_salary: number | null
          branch_id: string | null
          company_id: string | null
          contract_end_date: string | null
          contract_expiry_date: string | null
          contract_type: Database["public"]["Enums"]["contract_type"] | null
          created_at: string
          date_of_birth: string | null
          department_id: string | null
          email: string | null
          employee_number: string
          first_name_ar: string
          first_name_en: string | null
          gender: string | null
          hire_date: string
          housing_allowance: number | null
          id: string
          id_expiry_date: string | null
          last_name_ar: string
          last_name_en: string | null
          marital_status: string | null
          national_id: string | null
          nationality: string | null
          other_allowances: number | null
          phone: string | null
          position_ar: string | null
          position_en: string | null
          status: Database["public"]["Enums"]["employee_status"] | null
          transport_allowance: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          basic_salary?: number | null
          branch_id?: string | null
          company_id?: string | null
          contract_end_date?: string | null
          contract_expiry_date?: string | null
          contract_type?: Database["public"]["Enums"]["contract_type"] | null
          created_at?: string
          date_of_birth?: string | null
          department_id?: string | null
          email?: string | null
          employee_number: string
          first_name_ar: string
          first_name_en?: string | null
          gender?: string | null
          hire_date?: string
          housing_allowance?: number | null
          id?: string
          id_expiry_date?: string | null
          last_name_ar: string
          last_name_en?: string | null
          marital_status?: string | null
          national_id?: string | null
          nationality?: string | null
          other_allowances?: number | null
          phone?: string | null
          position_ar?: string | null
          position_en?: string | null
          status?: Database["public"]["Enums"]["employee_status"] | null
          transport_allowance?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          basic_salary?: number | null
          branch_id?: string | null
          company_id?: string | null
          contract_end_date?: string | null
          contract_expiry_date?: string | null
          contract_type?: Database["public"]["Enums"]["contract_type"] | null
          created_at?: string
          date_of_birth?: string | null
          department_id?: string | null
          email?: string | null
          employee_number?: string
          first_name_ar?: string
          first_name_en?: string | null
          gender?: string | null
          hire_date?: string
          housing_allowance?: number | null
          id?: string
          id_expiry_date?: string | null
          last_name_ar?: string
          last_name_en?: string | null
          marital_status?: string | null
          national_id?: string | null
          nationality?: string | null
          other_allowances?: number | null
          phone?: string | null
          position_ar?: string | null
          position_en?: string | null
          status?: Database["public"]["Enums"]["employee_status"] | null
          transport_allowance?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_cycles: {
        Row: {
          company_id: string | null
          created_at: string
          end_date: string
          id: string
          name_ar: string
          name_en: string | null
          start_date: string
          status: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          end_date: string
          id?: string
          name_ar: string
          name_en?: string | null
          start_date: string
          status?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          end_date?: string
          id?: string
          name_ar?: string
          name_en?: string | null
          start_date?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_cycles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          comments: string | null
          company_id: string | null
          created_at: string
          cycle_id: string
          employee_id: string
          evaluator_id: string | null
          id: string
          score: number | null
          self_comments: string | null
          self_score: number | null
          status: string | null
        }
        Insert: {
          comments?: string | null
          company_id?: string | null
          created_at?: string
          cycle_id: string
          employee_id: string
          evaluator_id?: string | null
          id?: string
          score?: number | null
          self_comments?: string | null
          self_score?: number | null
          status?: string | null
        }
        Update: {
          comments?: string | null
          company_id?: string | null
          created_at?: string
          cycle_id?: string
          employee_id?: string
          evaluator_id?: string | null
          id?: string
          score?: number | null
          self_comments?: string | null
          self_score?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "evaluation_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      job_postings: {
        Row: {
          closing_date: string | null
          company_id: string | null
          created_at: string
          department_id: string | null
          description_ar: string | null
          description_en: string | null
          id: string
          requirements: string | null
          status: string | null
          title_ar: string
          title_en: string | null
        }
        Insert: {
          closing_date?: string | null
          company_id?: string | null
          created_at?: string
          department_id?: string | null
          description_ar?: string | null
          description_en?: string | null
          id?: string
          requirements?: string | null
          status?: string | null
          title_ar: string
          title_en?: string | null
        }
        Update: {
          closing_date?: string | null
          company_id?: string | null
          created_at?: string
          department_id?: string | null
          description_ar?: string | null
          description_en?: string | null
          id?: string
          requirements?: string | null
          status?: string | null
          title_ar?: string
          title_en?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_postings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_postings_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_balances: {
        Row: {
          company_id: string | null
          employee_id: string
          id: string
          leave_type: Database["public"]["Enums"]["leave_type_enum"]
          remaining_days: number
          total_days: number
          used_days: number
          year: number
        }
        Insert: {
          company_id?: string | null
          employee_id: string
          id?: string
          leave_type: Database["public"]["Enums"]["leave_type_enum"]
          remaining_days?: number
          total_days?: number
          used_days?: number
          year?: number
        }
        Update: {
          company_id?: string | null
          employee_id?: string
          id?: string
          leave_type?: Database["public"]["Enums"]["leave_type_enum"]
          remaining_days?: number
          total_days?: number
          used_days?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "leave_balances_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_balances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          company_id: string | null
          created_at: string
          days_count: number
          employee_id: string
          end_date: string
          id: string
          leave_type: Database["public"]["Enums"]["leave_type_enum"]
          reason: string | null
          start_date: string
          status: Database["public"]["Enums"]["leave_status"] | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string | null
          created_at?: string
          days_count?: number
          employee_id: string
          end_date: string
          id?: string
          leave_type: Database["public"]["Enums"]["leave_type_enum"]
          reason?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["leave_status"] | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string | null
          created_at?: string
          days_count?: number
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: Database["public"]["Enums"]["leave_type_enum"]
          reason?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["leave_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          amount: number
          approved_by: string | null
          company_id: string | null
          created_at: string
          employee_id: string
          id: string
          monthly_deduction: number
          paid_installments: number | null
          reason: string | null
          remaining_amount: number
          status: Database["public"]["Enums"]["loan_status"] | null
          total_installments: number
        }
        Insert: {
          amount: number
          approved_by?: string | null
          company_id?: string | null
          created_at?: string
          employee_id: string
          id?: string
          monthly_deduction: number
          paid_installments?: number | null
          reason?: string | null
          remaining_amount: number
          status?: Database["public"]["Enums"]["loan_status"] | null
          total_installments: number
        }
        Update: {
          amount?: number
          approved_by?: string | null
          company_id?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          monthly_deduction?: number
          paid_installments?: number | null
          reason?: string | null
          remaining_amount?: number
          status?: Database["public"]["Enums"]["loan_status"] | null
          total_installments?: number
        }
        Relationships: [
          {
            foreignKeyName: "loans_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          is_read: boolean
          message: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll: {
        Row: {
          basic_salary: number | null
          company_id: string | null
          created_at: string
          deductions: number | null
          employee_id: string
          housing_allowance: number | null
          id: string
          month: number
          net_salary: number | null
          other_allowances: number | null
          overtime_amount: number | null
          social_insurance: number | null
          status: Database["public"]["Enums"]["payroll_status"] | null
          transport_allowance: number | null
          year: number
        }
        Insert: {
          basic_salary?: number | null
          company_id?: string | null
          created_at?: string
          deductions?: number | null
          employee_id: string
          housing_allowance?: number | null
          id?: string
          month: number
          net_salary?: number | null
          other_allowances?: number | null
          overtime_amount?: number | null
          social_insurance?: number | null
          status?: Database["public"]["Enums"]["payroll_status"] | null
          transport_allowance?: number | null
          year: number
        }
        Update: {
          basic_salary?: number | null
          company_id?: string | null
          created_at?: string
          deductions?: number | null
          employee_id?: string
          housing_allowance?: number | null
          id?: string
          month?: number
          net_salary?: number | null
          other_allowances?: number | null
          overtime_amount?: number | null
          social_insurance?: number | null
          status?: Database["public"]["Enums"]["payroll_status"] | null
          transport_allowance?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "payroll_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string
          full_name: string | null
          id: string
          is_super_admin: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          is_super_admin?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_super_admin?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      training_courses: {
        Row: {
          company_id: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          max_participants: number | null
          start_date: string | null
          status: string | null
          title_ar: string
          title_en: string | null
          trainer: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          max_participants?: number | null
          start_date?: string | null
          status?: string | null
          title_ar: string
          title_en?: string | null
          trainer?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          max_participants?: number | null
          start_date?: string | null
          status?: string | null
          title_ar?: string
          title_en?: string | null
          trainer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_courses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      training_enrollments: {
        Row: {
          company_id: string | null
          completion_date: string | null
          course_id: string
          created_at: string
          employee_id: string
          id: string
          score: number | null
          status: string | null
        }
        Insert: {
          company_id?: string | null
          completion_date?: string | null
          course_id: string
          created_at?: string
          employee_id: string
          id?: string
          score?: number | null
          status?: string | null
        }
        Update: {
          company_id?: string | null
          completion_date?: string | null
          course_id?: string
          created_at?: string
          employee_id?: string
          id?: string
          score?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_enrollments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_enrollments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_hr_or_admin: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "hr_manager" | "manager" | "employee"
      company_status: "active" | "suspended"
      contract_type: "full_time" | "part_time" | "contract" | "temporary"
      employee_status: "active" | "on_leave" | "terminated"
      leave_status: "pending" | "approved" | "rejected" | "cancelled"
      leave_type_enum:
        | "annual"
        | "sick"
        | "emergency"
        | "unpaid"
        | "maternity"
        | "paternity"
      loan_status: "pending" | "approved" | "rejected" | "active" | "paid"
      payroll_status: "draft" | "processing" | "completed" | "paid"
      subscription_plan: "basic" | "pro" | "enterprise"
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
      app_role: ["admin", "hr_manager", "manager", "employee"],
      company_status: ["active", "suspended"],
      contract_type: ["full_time", "part_time", "contract", "temporary"],
      employee_status: ["active", "on_leave", "terminated"],
      leave_status: ["pending", "approved", "rejected", "cancelled"],
      leave_type_enum: [
        "annual",
        "sick",
        "emergency",
        "unpaid",
        "maternity",
        "paternity",
      ],
      loan_status: ["pending", "approved", "rejected", "active", "paid"],
      payroll_status: ["draft", "processing", "completed", "paid"],
      subscription_plan: ["basic", "pro", "enterprise"],
    },
  },
} as const
