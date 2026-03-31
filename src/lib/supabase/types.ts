export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
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
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
