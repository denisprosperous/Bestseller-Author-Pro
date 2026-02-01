import { createClient } from "@supabase/supabase-js";

// Supabase configuration - use import.meta.env for Vite
// Try both VITE_ prefixed and non-prefixed versions
const supabaseUrl = 
  import.meta.env.VITE_SUPABASE_PROJECT_URL || 
  import.meta.env.SUPABASE_PROJECT_URL ||
  "https://shzfuasxqqflrfiiwtpw.supabase.co"; // Fallback to known value

const supabaseKey = 
  import.meta.env.VITE_SUPABASE_API_KEY || 
  import.meta.env.SUPABASE_API_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoemZ1YXN4cXFmbHJmaWl3dHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc5NzE5NzQsImV4cCI6MjA1MzU0Nzk3NH0.uIWafl14qsPPffW5dOLBHQ_ObSLTB7V"; // Fallback to known value

// Log configuration status
console.log('✅ Supabase: Connected to', supabaseUrl);

// Create client
export const supabase = createClient(
  supabaseUrl, 
  supabaseKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    }
  }
);

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
