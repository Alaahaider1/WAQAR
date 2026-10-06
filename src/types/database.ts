// AUTO-GENERATED from supabase/migrations/20260705000000_initial_schema.sql
// Do not edit manually — regenerate by running: npx supabase gen types typescript --project-id ibwigplqdqydtoiasplt

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          role: string
          is_active: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          id: string
          user_id: string
          role: string
          granted_by: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role?: string
          granted_by?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          granted_by?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          image_url: string | null
          position: number
          is_active: boolean
          is_featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          description?: string | null
          image_url?: string | null
          position?: number
          is_active?: boolean
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          description?: string | null
          image_url?: string | null
          position?: number
          is_active?: boolean
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          id: string
          slug: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          created_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          slug: string
          name: string
          subtitle: string | null
          category_id: string
          description: string | null
          long_description: string | null
          ingredients: string | null
          base_price: number
          compare_at_price: number | null
          status: string
          is_best_seller: boolean
          is_new: boolean
          is_featured: boolean
          rating: number
          review_count: number
          seo_title: string | null
          seo_description: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          slug?: string
          name: string
          subtitle?: string | null
          category_id: string
          description?: string | null
          long_description?: string | null
          ingredients?: string | null
          base_price: number
          compare_at_price?: number | null
          status?: string
          is_best_seller?: boolean
          is_new?: boolean
          is_featured?: boolean
          rating?: number
          review_count?: number
          seo_title?: string | null
          seo_description?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          subtitle?: string | null
          category_id?: string
          description?: string | null
          long_description?: string | null
          ingredients?: string | null
          base_price?: number
          compare_at_price?: number | null
          status?: string
          is_best_seller?: boolean
          is_new?: boolean
          is_featured?: boolean
          rating?: number
          review_count?: number
          seo_title?: string | null
          seo_description?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          sku: string
          size: string
          concentration: string | null
          price: number
          compare_at_price: number | null
          is_default: boolean
          position: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          sku: string
          size: string
          concentration?: string | null
          price: number
          compare_at_price?: number | null
          is_default?: boolean
          position?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          sku?: string
          size?: string
          concentration?: string | null
          price?: number
          compare_at_price?: number | null
          is_default?: boolean
          position?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          url: string
          alt_text: string | null
          position: number
          cloudinary_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          url: string
          alt_text?: string | null
          position?: number
          cloudinary_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          url?: string
          alt_text?: string | null
          position?: number
          cloudinary_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      fragrance_notes: {
        Row: {
          id: string
          product_id: string
          type: string
          name: string
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          type: string
          name: string
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          type?: string
          name?: string
          position?: number
          created_at?: string
        }
        Relationships: []
      }
      product_tags: {
        Row: {
          product_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          product_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          product_id?: string
          tag_id?: string
          created_at?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          id: string
          variant_id: string
          stock_quantity: number
          reserved_quantity: number
          reorder_threshold: number
          allow_backorder: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          variant_id: string
          stock_quantity?: number
          reserved_quantity?: number
          reorder_threshold?: number
          allow_backorder?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          variant_id?: string
          stock_quantity?: number
          reserved_quantity?: number
          reorder_threshold?: number
          allow_backorder?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_movements: {
        Row: {
          id: string
          variant_id: string
          order_id: string | null
          quantity: number
          reason: string
          notes: string | null
          performed_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          variant_id: string
          order_id?: string | null
          quantity: number
          reason: string
          notes?: string | null
          performed_by?: string | null
          created_at?: string
        }
        Update: {
          [key: string]: never
        }
        Relationships: []
      }
      shipping_addresses: {
        Row: {
          id: string
          user_id: string
          full_name: string
          phone: string | null
          address_line_1: string
          address_line_2: string | null
          city: string
          state: string | null
          postal_code: string | null
          country_code: string
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          phone?: string | null
          address_line_1: string
          address_line_2?: string | null
          city: string
          state?: string | null
          postal_code?: string | null
          country_code: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          phone?: string | null
          address_line_1?: string
          address_line_2?: string | null
          city?: string
          state?: string | null
          postal_code?: string | null
          country_code?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      billing_addresses: {
        Row: {
          id: string
          user_id: string
          full_name: string
          phone: string | null
          address_line_1: string
          address_line_2: string | null
          city: string
          state: string | null
          postal_code: string | null
          country_code: string
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          phone?: string | null
          address_line_1: string
          address_line_2?: string | null
          city: string
          state?: string | null
          postal_code?: string | null
          country_code: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          phone?: string | null
          address_line_1?: string
          address_line_2?: string | null
          city?: string
          state?: string | null
          postal_code?: string | null
          country_code?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          id: string
          code: string
          description: string | null
          discount_type: string
          discount_value: number
          minimum_order_value: number
          maximum_discount: number | null
          usage_limit: number | null
          usage_count: number
          per_user_limit: number
          status: string
          valid_from: string
          valid_until: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          description?: string | null
          discount_type: string
          discount_value: number
          minimum_order_value?: number
          maximum_discount?: number | null
          usage_limit?: number | null
          usage_count?: number
          per_user_limit?: number
          status?: string
          valid_from?: string
          valid_until?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          minimum_order_value?: number
          maximum_discount?: number | null
          usage_limit?: number | null
          usage_count?: number
          per_user_limit?: number
          status?: string
          valid_from?: string
          valid_until?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      carts: {
        Row: {
          id: string
          user_id: string | null
          session_token: string | null
          coupon_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          session_token?: string | null
          coupon_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          session_token?: string | null
          coupon_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          id: string
          cart_id: string
          variant_id: string
          quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cart_id: string
          variant_id: string
          quantity?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cart_id?: string
          variant_id?: string
          quantity?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          order_number: string
          proof_access_token: string
          checkout_attempt_id: string | null
          checkout_payload_fingerprint: string | null
          user_id: string | null
          status: string
          payment_status: string
          subtotal: number
          discount_amount: number
          shipping_amount: number
          tax_amount: number
          total: number
          currency: string
          coupon_id: string | null
          coupon_code: string | null
          shipping_address: Json
          billing_address: Json | null
          shipping_method: string | null
          tracking_number: string | null
          tracking_url: string | null
          estimated_delivery: string | null
          shipped_at: string | null
          delivered_at: string | null
          customer_notes: string | null
          admin_notes: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number?: string
          proof_access_token?: string
          checkout_attempt_id?: string | null
          checkout_payload_fingerprint?: string | null
          user_id?: string | null
          status?: string
          payment_status?: string
          subtotal: number
          discount_amount?: number
          shipping_amount?: number
          tax_amount?: number
          total: number
          currency?: string
          coupon_id?: string | null
          coupon_code?: string | null
          shipping_address: Json
          billing_address?: Json | null
          shipping_method?: string | null
          tracking_number?: string | null
          tracking_url?: string | null
          estimated_delivery?: string | null
          shipped_at?: string | null
          delivered_at?: string | null
          customer_notes?: string | null
          admin_notes?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          proof_access_token?: string
          checkout_attempt_id?: string | null
          checkout_payload_fingerprint?: string | null
          user_id?: string | null
          status?: string
          payment_status?: string
          subtotal?: number
          discount_amount?: number
          shipping_amount?: number
          tax_amount?: number
          total?: number
          currency?: string
          coupon_id?: string | null
          coupon_code?: string | null
          shipping_address?: Json
          billing_address?: Json | null
          shipping_method?: string | null
          tracking_number?: string | null
          tracking_url?: string | null
          estimated_delivery?: string | null
          shipped_at?: string | null
          delivered_at?: string | null
          customer_notes?: string | null
          admin_notes?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_status_history: {
        Row: {
          id: string
          order_id: string
          from_status: string | null
          to_status: string
          changed_by: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          from_status?: string | null
          to_status: string
          changed_by?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          [key: string]: never
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          variant_id: string | null
          product_id: string | null
          product_name: string
          variant_sku: string
          variant_size: string
          image_url: string | null
          unit_price: number
          quantity: number
          total_price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          variant_id?: string | null
          product_id?: string | null
          product_name: string
          variant_sku: string
          variant_size: string
          image_url?: string | null
          unit_price: number
          quantity: number
          total_price: number
          created_at?: string
        }
        Update: {
          [key: string]: never
        }
        Relationships: []
      }
      coupon_usages: {
        Row: {
          id: string
          coupon_id: string
          order_id: string
          user_id: string | null
          discount_applied: number
          created_at: string
        }
        Insert: {
          id?: string
          coupon_id: string
          order_id: string
          user_id?: string | null
          discount_applied: number
          created_at?: string
        }
        Update: {
          [key: string]: never
        }
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          order_id: string
          provider: string
          status: string
          amount: number
          currency: string
          provider_reference: string | null
          provider_response: Json | null
          failure_reason: string | null
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          provider: string
          status?: string
          amount: number
          currency?: string
          provider_reference?: string | null
          provider_response?: Json | null
          failure_reason?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          provider?: string
          status?: string
          amount?: number
          currency?: string
          provider_reference?: string | null
          provider_response?: Json | null
          failure_reason?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          id: string
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          id: string
          wishlist_id: string
          product_id: string
          created_at: string
        }
        Insert: {
          id?: string
          wishlist_id: string
          product_id: string
          created_at?: string
        }
        Update: {
          [key: string]: never
        }
        Relationships: []
      }
      reviews: {
        Row: {
          id: string
          product_id: string
          user_id: string
          order_id: string | null
          rating: number
          title: string | null
          body: string | null
          status: string
          helpful_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id: string
          order_id?: string | null
          rating?: number
          title?: string | null
          body?: string | null
          status?: string
          helpful_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string
          order_id?: string | null
          rating?: number
          title?: string | null
          body?: string | null
          status?: string
          helpful_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ugc_videos: {
        Row: {
          id: string
          video_url: string
          storage_path: string
          customer_name: string | null
          caption: string | null
          position: number
          is_visible: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          video_url: string
          storage_path: string
          customer_name?: string | null
          caption?: string | null
          position?: number
          is_visible?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          video_url?: string
          storage_path?: string
          customer_name?: string | null
          caption?: string | null
          position?: number
          is_visible?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      customer_feedback_images: {
        Row: {
          id: string
          image_url: string
          storage_path: string
          position: number
          is_visible: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          image_url: string
          storage_path: string
          position?: number
          is_visible?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          image_url?: string
          storage_path?: string
          position?: number
          is_visible?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      review_votes: {
        Row: {
          id: string
          review_id: string
          user_id: string
          is_helpful: boolean
          created_at: string
        }
        Insert: {
          id?: string
          review_id: string
          user_id: string
          is_helpful: boolean
          created_at?: string
        }
        Update: {
          [key: string]: never
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          id: string
          email: string
          status: string
          source: string | null
          ip_address: string | null
          created_at: string
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          id?: string
          email: string
          status?: string
          source?: string | null
          ip_address?: string | null
          created_at?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          status?: string
          source?: string | null
          ip_address?: string | null
          created_at?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          id: string
          user_id: string | null
          name: string
          email: string
          subject: string | null
          message: string
          status: string
          admin_notes: string | null
          ip_address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          email: string
          subject?: string | null
          message: string
          status?: string
          admin_notes?: string | null
          ip_address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          email?: string
          subject?: string | null
          message?: string
          status?: string
          admin_notes?: string | null
          ip_address?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          admin_id: string | null
          action: string
          table_name: string
          record_id: string
          old_data: Json | null
          new_data: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          [key: string]: never
        }
        Update: {
          [key: string]: never
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          value: Json
          description: string | null
          is_public: boolean
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          key: string
          value: Json
          description?: string | null
          is_public?: boolean
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          key?: string
          value?: Json
          description?: string | null
          is_public?: boolean
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      storefront_products: {
        Row: {
          id: string
          slug: string
          name: string
          subtitle: string | null
          description: string | null
          long_description: string | null
          ingredients: string | null
          base_price: number
          compare_at_price: number | null
          is_best_seller: boolean
          is_new: boolean
          is_featured: boolean
          rating: number
          review_count: number
          created_at: string
          category_id: string
          category_slug: string
          category_name: string
          primary_image_url: string | null
          primary_image_alt: string | null
          default_variant_id: string | null
          default_variant_sku: string | null
          default_variant_size: string | null
          default_variant_price: number | null
          available_quantity: number
          allow_backorder: boolean
        }
        Relationships: []
      }
      admin_order_summary: {
        Row: {
          id: string
          order_number: string
          status: string
          payment_status: string
          subtotal: number
          discount_amount: number
          shipping_amount: number
          tax_amount: number
          total: number
          currency: string
          coupon_code: string | null
          shipping_method: string | null
          tracking_number: string | null
          created_at: string
          shipped_at: string | null
          delivered_at: string | null
          customer_id: string | null
          customer_name: string | null
          customer_email: string | null
          item_count: number
          payment_provider: string | null
          shipping_provider: string | null
          shipment_id: string | null
          shipping_status: string | null
        }
        Relationships: []
      }
      admin_inventory_status: {
        Row: {
          variant_id: string
          sku: string
          size: string
          concentration: string | null
          price: number
          variant_active: boolean
          product_id: string
          product_slug: string
          product_name: string
          product_status: string
          stock_quantity: number
          reserved_quantity: number
          available_quantity: number
          reorder_threshold: number
          allow_backorder: boolean
          is_out_of_stock: boolean
          is_low_stock: boolean
        }
        Relationships: []
      }
      admin_revenue_overview: {
        Row: {
          total_orders: number | null
          total_revenue: number | null
          avg_order_value: number | null
          orders_last_30d: number | null
          revenue_last_30d: number | null
          orders_last_7d: number | null
          revenue_last_7d: number | null
          pending_orders: number | null
          processing_orders: number | null
          shipped_orders: number | null
          delivered_orders: number | null
          cancelled_orders: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      place_guest_checkout_order: {
        Args: {
          p_checkout_attempt_id: string
          p_first_name: string
          p_last_name: string
          p_phone: string
          p_address: string
          p_apt: string
          p_city: string
          p_state: string
          p_zip: string
          p_country: string
          p_payment_method: string
          p_items: Json
          p_payload_fingerprint: string
        }
        Returns: {
          order_id: string
          order_number: string
          proof_access_token: string
          total: number
          payment_method: string
        }[]
      }
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      slugify: {
        Args: { input: string }
        Returns: string
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

// Helper types — mirror what Supabase CLI generates
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Views<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
// Row type aliases — for use in repositories
export type ProfileRow               = Tables<'profiles'>
export type AdminUserRow             = Tables<'admin_users'>
export type CategoryRow              = Tables<'categories'>
export type TagRow                   = Tables<'tags'>
export type ProductRow               = Tables<'products'>
export type ProductVariantRow        = Tables<'product_variants'>
export type ProductImageRow          = Tables<'product_images'>
export type FragranceNoteRow         = Tables<'fragrance_notes'>
export type ProductTagRow            = Tables<'product_tags'>
export type InventoryRow             = Tables<'inventory'>
export type InventoryMovementRow     = Tables<'inventory_movements'>
export type ShippingAddressRow       = Tables<'shipping_addresses'>
export type BillingAddressRow        = Tables<'billing_addresses'>
export type CouponRow                = Tables<'coupons'>
export type CartRow                  = Tables<'carts'>
export type CartItemRow              = Tables<'cart_items'>
export type OrderRow                 = Tables<'orders'>
export type OrderItemRow             = Tables<'order_items'>
export type OrderStatusHistoryRow    = Tables<'order_status_history'>
export type CouponUsageRow           = Tables<'coupon_usages'>
export type PaymentRow               = Tables<'payments'>
export type WishlistRow              = Tables<'wishlists'>
export type WishlistItemRow          = Tables<'wishlist_items'>
export type ReviewRow                = Tables<'reviews'>
export type UgcVideoRow              = Tables<'ugc_videos'>
export type CustomerFeedbackImageRow  = Tables<'customer_feedback_images'>
export type ReviewVoteRow            = Tables<'review_votes'>
export type NewsletterSubscriberRow  = Tables<'newsletter_subscribers'>
export type ContactMessageRow        = Tables<'contact_messages'>
export type AuditLogRow              = Tables<'audit_logs'>
export type SiteSettingRow           = Tables<'site_settings'>

// View row types
export type StorefrontProductRow     = Views<'storefront_products'>
export type AdminOrderSummaryRow     = Views<'admin_order_summary'>
export type AdminInventoryStatusRow  = Views<'admin_inventory_status'>

// Enum-style string literals (matching CHECK constraints in schema)
export type UserRole                 = 'customer' | 'admin' | 'super_admin'
export type ProductStatus            = 'draft' | 'published' | 'archived'
export type OrderStatus              = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
export type PaymentStatus            = 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded'
export type PaymentAttemptStatus     = 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' | 'refunded'
export type PaymentProvider          = 'stripe' | 'paypal' | 'vodafone_cash' | 'etisalat_cash' | 'orange_cash' | 'we_pay' | 'instapay' | 'cash_on_delivery' | 'other'
export type CouponStatus             = 'active' | 'draft' | 'expired' | 'disabled'
export type DiscountType             = 'percentage' | 'fixed'
export type ReviewStatus             = 'pending' | 'approved' | 'rejected' | 'hidden'
export type FragranceNoteType        = 'top' | 'heart' | 'base'
export type NewsletterStatus         = 'active' | 'unsubscribed' | 'bounced'
export type ContactMessageStatus     = 'unread' | 'read' | 'replied' | 'archived'
export type AuditAction              = 'insert' | 'update' | 'delete'
export type InventoryMovementReason  = 'sale' | 'return' | 'adjustment' | 'restock' | 'reservation' | 'reservation_released' | 'reservation_confirmed' | 'damage' | 'correction'
