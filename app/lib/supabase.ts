import { createClient } from "@supabase/supabase-js";

// Supabase configuration - use import.meta.env for Vite
// Try both VITE_ prefixed and non-prefixed versions
const getSupabaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Check localStorage override first
    const storedUrl = localStorage.getItem('supabase_project_url');
    if (storedUrl) return storedUrl;
  }
  
  // Safe access to environment variables
  const env = import.meta.env || process.env || {};
  
  return env.VITE_SUPABASE_PROJECT_URL || 
    env.SUPABASE_PROJECT_URL ||
    "https://shzfuasxqqflrfiiwtpw.supabase.co"; // Fallback to known value
};

const getSupabaseKey = () => {
  if (typeof window !== 'undefined') {
    // Check localStorage override first
    const storedKey = localStorage.getItem('supabase_anon_key');
    if (storedKey) return storedKey;
  }
  
  // Safe access to environment variables
  const env = import.meta.env || process.env || {};
  
  return env.VITE_SUPABASE_API_KEY || 
    env.SUPABASE_API_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoemZ1YXN4cXFmbHJmaWl3dHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDg5ODgsImV4cCI6MjA4NTAyNDk4OH0.RX8qwWNX11rZhlAzlI4494-m6jldeWre_PkHcOKEi6s"; // Fallback to known value
};

const supabaseUrl = getSupabaseUrl();
const supabaseKey = getSupabaseKey();

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
