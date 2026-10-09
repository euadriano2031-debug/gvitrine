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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      categorias: {
        Row: {
          created_at: string
          id: string
          nome: string
          ordem: number
          organization_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          ordem?: number
          organization_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          ordem?: number
          organization_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorias_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes: {
        Row: {
          chave: string
          created_at: string
          id: string
          organization_id: string | null
          updated_at: string
          valor: Json
        }
        Insert: {
          chave: string
          created_at?: string
          id?: string
          organization_id?: string | null
          updated_at?: string
          valor?: Json
        }
        Update: {
          chave?: string
          created_at?: string
          id?: string
          organization_id?: string | null
          updated_at?: string
          valor?: Json
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      loja_backups: {
        Row: {
          checksum: string
          criado_por: string | null
          expira_em: string
          gerado_em: string
          id: string
          origem: string
          organization_id: string
          payload: Json
        }
        Insert: {
          checksum: string
          criado_por?: string | null
          expira_em?: string
          gerado_em?: string
          id?: string
          origem?: string
          organization_id: string
          payload: Json
        }
        Update: {
          checksum?: string
          criado_por?: string | null
          expira_em?: string
          gerado_em?: string
          id?: string
          origem?: string
          organization_id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "loja_backups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          email: string | null
          id: string
          mensagem: string | null
          nome: string
          organization_id: string | null
          produto_id: string | null
          telefone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          mensagem?: string | null
          nome: string
          organization_id?: string | null
          produto_id?: string | null
          telefone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          mensagem?: string | null
          nome?: string
          organization_id?: string | null
          produto_id?: string | null
          telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string
          external_customer_id: string | null
          external_subscription_id: string | null
          id: string
          organization_id: string
          plan_code: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string
          external_customer_id?: string | null
          external_subscription_id?: string | null
          id?: string
          organization_id: string
          plan_code?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string
          external_customer_id?: string | null
          external_subscription_id?: string | null
          id?: string
          organization_id?: string
          plan_code?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_subscriptions_plan_code_fkey"
            columns: ["plan_code"]
            isOneToOne: false
            referencedRelation: "saas_plans"
            referencedColumns: ["code"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          custom_domain: string | null
          description: string
          id: string
          logo_url: string | null
          name: string
          owner_user_id: string
          primary_color: string
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_domain?: string | null
          description?: string
          id?: string
          logo_url?: string | null
          name: string
          owner_user_id: string
          primary_color?: string
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_domain?: string | null
          description?: string
          id?: string
          logo_url?: string | null
          name?: string
          owner_user_id?: string
          primary_color?: string
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      produtos: {
        Row: {
          ativo: boolean
          botoes_ordem: string[]
          categoria_id: string | null
          checkout_url: string | null
          comprar_ativo: boolean
          comprar_cor: string
          comprar_provedor: string
          comprar_texto: string
          created_at: string
          demo_ativo: boolean
          demo_cor: string
          demo_texto: string
          demo_url: string | null
          desconto: string | null
          desconto_ativo: boolean
          desconto_cor: string
          descricao: string
          destaque: boolean
          id: string
          imagem_url: string | null
          ordem: number
          organization_id: string | null
          parcelamento: string | null
          pix_icone: string
          popup_imagem_url: string | null
          popup_video_tipo: string
          popup_video_url: string | null
          preco: number
          preco_antigo: number | null
          secao: string
          selo: string | null
          site_ativo: boolean
          site_cor: string
          site_texto: string
          site_url: string | null
          slug: string | null
          tags: string[]
          titulo: string
          updated_at: string
          video_url: string | null
          whatsapp_compartilhar_ativo: boolean
          whatsapp_compartilhar_cor: string
          whatsapp_compartilhar_descricao: string | null
          whatsapp_compartilhar_imagem_url: string | null
          whatsapp_compartilhar_texto: string
          whatsapp_compartilhar_titulo: string | null
          whatsapp_compartilhar_url: string | null
          whatsapp_url: string | null
        }
        Insert: {
          ativo?: boolean
          botoes_ordem?: string[]
          categoria_id?: string | null
          checkout_url?: string | null
          comprar_ativo?: boolean
          comprar_cor?: string
          comprar_provedor?: string
          comprar_texto?: string
          created_at?: string
          demo_ativo?: boolean
          demo_cor?: string
          demo_texto?: string
          demo_url?: string | null
          desconto?: string | null
          desconto_ativo?: boolean
          desconto_cor?: string
          descricao?: string
          destaque?: boolean
          id?: string
          imagem_url?: string | null
          ordem?: number
          organization_id?: string | null
          parcelamento?: string | null
          pix_icone?: string
          popup_imagem_url?: string | null
          popup_video_tipo?: string
          popup_video_url?: string | null
          preco?: number
          preco_antigo?: number | null
          secao?: string
          selo?: string | null
          site_ativo?: boolean
          site_cor?: string
          site_texto?: string
          site_url?: string | null
          slug?: string | null
          tags?: string[]
          titulo: string
          updated_at?: string
          video_url?: string | null
          whatsapp_compartilhar_ativo?: boolean
          whatsapp_compartilhar_cor?: string
          whatsapp_compartilhar_descricao?: string | null
          whatsapp_compartilhar_imagem_url?: string | null
          whatsapp_compartilhar_texto?: string
          whatsapp_compartilhar_titulo?: string | null
          whatsapp_compartilhar_url?: string | null
          whatsapp_url?: string | null
        }
        Update: {
          ativo?: boolean
          botoes_ordem?: string[]
          categoria_id?: string | null
          checkout_url?: string | null
          comprar_ativo?: boolean
          comprar_cor?: string
          comprar_provedor?: string
          comprar_texto?: string
          created_at?: string
          demo_ativo?: boolean
          demo_cor?: string
          demo_texto?: string
          demo_url?: string | null
          desconto?: string | null
          desconto_ativo?: boolean
          desconto_cor?: string
          descricao?: string
          destaque?: boolean
          id?: string
          imagem_url?: string | null
          ordem?: number
          organization_id?: string | null
          parcelamento?: string | null
          pix_icone?: string
          popup_imagem_url?: string | null
          popup_video_tipo?: string
          popup_video_url?: string | null
          preco?: number
          preco_antigo?: number | null
          secao?: string
          selo?: string | null
          site_ativo?: boolean
          site_cor?: string
          site_texto?: string
          site_url?: string | null
          slug?: string | null
          tags?: string[]
          titulo?: string
          updated_at?: string
          video_url?: string | null
          whatsapp_compartilhar_ativo?: boolean
          whatsapp_compartilhar_cor?: string
          whatsapp_compartilhar_descricao?: string | null
          whatsapp_compartilhar_imagem_url?: string | null
          whatsapp_compartilhar_texto?: string
          whatsapp_compartilhar_titulo?: string | null
          whatsapp_compartilhar_url?: string | null
          whatsapp_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_plans: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string
          max_leads: number
          max_members: number
          max_products: number
          name: string
          price_monthly: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string
          max_leads?: number
          max_members?: number
          max_products?: number
          name: string
          price_monthly?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string
          max_leads?: number
          max_members?: number
          max_products?: number
          name?: string
          price_monthly?: number
          updated_at?: string
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
      clonar_loja_modelo: { Args: { _org: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_organization_active: {
        Args: { _organization_id: string }
        Returns: boolean
      }
      is_organization_admin: {
        Args: { _organization_id: string }
        Returns: boolean
      }
      is_organization_member: {
        Args: { _organization_id: string }
        Returns: boolean
      }
      criar_backup_da_loja: {
        Args: { _organization_id: string }
        Returns: string
      }
      criar_backup_pre_restauracao_da_loja: {
        Args: { _organization_id: string }
        Returns: string
      }
      restaurar_backup_da_loja: {
        Args: { _organization_id: string; _payload: Json }
        Returns: Json
      }
      pasta_da_loja_permitida: { Args: { _name: string }; Returns: boolean }
      public_produto_por_loja: {
        Args: { _organization_slug: string; _product_slug: string }
        Returns: Json
      }
      saas_usage: {
        Args: { _organization_id: string }
        Returns: {
          leads_count: number
          max_leads: number
          max_members: number
          max_products: number
          members_count: number
          plan_code: string
          plan_name: string
          products_count: number
        }[]
      }
      slugify: { Args: { _txt: string }; Returns: string }
      unaccent_fallback: { Args: { _txt: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
    },
  },
} as const
