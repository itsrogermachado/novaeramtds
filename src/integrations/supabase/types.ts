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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      balance_adjustments: {
        Row: {
          adjustment_date: string
          amount: number
          created_at: string
          description: string
          id: string
          user_id: string
        }
        Insert: {
          adjustment_date?: string
          amount?: number
          created_at?: string
          description: string
          id?: string
          user_id: string
        }
        Update: {
          adjustment_date?: string
          amount?: number
          created_at?: string
          description?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      dutching_history: {
        Row: {
          created_at: string
          guaranteed_return: number
          id: string
          observation: string | null
          odds: number[]
          profit: number
          roi: number
          stakes: number[]
          total_invested: number
          user_id: string
        }
        Insert: {
          created_at?: string
          guaranteed_return: number
          id?: string
          observation?: string | null
          odds: number[]
          profit: number
          roi: number
          stakes: number[]
          total_invested: number
          user_id: string
        }
        Update: {
          created_at?: string
          guaranteed_return?: number
          id?: string
          observation?: string | null
          odds?: number[]
          profit?: number
          roi?: number
          stakes?: number[]
          total_invested?: number
          user_id?: string
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          description: string
          expense_date: string
          id: string
          user_id: string
        }
        Insert: {
          amount?: number
          category_id?: string | null
          created_at?: string
          description: string
          expense_date?: string
          id?: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          current_amount: number
          deadline: string | null
          goal_type: Database["public"]["Enums"]["goal_type"]
          id: string
          start_date: string
          target_amount: number
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_amount?: number
          deadline?: string | null
          goal_type?: Database["public"]["Enums"]["goal_type"]
          id?: string
          start_date?: string
          target_amount: number
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_amount?: number
          deadline?: string | null
          goal_type?: Database["public"]["Enums"]["goal_type"]
          id?: string
          start_date?: string
          target_amount?: number
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      operation_methods: {
        Row: {
          color: string
          created_at: string
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      operations: {
        Row: {
          created_at: string
          id: string
          invested_amount: number
          method_id: string | null
          notes: string | null
          operation_date: string
          return_amount: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invested_amount?: number
          method_id?: string | null
          notes?: string | null
          operation_date?: string
          return_amount?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invested_amount?: number
          method_id?: string | null
          notes?: string | null
          operation_date?: string
          return_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "operations_method_id_fkey"
            columns: ["method_id"]
            isOneToOne: false
            referencedRelation: "operation_methods"
            referencedColumns: ["id"]
          },
        ]
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
      store_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          name: string
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          name: string
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      store_coupons: {
        Row: {
          category_ids: string[] | null
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          max_discount_amount: number
          max_order_value: number
          max_uses: number
          min_order_value: number
          product_ids: string[] | null
          updated_at: string
          used_count: number
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          category_ids?: string[] | null
          code: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          max_discount_amount?: number
          max_order_value?: number
          max_uses?: number
          min_order_value?: number
          product_ids?: string[] | null
          updated_at?: string
          used_count?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          category_ids?: string[] | null
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          max_discount_amount?: number
          max_order_value?: number
          max_uses?: number
          min_order_value?: number
          product_ids?: string[] | null
          updated_at?: string
          used_count?: number
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      store_orders: {
        Row: {
          coupon_code: string | null
          created_at: string
          customer_email: string
          delivered_items: Json | null
          discount_amount: number
          id: string
          items: Json
          paid_at: string | null
          payer_document: string | null
          payer_name: string | null
          payment_method: string
          payment_reference: string | null
          status: string
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          coupon_code?: string | null
          created_at?: string
          customer_email: string
          delivered_items?: Json | null
          discount_amount?: number
          id?: string
          items?: Json
          paid_at?: string | null
          payer_document?: string | null
          payer_name?: string | null
          payment_method?: string
          payment_reference?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          coupon_code?: string | null
          created_at?: string
          customer_email?: string
          delivered_items?: Json | null
          discount_amount?: number
          id?: string
          items?: Json
          paid_at?: string | null
          payer_document?: string | null
          payer_name?: string | null
          payment_method?: string
          payment_reference?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      store_products: {
        Row: {
          auto_open_chat: boolean | null
          category_id: string
          comparison_price: string | null
          created_at: string
          cta_url: string | null
          delivery_type: string | null
          display_order: number
          hide_sold_count: boolean | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          is_hidden: boolean | null
          is_private: boolean | null
          long_description: string | null
          max_quantity: number | null
          min_quantity: number | null
          name: string
          post_sale_instructions: string | null
          price: string
          product_type: string | null
          short_description: string | null
          slug: string | null
          status: string
          stock: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          auto_open_chat?: boolean | null
          category_id: string
          comparison_price?: string | null
          created_at?: string
          cta_url?: string | null
          delivery_type?: string | null
          display_order?: number
          hide_sold_count?: boolean | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_hidden?: boolean | null
          is_private?: boolean | null
          long_description?: string | null
          max_quantity?: number | null
          min_quantity?: number | null
          name: string
          post_sale_instructions?: string | null
          price?: string
          product_type?: string | null
          short_description?: string | null
          slug?: string | null
          status?: string
          stock?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          auto_open_chat?: boolean | null
          category_id?: string
          comparison_price?: string | null
          created_at?: string
          cta_url?: string | null
          delivery_type?: string | null
          display_order?: number
          hide_sold_count?: boolean | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_hidden?: boolean | null
          is_private?: boolean | null
          long_description?: string | null
          max_quantity?: number | null
          min_quantity?: number | null
          name?: string
          post_sale_instructions?: string | null
          price?: string
          product_type?: string | null
          short_description?: string | null
          slug?: string | null
          status?: string
          stock?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "store_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          manager_id: string
          nickname: string | null
          operator_id: string
          team_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          manager_id: string
          nickname?: string | null
          operator_id: string
          team_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          manager_id?: string
          nickname?: string | null
          operator_id?: string
          team_name?: string | null
        }
        Relationships: []
      }
      teams: {
        Row: {
          created_at: string
          id: string
          manager_id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          manager_id: string
          name?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          manager_id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      tutorial_links: {
        Row: {
          created_at: string
          display_order: number
          id: string
          title: string
          tutorial_id: string
          url: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          title: string
          tutorial_id: string
          url: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          title?: string
          tutorial_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutorial_links_tutorial_id_fkey"
            columns: ["tutorial_id"]
            isOneToOne: false
            referencedRelation: "tutorials"
            referencedColumns: ["id"]
          },
        ]
      }
      tutorials: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string
        }
        Relationships: []
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
          role?: Database["public"]["Enums"]["app_role"]
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
      store_products_public: {
        Row: {
          auto_open_chat: boolean | null
          category_id: string | null
          comparison_price: string | null
          created_at: string | null
          cta_url: string | null
          delivery_type: string | null
          display_order: number | null
          hide_sold_count: boolean | null
          id: string | null
          image_url: string | null
          is_featured: boolean | null
          is_hidden: boolean | null
          is_private: boolean | null
          long_description: string | null
          max_quantity: number | null
          min_quantity: number | null
          name: string | null
          price: string | null
          short_description: string | null
          slug: string | null
          status: string | null
          stock_available: number | null
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          auto_open_chat?: boolean | null
          category_id?: string | null
          comparison_price?: string | null
          created_at?: string | null
          cta_url?: string | null
          delivery_type?: string | null
          display_order?: number | null
          hide_sold_count?: boolean | null
          id?: string | null
          image_url?: string | null
          is_featured?: boolean | null
          is_hidden?: boolean | null
          is_private?: boolean | null
          long_description?: string | null
          max_quantity?: number | null
          min_quantity?: number | null
          name?: string | null
          price?: string | null
          short_description?: string | null
          slug?: string | null
          status?: string | null
          stock_available?: never
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          auto_open_chat?: boolean | null
          category_id?: string | null
          comparison_price?: string | null
          created_at?: string | null
          cta_url?: string | null
          delivery_type?: string | null
          display_order?: number | null
          hide_sold_count?: boolean | null
          id?: string | null
          image_url?: string | null
          is_featured?: boolean | null
          is_hidden?: boolean | null
          is_private?: boolean | null
          long_description?: string | null
          max_quantity?: number | null
          min_quantity?: number | null
          name?: string | null
          price?: string | null
          short_description?: string | null
          slug?: string | null
          status?: string | null
          stock_available?: never
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "store_categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_product_availability: {
        Args: { product_id: string; requested_quantity?: number }
        Returns: Json
      }
      check_product_stock: { Args: { product_id: string }; Returns: boolean }
      get_product_stock_count: { Args: { product_id: string }; Returns: number }
      get_team_operator_ids: {
        Args: { _manager_id: string }
        Returns: string[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_manager_of: {
        Args: { _manager_id: string; _operator_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      goal_type: "monthly" | "daily" | "weekly"
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
      app_role: ["admin", "user"],
      goal_type: ["monthly", "daily", "weekly"],
    },
  },
} as const
