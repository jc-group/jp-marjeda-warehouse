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
      currency_rates: {
        Row: {
          base_currency: string
          currency_code: string
          id: string
          rate: number
          updated_at: string | null
        }
        Insert: {
          base_currency?: string
          currency_code: string
          id?: string
          rate: number
          updated_at?: string | null
        }
        Update: {
          base_currency?: string
          currency_code?: string
          id?: string
          rate?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      inventory: {
        Row: {
          location_id: string
          product_id: string
          quantity: number
        }
        Insert: {
          location_id: string
          product_id: string
          quantity?: number
        }
        Update: {
          location_id?: string
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          code: string
          created_at: string | null
          id: string
          type: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          type?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          type?: string | null
        }
        Relationships: []
      }
      movements: {
        Row: {
          created_at: string | null
          exchange_rate: number | null
          from_location_id: string | null
          id: string
          invoice_cost: number | null
          invoice_currency: string | null
          product_id: string
          quantity: number
          to_location_id: string | null
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          exchange_rate?: number | null
          from_location_id?: string | null
          id?: string
          invoice_cost?: number | null
          invoice_currency?: string | null
          product_id: string
          quantity: number
          to_location_id?: string | null
          type?: string | null
          user_id?: string
        }
        Update: {
          created_at?: string | null
          exchange_rate?: number | null
          from_location_id?: string | null
          id?: string
          invoice_cost?: number | null
          invoice_currency?: string | null
          product_id?: string
          quantity?: number
          to_location_id?: string | null
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "movements_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_invoice_currency_fkey"
            columns: ["invoice_currency"]
            isOneToOne: false
            referencedRelation: "currency_rates"
            referencedColumns: ["currency_code"]
          },
          {
            foreignKeyName: "movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movements_to_location_id_fkey"
            columns: ["to_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string | null
          current_mxn_cost: number
          description: string | null
          id: string
          image_url: string | null
          manufacturer_part_number: string | null
          min_stock: number | null
          name: string
          original_cost_price: number | null
          original_currency_code: string | null
          sku: string
          supplier_id: string | null
          tax_rate: number | null
        }
        Insert: {
          created_at?: string | null
          current_mxn_cost?: number
          description?: string | null
          id?: string
          image_url?: string | null
          manufacturer_part_number?: string | null
          min_stock?: number | null
          name: string
          original_cost_price?: number | null
          original_currency_code?: string | null
          sku: string
          supplier_id?: string | null
          tax_rate?: number | null
        }
        Update: {
          created_at?: string | null
          current_mxn_cost?: number
          description?: string | null
          id?: string
          image_url?: string | null
          manufacturer_part_number?: string | null
          min_stock?: number | null
          name?: string
          original_cost_price?: number | null
          original_currency_code?: string | null
          sku?: string
          supplier_id?: string | null
          tax_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_original_currency_code_fkey"
            columns: ["original_currency_code"]
            isOneToOne: false
            referencedRelation: "currency_rates"
            referencedColumns: ["currency_code"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          created_at: string | null
          currency_code: string
          description: string
          id: string
          line_total: number
          product_id: string | null
          purchase_order_id: string
          quantity: number
          unit_of_measure: string
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          currency_code?: string
          description: string
          id?: string
          line_total: number
          product_id?: string | null
          purchase_order_id: string
          quantity: number
          unit_of_measure?: string
          unit_price: number
        }
        Update: {
          created_at?: string | null
          currency_code?: string
          description?: string
          id?: string
          line_total?: number
          product_id?: string | null
          purchase_order_id?: string
          quantity?: number
          unit_of_measure?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_currency_code_fkey"
            columns: ["currency_code"]
            isOneToOne: false
            referencedRelation: "currency_rates"
            referencedColumns: ["currency_code"]
          },
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string | null
          currency_code: string
          expected_delivery_date: string | null
          id: string
          notes: string | null
          order_date: string
          po_number: string
          purchase_request_id: string | null
          status: string
          supplier_id: string
          total_amount: number
          updated_at: string | null
          buyer_id: string
        }
        Insert: {
          created_at?: string | null
          currency_code?: string
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          po_number: string
          purchase_request_id?: string | null
          status?: string
          supplier_id: string
          total_amount?: number
          updated_at?: string | null
          buyer_id: string
        }
        Update: {
          created_at?: string | null
          currency_code?: string
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          po_number?: string
          purchase_request_id?: string | null
          status?: string
          supplier_id?: string
          total_amount?: number
          updated_at?: string | null
          buyer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_currency_code_fkey"
            columns: ["currency_code"]
            isOneToOne: false
            referencedRelation: "currency_rates"
            referencedColumns: ["currency_code"]
          },
          {
            foreignKeyName: "purchase_orders_purchase_request_id_fkey"
            columns: ["purchase_request_id"]
            isOneToOne: false
            referencedRelation: "purchase_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_request_approvals: {
        Row: {
          approver_id: string
          comments: string | null
          created_at: string | null
          decision_at: string | null
          id: string
          level: number
          purchase_request_id: string
          status: string
        }
        Insert: {
          approver_id: string
          comments?: string | null
          created_at?: string | null
          decision_at?: string | null
          id?: string
          level?: number
          purchase_request_id: string
          status?: string
        }
        Update: {
          approver_id?: string
          comments?: string | null
          created_at?: string | null
          decision_at?: string | null
          id?: string
          level?: number
          purchase_request_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_request_approvals_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_request_approvals_purchase_request_id_fkey"
            columns: ["purchase_request_id"]
            isOneToOne: false
            referencedRelation: "purchase_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_request_items: {
        Row: {
          created_at: string | null
          currency_code: string
          description: string
          id: string
          line_total: number
          needed_date: string | null
          product_id: string | null
          purchase_request_id: string
          quantity: number
          unit_of_measure: string
          unit_price_estimated: number
        }
        Insert: {
          created_at?: string | null
          currency_code?: string
          description: string
          id?: string
          line_total?: number
          needed_date?: string | null
          product_id?: string | null
          purchase_request_id: string
          quantity: number
          unit_of_measure?: string
          unit_price_estimated: number
        }
        Update: {
          created_at?: string | null
          currency_code?: string
          description?: string
          id?: string
          line_total?: number
          needed_date?: string | null
          product_id?: string | null
          purchase_request_id?: string
          quantity?: number
          unit_of_measure?: string
          unit_price_estimated?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_request_items_currency_code_fkey"
            columns: ["currency_code"]
            isOneToOne: false
            referencedRelation: "currency_rates"
            referencedColumns: ["currency_code"]
          },
          {
            foreignKeyName: "purchase_request_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_request_items_purchase_request_id_fkey"
            columns: ["purchase_request_id"]
            isOneToOne: false
            referencedRelation: "purchase_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_requests: {
        Row: {
          created_at: string | null
          currency_code: string
          id: string
          notes: string | null
          priority: string
          request_number: string
          requester_id: string
          required_date: string | null
          status: string
          supplier_id: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency_code?: string
          id?: string
          notes?: string | null
          priority?: string
          request_number: string
          requester_id: string
          required_date?: string | null
          status?: string
          supplier_id?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency_code?: string
          id?: string
          notes?: string | null
          priority?: string
          request_number?: string
          requester_id?: string
          required_date?: string | null
          status?: string
          supplier_id?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_requests_currency_code_fkey"
            columns: ["currency_code"]
            isOneToOne: false
            referencedRelation: "currency_rates"
            referencedColumns: ["currency_code"]
          },
          {
            foreignKeyName: "purchase_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_requests_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address_city: string | null
          address_state: string | null
          address_street: string | null
          address_zip_code: string | null
          company_name: string
          contact_person: string | null
          created_at: string | null
          delivery_time_days: number | null
          email: string | null
          id: string
          is_active: boolean | null
          payment_terms: string | null
          phone: string | null
          rfc: string
        }
        Insert: {
          address_city?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip_code?: string | null
          company_name: string
          contact_person?: string | null
          created_at?: string | null
          delivery_time_days?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          payment_terms?: string | null
          phone?: string | null
          rfc: string
        }
        Update: {
          address_city?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip_code?: string | null
          company_name?: string
          contact_person?: string | null
          created_at?: string | null
          delivery_time_days?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          payment_terms?: string | null
          phone?: string | null
          rfc?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          can_approve_purchases: boolean | null
          can_request_purchases: boolean | null
          full_name: string | null
          id: string
          is_active: boolean | null
          role: string
          username: string | null
        }
        Insert: {
          created_at?: string | null
          can_approve_purchases?: boolean | null
          can_request_purchases?: boolean | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          role?: string
          username?: string | null
        }
        Update: {
          created_at?: string | null
          can_approve_purchases?: boolean | null
          can_request_purchases?: boolean | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          role?: string
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_role: { Args: { role_name: string }; Returns: boolean }
      move_inventory: {
        Args: {
          p_from_location_id: string
          p_product_id: string
          p_quantity: number
          p_to_location_id: string
          p_user_id: string
        }
        Returns: undefined
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
