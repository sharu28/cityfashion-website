export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      order_items: {
        Row: {
          created_at: string;
          id: string;
          line_total_lkr: number;
          order_id: string;
          product_id: string;
          product_slug: string;
          product_title: string;
          quantity: number;
          unit_price_lkr: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          line_total_lkr: number;
          order_id: string;
          product_id: string;
          product_slug: string;
          product_title: string;
          quantity: number;
          unit_price_lkr: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          line_total_lkr?: number;
          order_id?: string;
          product_id?: string;
          product_slug?: string;
          product_title?: string;
          quantity?: number;
          unit_price_lkr?: number;
        };
        Relationships: [];
      };
      order_submission_attempts: {
        Row: {
          created_at: string;
          id: number;
          identity_hash: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          identity_hash: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          identity_hash?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          created_at: string;
          customer_name: string;
          delivery_charge_lkr: number | null;
          final_total_lkr: number | null;
          id: string;
          idempotency_key: string;
          private_note: string | null;
          product_total_lkr: number;
          public_number: number;
          status: Database["public"]["Enums"]["website_order_status"];
          updated_at: string;
          whatsapp_phone: string;
        };
        Insert: {
          created_at?: string;
          customer_name: string;
          delivery_charge_lkr?: number | null;
          id?: string;
          idempotency_key: string;
          private_note?: string | null;
          product_total_lkr: number;
          public_number?: number;
          status?: Database["public"]["Enums"]["website_order_status"];
          updated_at?: string;
          whatsapp_phone: string;
        };
        Update: {
          created_at?: string;
          customer_name?: string;
          delivery_charge_lkr?: number | null;
          id?: string;
          idempotency_key?: string;
          private_note?: string | null;
          product_total_lkr?: number;
          public_number?: number;
          status?: Database["public"]["Enums"]["website_order_status"];
          updated_at?: string;
          whatsapp_phone?: string;
        };
        Relationships: [];
      };
      activity_events: {
        Row: {
          created_at: string;
          event_type: string;
          id: number;
          metadata: Json | null;
          page_path: string | null;
          product_id: string | null;
          product_slug: string | null;
          retailer_id: string | null;
          source_channel: string | null;
        };
        Insert: {
          created_at?: string;
          event_type: string;
          id?: number;
          metadata?: Json | null;
          page_path?: string | null;
          product_id?: string | null;
          product_slug?: string | null;
          retailer_id?: string | null;
          source_channel?: string | null;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          id?: number;
          metadata?: Json | null;
          page_path?: string | null;
          product_id?: string | null;
          product_slug?: string | null;
          retailer_id?: string | null;
          source_channel?: string | null;
        };
        Relationships: [];
      };
      retailer_profiles: {
        Row: {
          first_seen_at: string;
          id: string;
          last_active_at: string;
          location: string | null;
          phone: string;
          retailer_status: string;
          source_channel: string | null;
          source_detail: string | null;
          store_name: string | null;
          verification_status: string;
        };
        Insert: {
          first_seen_at?: string;
          id: string;
          last_active_at?: string;
          location?: string | null;
          phone: string;
          retailer_status?: string;
          source_channel?: string | null;
          source_detail?: string | null;
          store_name?: string | null;
          verification_status?: string;
        };
        Update: {
          first_seen_at?: string;
          id?: string;
          last_active_at?: string;
          location?: string | null;
          phone?: string;
          retailer_status?: string;
          source_channel?: string | null;
          source_detail?: string | null;
          store_name?: string | null;
          verification_status?: string;
        };
        Relationships: [];
      };
      saved_products: {
        Row: {
          created_at: string;
          id: number;
          product_id: string;
          product_slug: string;
          retailer_id: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          product_id: string;
          product_slug: string;
          retailer_id: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          product_id?: string;
          product_slug?: string;
          retailer_id?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_website_order: {
        Args: {
          p_customer_name: string;
          p_idempotency_key: string;
          p_identity_hash: string;
          p_items: Json;
          p_whatsapp_phone: string;
        };
        Returns: Array<{
          created_at: string;
          duplicate: boolean;
          id: string;
          product_total_lkr: number;
          public_number: number;
        }>;
      };
    };
    Enums: {
      website_order_status: "new" | "confirmed" | "paid" | "completed" | "cancelled";
    };
    CompositeTypes: Record<string, never>;
  };
};
