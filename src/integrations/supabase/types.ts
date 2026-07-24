export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      bookings: {
        Row: {
          agreed_price_cents: number | null;
          client_id: string;
          completed_at: string | null;
          created_at: string;
          id: string;
          job_id: string | null;
          match_id: string | null;
          notes: string | null;
          provider_id: string;
          scheduled_end: string | null;
          scheduled_start: string | null;
          service_id: string | null;
          status: string;
          updated_at: string;
        };
        Insert: {
          agreed_price_cents?: number | null;
          client_id: string;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          job_id?: string | null;
          match_id?: string | null;
          notes?: string | null;
          provider_id: string;
          scheduled_end?: string | null;
          scheduled_start?: string | null;
          service_id?: string | null;
          status?: string;
          updated_at?: string;
        };
        Update: {
          agreed_price_cents?: number | null;
          client_id?: string;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          job_id?: string | null;
          match_id?: string | null;
          notes?: string | null;
          provider_id?: string;
          scheduled_end?: string | null;
          scheduled_start?: string | null;
          service_id?: string | null;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      calendar_events: {
        Row: {
          created_at: string;
          ends_at: string;
          event_type: string;
          id: string;
          linked_job_id: string | null;
          linked_match_id: string | null;
          notes: string | null;
          owner_id: string;
          starts_at: string;
          title: string;
        };
        Insert: {
          created_at?: string;
          ends_at: string;
          event_type?: string;
          id?: string;
          linked_job_id?: string | null;
          linked_match_id?: string | null;
          notes?: string | null;
          owner_id: string;
          starts_at: string;
          title: string;
        };
        Update: {
          created_at?: string;
          ends_at?: string;
          event_type?: string;
          id?: string;
          linked_job_id?: string | null;
          linked_match_id?: string | null;
          notes?: string | null;
          owner_id?: string;
          starts_at?: string;
          title?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          parent_id: string | null;
          slug: string;
          sort_order: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          parent_id?: string | null;
          slug: string;
          sort_order?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          parent_id?: string | null;
          slug?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      certificate_issuances: {
        Row: {
          client_id: string | null;
          created_at: string;
          id: string;
          issued_at: string;
          merged_values: Json;
          owner_id: string;
          recipient_address: string | null;
          recipient_email: string | null;
          recipient_name: string;
          rendered_mime: string | null;
          rendered_path: string | null;
          sent_via: string | null;
          template_id: string;
        };
        Insert: {
          client_id?: string | null;
          created_at?: string;
          id?: string;
          issued_at?: string;
          merged_values?: Json;
          owner_id: string;
          recipient_address?: string | null;
          recipient_email?: string | null;
          recipient_name: string;
          rendered_mime?: string | null;
          rendered_path?: string | null;
          sent_via?: string | null;
          template_id: string;
        };
        Update: {
          client_id?: string | null;
          created_at?: string;
          id?: string;
          issued_at?: string;
          merged_values?: Json;
          owner_id?: string;
          recipient_address?: string | null;
          recipient_email?: string | null;
          recipient_name?: string;
          rendered_mime?: string | null;
          rendered_path?: string | null;
          sent_via?: string | null;
          template_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "certificate_issuances_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "certificate_issuances_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "certificate_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      certificate_templates: {
        Row: {
          created_at: string;
          default_values: Json;
          description: string | null;
          file_name: string;
          file_path: string;
          id: string;
          kind: string;
          merge_fields: Json;
          mime_type: string;
          owner_id: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          default_values?: Json;
          description?: string | null;
          file_name: string;
          file_path: string;
          id?: string;
          kind?: string;
          merge_fields?: Json;
          mime_type: string;
          owner_id: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          default_values?: Json;
          description?: string | null;
          file_name?: string;
          file_path?: string;
          id?: string;
          kind?: string;
          merge_fields?: Json;
          mime_type?: string;
          owner_id?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          address_line1: string | null;
          address_line2: string | null;
          city: string | null;
          country: string | null;
          created_at: string;
          email: string | null;
          id: string;
          name: string;
          notes: string | null;
          owner_id: string;
          phone: string | null;
          postal_code: string | null;
          updated_at: string;
          vat_id: string | null;
        };
        Insert: {
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          name: string;
          notes?: string | null;
          owner_id: string;
          phone?: string | null;
          postal_code?: string | null;
          updated_at?: string;
          vat_id?: string | null;
        };
        Update: {
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string;
          notes?: string | null;
          owner_id?: string;
          phone?: string | null;
          postal_code?: string | null;
          updated_at?: string;
          vat_id?: string | null;
        };
        Relationships: [];
      };
      contractors: {
        Row: {
          created_at: string;
          insurance_policy_number: string | null;
          insurance_provider: string | null;
          insurance_valid_until: string | null;
          license_number: string | null;
          rating_avg: number | null;
          rating_count: number;
          team_size: number | null;
          updated_at: string;
          user_id: string;
          verified: boolean;
          verified_at: string | null;
          years_experience: number | null;
        };
        Insert: {
          created_at?: string;
          insurance_policy_number?: string | null;
          insurance_provider?: string | null;
          insurance_valid_until?: string | null;
          license_number?: string | null;
          rating_avg?: number | null;
          rating_count?: number;
          team_size?: number | null;
          updated_at?: string;
          user_id: string;
          verified?: boolean;
          verified_at?: string | null;
          years_experience?: number | null;
        };
        Update: {
          created_at?: string;
          insurance_policy_number?: string | null;
          insurance_provider?: string | null;
          insurance_valid_until?: string | null;
          license_number?: string | null;
          rating_avg?: number | null;
          rating_count?: number;
          team_size?: number | null;
          updated_at?: string;
          user_id?: string;
          verified?: boolean;
          verified_at?: string | null;
          years_experience?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "contractors_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      finanz_settings: {
        Row: {
          connected_email: string | null;
          connected_email_provider: string | null;
          created_at: string;
          km_rate_cents: number;
          reserve_percent: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          connected_email?: string | null;
          connected_email_provider?: string | null;
          created_at?: string;
          km_rate_cents?: number;
          reserve_percent?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          connected_email?: string | null;
          connected_email_provider?: string | null;
          created_at?: string;
          km_rate_cents?: number;
          reserve_percent?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      homeowners: {
        Row: {
          created_at: string;
          preferred_contact: string | null;
          property_type: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          preferred_contact?: string | null;
          property_type?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          preferred_contact?: string | null;
          property_type?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "homeowners_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      invoices: {
        Row: {
          client_address: string | null;
          client_email: string | null;
          client_id: string | null;
          client_name: string | null;
          client_vat_id: string | null;
          created_at: string;
          document_type: string | null;
          due_at: string | null;
          fixed_amount: number | null;
          gross_total: number;
          hourly_rate: number | null;
          hours: number | null;
          id: string;
          issued_at: string | null;
          line_items: Json;
          mode: string | null;
          net_total: number;
          number: string | null;
          owner_id: string;
          paid_at: string | null;
          parent_invoice_number: string | null;
          sent_at: string | null;
          status: string;
          subtotal: number | null;
          summary: string | null;
          surcharge_holiday_pct: number | null;
          surcharge_night_pct: number | null;
          surcharge_total: number | null;
          surcharge_weekend_pct: number | null;
          updated_at: string;
          vat_amount: number | null;
          vat_rate: number | null;
        };
        Insert: {
          client_address?: string | null;
          client_email?: string | null;
          client_id?: string | null;
          client_name?: string | null;
          client_vat_id?: string | null;
          created_at?: string;
          document_type?: string | null;
          due_at?: string | null;
          fixed_amount?: number | null;
          gross_total?: number;
          hourly_rate?: number | null;
          hours?: number | null;
          id?: string;
          issued_at?: string | null;
          line_items?: Json;
          mode?: string | null;
          net_total?: number;
          number?: string | null;
          owner_id: string;
          paid_at?: string | null;
          parent_invoice_number?: string | null;
          sent_at?: string | null;
          status?: string;
          subtotal?: number | null;
          summary?: string | null;
          surcharge_holiday_pct?: number | null;
          surcharge_night_pct?: number | null;
          surcharge_total?: number | null;
          surcharge_weekend_pct?: number | null;
          updated_at?: string;
          vat_amount?: number | null;
          vat_rate?: number | null;
        };
        Update: {
          client_address?: string | null;
          client_email?: string | null;
          client_id?: string | null;
          client_name?: string | null;
          client_vat_id?: string | null;
          created_at?: string;
          document_type?: string | null;
          due_at?: string | null;
          fixed_amount?: number | null;
          gross_total?: number;
          hourly_rate?: number | null;
          hours?: number | null;
          id?: string;
          issued_at?: string | null;
          line_items?: Json;
          mode?: string | null;
          net_total?: number;
          number?: string | null;
          owner_id?: string;
          paid_at?: string | null;
          parent_invoice_number?: string | null;
          sent_at?: string | null;
          status?: string;
          subtotal?: number | null;
          summary?: string | null;
          surcharge_holiday_pct?: number | null;
          surcharge_night_pct?: number | null;
          surcharge_total?: number | null;
          surcharge_weekend_pct?: number | null;
          updated_at?: string;
          vat_amount?: number | null;
          vat_rate?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      jobs: {
        Row: {
          city: string | null;
          created_at: string;
          description: string | null;
          estimated_budget: number | null;
          id: string;
          language: string | null;
          location_zip: string | null;
          owner_id: string;
          status: string;
          title: string;
          trade: string | null;
          updated_at: string;
          urgency: string | null;
        };
        Insert: {
          city?: string | null;
          created_at?: string;
          description?: string | null;
          estimated_budget?: number | null;
          id?: string;
          language?: string | null;
          location_zip?: string | null;
          owner_id: string;
          status?: string;
          title: string;
          trade?: string | null;
          updated_at?: string;
          urgency?: string | null;
        };
        Update: {
          city?: string | null;
          created_at?: string;
          description?: string | null;
          estimated_budget?: number | null;
          id?: string;
          language?: string | null;
          location_zip?: string | null;
          owner_id?: string;
          status?: string;
          title?: string;
          trade?: string | null;
          updated_at?: string;
          urgency?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "jobs_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      match_invoices: {
        Row: {
          contractor_id: string;
          created_at: string;
          final_due_cents: number;
          id: string;
          match_id: string;
          net_amount_cents: number;
          paid_at: string | null;
          platform_fee_bps: number;
          promo_code: string | null;
          promotional_discount_cents: number;
          status: string;
        };
        Insert: {
          contractor_id: string;
          created_at?: string;
          final_due_cents?: number;
          id?: string;
          match_id: string;
          net_amount_cents?: number;
          paid_at?: string | null;
          platform_fee_bps?: number;
          promo_code?: string | null;
          promotional_discount_cents?: number;
          status?: string;
        };
        Update: {
          contractor_id?: string;
          created_at?: string;
          final_due_cents?: number;
          id?: string;
          match_id?: string;
          net_amount_cents?: number;
          paid_at?: string | null;
          platform_fee_bps?: number;
          promo_code?: string | null;
          promotional_discount_cents?: number;
          status?: string;
        };
        Relationships: [];
      };
      matches: {
        Row: {
          accepted_at: string | null;
          client_accepted_at: string | null;
          client_id: string;
          contractor_accepted_at: string | null;
          contractor_id: string;
          created_at: string;
          id: string;
          job_id: string;
          match_unlocked: boolean;
          status: string;
          unlocked_at: string | null;
          updated_at: string;
        };
        Insert: {
          accepted_at?: string | null;
          client_accepted_at?: string | null;
          client_id: string;
          contractor_accepted_at?: string | null;
          contractor_id: string;
          created_at?: string;
          id?: string;
          job_id: string;
          match_unlocked?: boolean;
          status?: string;
          unlocked_at?: string | null;
          updated_at?: string;
        };
        Update: {
          accepted_at?: string | null;
          client_accepted_at?: string | null;
          client_id?: string;
          contractor_accepted_at?: string | null;
          contractor_id?: string;
          created_at?: string;
          id?: string;
          job_id?: string;
          match_unlocked?: boolean;
          status?: string;
          unlocked_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "matches_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_contractor_id_fkey";
            columns: ["contractor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          body: string;
          booking_id: string | null;
          created_at: string;
          id: string;
          read_at: string | null;
          recipient_id: string;
          sender_id: string;
        };
        Insert: {
          body: string;
          booking_id?: string | null;
          created_at?: string;
          id?: string;
          read_at?: string | null;
          recipient_id: string;
          sender_id: string;
        };
        Update: {
          body?: string;
          booking_id?: string | null;
          created_at?: string;
          id?: string;
          read_at?: string | null;
          recipient_id?: string;
          sender_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      network_messages: {
        Row: {
          body: string;
          channel_type: string;
          created_at: string;
          id: string;
          read_at: string | null;
          sender_id: string;
          thread_id: string;
        };
        Insert: {
          body: string;
          channel_type?: string;
          created_at?: string;
          id?: string;
          read_at?: string | null;
          sender_id: string;
          thread_id: string;
        };
        Update: {
          body?: string;
          channel_type?: string;
          created_at?: string;
          id?: string;
          read_at?: string | null;
          sender_id?: string;
          thread_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "network_messages_thread_id_fkey";
            columns: ["thread_id"];
            isOneToOne: false;
            referencedRelation: "network_threads";
            referencedColumns: ["id"];
          },
        ];
      };
      network_thread_members: {
        Row: {
          created_at: string;
          thread_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          thread_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          thread_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "network_thread_members_thread_id_fkey";
            columns: ["thread_id"];
            isOneToOne: false;
            referencedRelation: "network_threads";
            referencedColumns: ["id"];
          },
        ];
      };
      network_threads: {
        Row: {
          created_at: string;
          created_by: string;
          id: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          id?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          id?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string;
          id: string;
          lead_id: string | null;
          payload: Json | null;
          read: boolean;
          recipient_id: string;
          score: number | null;
          title: string;
          type: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          id?: string;
          lead_id?: string | null;
          payload?: Json | null;
          read?: boolean;
          recipient_id: string;
          score?: number | null;
          title: string;
          type: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          id?: string;
          lead_id?: string | null;
          payload?: Json | null;
          read?: boolean;
          recipient_id?: string;
          score?: number | null;
          title?: string;
          type?: string;
        };
        Relationships: [];
      };
      profile_reports: {
        Row: {
          created_at: string;
          id: string;
          notes: string | null;
          reason: string;
          reported_id: string;
          reporter_id: string;
          status: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          notes?: string | null;
          reason: string;
          reported_id: string;
          reporter_id: string;
          status?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          notes?: string | null;
          reason?: string;
          reported_id?: string;
          reporter_id?: string;
          status?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          account_type: string | null;
          address_line1: string | null;
          address_line2: string | null;
          avatar_url: string | null;
          bank_account_holder: string | null;
          bank_bic: string | null;
          bank_iban: string | null;
          bank_name: string | null;
          bio: string | null;
          city: string | null;
          company_name: string | null;
          country: string | null;
          created_at: string;
          display_name: string | null;
          flagged: boolean;
          full_name: string | null;
          id: string;
          languages: string[] | null;
          min_project_size: number | null;
          phone: string | null;
          postal_code: string | null;
          service_radius_km: number | null;
          trades: string[] | null;
          updated_at: string;
        };
        Insert: {
          account_type?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          avatar_url?: string | null;
          bank_account_holder?: string | null;
          bank_bic?: string | null;
          bank_iban?: string | null;
          bank_name?: string | null;
          bio?: string | null;
          city?: string | null;
          company_name?: string | null;
          country?: string | null;
          created_at?: string;
          display_name?: string | null;
          flagged?: boolean;
          full_name?: string | null;
          id: string;
          languages?: string[] | null;
          min_project_size?: number | null;
          phone?: string | null;
          postal_code?: string | null;
          service_radius_km?: number | null;
          trades?: string[] | null;
          updated_at?: string;
        };
        Update: {
          account_type?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          avatar_url?: string | null;
          bank_account_holder?: string | null;
          bank_bic?: string | null;
          bank_iban?: string | null;
          bank_name?: string | null;
          bio?: string | null;
          city?: string | null;
          company_name?: string | null;
          country?: string | null;
          created_at?: string;
          display_name?: string | null;
          flagged?: boolean;
          full_name?: string | null;
          id?: string;
          languages?: string[] | null;
          min_project_size?: number | null;
          phone?: string | null;
          postal_code?: string | null;
          service_radius_km?: number | null;
          trades?: string[] | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      receipts: {
        Row: {
          amount_cents: number;
          category: string;
          created_at: string;
          file_mime: string | null;
          file_path: string | null;
          id: string;
          ocr_json: Json | null;
          owner_id: string;
          receipt_date: string;
          updated_at: string;
          vendor: string | null;
        };
        Insert: {
          amount_cents?: number;
          category?: string;
          created_at?: string;
          file_mime?: string | null;
          file_path?: string | null;
          id?: string;
          ocr_json?: Json | null;
          owner_id: string;
          receipt_date: string;
          updated_at?: string;
          vendor?: string | null;
        };
        Update: {
          amount_cents?: number;
          category?: string;
          created_at?: string;
          file_mime?: string | null;
          file_path?: string | null;
          id?: string;
          ocr_json?: Json | null;
          owner_id?: string;
          receipt_date?: string;
          updated_at?: string;
          vendor?: string | null;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          booking_id: string | null;
          client_id: string;
          comment: string | null;
          created_at: string;
          id: string;
          job_id: string | null;
          provider_id: string;
          rating: number;
        };
        Insert: {
          booking_id?: string | null;
          client_id: string;
          comment?: string | null;
          created_at?: string;
          id?: string;
          job_id?: string | null;
          provider_id: string;
          rating: number;
        };
        Update: {
          booking_id?: string | null;
          client_id?: string;
          comment?: string | null;
          created_at?: string;
          id?: string;
          job_id?: string | null;
          provider_id?: string;
          rating?: number;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_provider_id_fkey";
            columns: ["provider_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      services: {
        Row: {
          active: boolean;
          base_price_cents: number | null;
          category_id: string | null;
          created_at: string;
          currency: string;
          description: string | null;
          id: string;
          name: string;
          provider_id: string;
          trade: string | null;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          base_price_cents?: number | null;
          category_id?: string | null;
          created_at?: string;
          currency?: string;
          description?: string | null;
          id?: string;
          name: string;
          provider_id: string;
          trade?: string | null;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          base_price_cents?: number | null;
          category_id?: string | null;
          created_at?: string;
          currency?: string;
          description?: string | null;
          id?: string;
          name?: string;
          provider_id?: string;
          trade?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      staff_document_logs: {
        Row: {
          captured_via: string;
          file_name: string;
          id: string;
          kind: string;
          member_id: string | null;
          mime_type: string | null;
          owner_id: string;
          size_bytes: number | null;
          storage_path: string;
          uploaded_at: string;
        };
        Insert: {
          captured_via?: string;
          file_name: string;
          id?: string;
          kind?: string;
          member_id?: string | null;
          mime_type?: string | null;
          owner_id: string;
          size_bytes?: number | null;
          storage_path: string;
          uploaded_at?: string;
        };
        Update: {
          captured_via?: string;
          file_name?: string;
          id?: string;
          kind?: string;
          member_id?: string | null;
          mime_type?: string | null;
          owner_id?: string;
          size_bytes?: number | null;
          storage_path?: string;
          uploaded_at?: string;
        };
        Relationships: [];
      };
      staff_gps_pings: {
        Row: {
          accuracy: number | null;
          id: string;
          job: string | null;
          latitude: number;
          longitude: number;
          member_id: string;
          member_name: string | null;
          owner_id: string;
          recorded_at: string;
        };
        Insert: {
          accuracy?: number | null;
          id?: string;
          job?: string | null;
          latitude: number;
          longitude: number;
          member_id: string;
          member_name?: string | null;
          owner_id: string;
          recorded_at?: string;
        };
        Update: {
          accuracy?: number | null;
          id?: string;
          job?: string | null;
          latitude?: number;
          longitude?: number;
          member_id?: string;
          member_name?: string | null;
          owner_id?: string;
          recorded_at?: string;
        };
        Relationships: [];
      };
      staff_hours: {
        Row: {
          created_at: string;
          hours: number;
          id: string;
          job: string | null;
          location_accuracy_m: number | null;
          location_lat: number | null;
          location_lng: number | null;
          member_id: string;
          member_name: string | null;
          notes: string | null;
          owner_id: string;
          status: string;
          updated_at: string;
          work_date: string;
        };
        Insert: {
          created_at?: string;
          hours?: number;
          id?: string;
          job?: string | null;
          location_accuracy_m?: number | null;
          location_lat?: number | null;
          location_lng?: number | null;
          member_id: string;
          member_name?: string | null;
          notes?: string | null;
          owner_id: string;
          status?: string;
          updated_at?: string;
          work_date: string;
        };
        Update: {
          created_at?: string;
          hours?: number;
          id?: string;
          job?: string | null;
          location_accuracy_m?: number | null;
          location_lat?: number | null;
          location_lng?: number | null;
          member_id?: string;
          member_name?: string | null;
          notes?: string | null;
          owner_id?: string;
          status?: string;
          updated_at?: string;
          work_date?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          created_at: string;
          current_period_end: string | null;
          id: string;
          status: string;
          tier_level: string;
          trial_ends_at: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          current_period_end?: string | null;
          id?: string;
          status?: string;
          tier_level?: string;
          trial_ends_at?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          current_period_end?: string | null;
          id?: string;
          status?: string;
          tier_level?: string;
          trial_ends_at?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      team_members: {
        Row: {
          can_log_time: boolean;
          can_see_bank_details: boolean;
          can_see_financials: boolean;
          can_see_invoices: boolean;
          can_upload_photos: boolean;
          can_upload_receipts: boolean;
          created_at: string;
          email: string;
          extended_role: string | null;
          hourly_rate: number | null;
          id: string;
          invited_at: string;
          joined_at: string | null;
          member_user_id: string | null;
          name: string | null;
          owner_id: string;
          phone: string | null;
          status: string;
          team_role: string;
          updated_at: string;
        };
        Insert: {
          can_log_time?: boolean;
          can_see_bank_details?: boolean;
          can_see_financials?: boolean;
          can_see_invoices?: boolean;
          can_upload_photos?: boolean;
          can_upload_receipts?: boolean;
          created_at?: string;
          email: string;
          extended_role?: string | null;
          hourly_rate?: number | null;
          id?: string;
          invited_at?: string;
          joined_at?: string | null;
          member_user_id?: string | null;
          name?: string | null;
          owner_id: string;
          phone?: string | null;
          status?: string;
          team_role?: string;
          updated_at?: string;
        };
        Update: {
          can_log_time?: boolean;
          can_see_bank_details?: boolean;
          can_see_financials?: boolean;
          can_see_invoices?: boolean;
          can_upload_photos?: boolean;
          can_upload_receipts?: boolean;
          created_at?: string;
          email?: string;
          extended_role?: string | null;
          hourly_rate?: number | null;
          id?: string;
          invited_at?: string;
          joined_at?: string | null;
          member_user_id?: string | null;
          name?: string | null;
          owner_id?: string;
          phone?: string | null;
          status?: string;
          team_role?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      trips: {
        Row: {
          created_at: string;
          from_location: string | null;
          id: string;
          km: number;
          member_id: string | null;
          owner_id: string;
          purpose: string | null;
          to_location: string | null;
          trip_date: string;
        };
        Insert: {
          created_at?: string;
          from_location?: string | null;
          id?: string;
          km?: number;
          member_id?: string | null;
          owner_id: string;
          purpose?: string | null;
          to_location?: string | null;
          trip_date: string;
        };
        Update: {
          created_at?: string;
          from_location?: string | null;
          id?: string;
          km?: number;
          member_id?: string | null;
          owner_id?: string;
          purpose?: string | null;
          to_location?: string | null;
          trip_date?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      verifications: {
        Row: {
          created_at: string;
          file_name: string | null;
          file_path: string | null;
          id: string;
          kind: string;
          mime_type: string | null;
          ocr_json: Json | null;
          reviewer_notes: string | null;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          file_name?: string | null;
          file_path?: string | null;
          id?: string;
          kind: string;
          mime_type?: string | null;
          ocr_json?: Json | null;
          reviewer_notes?: string | null;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          file_name?: string | null;
          file_path?: string | null;
          id?: string;
          kind?: string;
          mime_type?: string | null;
          ocr_json?: Json | null;
          reviewer_notes?: string | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_network_thread_member: {
        Args: { _thread_id: string; _user_id: string };
        Returns: boolean;
      };
      is_verified_contractor: { Args: { _user_id: string }; Returns: boolean };
    };
    Enums: {
      app_role: "admin" | "moderator" | "user" | "contractor" | "homeowner";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user", "contractor", "homeowner"],
    },
  },
} as const;
