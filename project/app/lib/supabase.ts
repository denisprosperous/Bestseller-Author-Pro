import { createClient } from "@supabase/supabase-js";

// Supabase configuration - REAL PROJECT REQUIRED FOR PRODUCTION
let supabaseUrl = import.meta.env.VITE_SUPABASE_PROJECT_URL ?? process.env.SUPABASE_PROJECT_URL;
let supabaseKey = import.meta.env.VITE_SUPABASE_API_KEY ?? process.env.SUPABASE_API_KEY;

// Allow placeholder values for development/testing
let isPlaceholder = supabaseUrl?.includes("placeholder") || supabaseKey?.includes("placeholder");

if (!supabaseUrl || !supabaseKey) {
  // In production, we log a warning but don't crash immediately.
  // This allows the app to start and render UI, though DB features will fail.
  if (import.meta.env.PROD) {
    console.warn(`
      WARNING: Missing Supabase environment variables!
      Database features will not work.
      Please set VITE_SUPABASE_PROJECT_URL and VITE_SUPABASE_API_KEY.
    `);
  }

  supabaseUrl = "https://placeholder.supabase.co";
  supabaseKey = "placeholder";
  isPlaceholder = true;
}

// Create client with placeholder handling
export const supabase = createClient(
  supabaseUrl, 
  supabaseKey,
  {
    auth: {
      // Disable auth persistence for placeholder mode
      persistSession: !isPlaceholder,
      autoRefreshToken: !isPlaceholder,
    }
  }
);

// Export placeholder status for conditional features
export const isUsingPlaceholders = isPlaceholder;

export interface Database {
  public: {
    Tables: {
      api_keys: {
        Row: {
          id: string;
          user_id: string;
          provider: string;
          encrypted_key: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: string;
          encrypted_key: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          provider?: string;
          encrypted_key?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
