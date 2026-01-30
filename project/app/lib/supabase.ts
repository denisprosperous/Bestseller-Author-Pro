import { createClient } from "@supabase/supabase-js";
import { DEMO_MODE } from "./demo-mode";

// Supabase configuration - use import.meta.env for Vite
// In demo mode, use placeholder values to avoid errors
const supabaseUrl = DEMO_MODE 
  ? "https://placeholder.supabase.co" 
  : (import.meta.env.VITE_SUPABASE_PROJECT_URL || "https://placeholder.supabase.co");

const supabaseKey = DEMO_MODE 
  ? "placeholder-key" 
  : (import.meta.env.VITE_SUPABASE_API_KEY || "placeholder-key");

// Allow placeholder values for development/testing
const isPlaceholder = supabaseUrl?.includes('placeholder') || supabaseKey?.includes('placeholder') || DEMO_MODE;

// Only throw error in production mode when not using placeholders
if (!DEMO_MODE && (!supabaseUrl || !supabaseKey || isPlaceholder)) {
  console.warn(`
    Missing Supabase environment variables!
    
    Please set up your real Supabase project:
    1. Go to https://supabase.com/dashboard
    2. Create a new project
    3. Get your Project URL and API Key from Settings > API
    4. Add them to your .env file:
       VITE_SUPABASE_PROJECT_URL=https://your-project-id.supabase.co
       VITE_SUPABASE_API_KEY=your-anon-key-here
       
    Running in DEMO MODE for now.
  `);
}

// Create client with placeholder handling
export const supabase = createClient(
  supabaseUrl, 
  supabaseKey,
  {
    auth: {
      // Disable auth persistence for placeholder/demo mode
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
