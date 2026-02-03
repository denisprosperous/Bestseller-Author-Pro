import { createClient } from "@supabase/supabase-js";

// Supabase configuration - REAL PROJECT REQUIRED FOR PRODUCTION
let supabaseUrl = import.meta.env.VITE_SUPABASE_PROJECT_URL ?? process.env.SUPABASE_PROJECT_URL;
let supabaseKey = import.meta.env.VITE_SUPABASE_API_KEY ?? process.env.SUPABASE_API_KEY;

// Allow placeholder values for development/testing
let isPlaceholder = supabaseUrl?.includes("placeholder") || supabaseKey?.includes("placeholder");

if (!supabaseUrl || !supabaseKey) {
  if (import.meta.env.PROD) {
    throw new Error(`
      Missing Supabase environment variables!
      
      Please set up your real Supabase project:
      1. Go to https://supabase.com/dashboard
      2. Create a new project
      3. Get your Project URL and API Key from Settings > API
      4. Set environment variables:
         VITE_SUPABASE_PROJECT_URL=https://your-project-id.supabase.co
         VITE_SUPABASE_API_KEY=your-anon-key-here
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
