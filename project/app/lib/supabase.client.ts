/**
 * Supabase Client Configuration
 * Handles both browser and server-side connections
 */

import { createClient } from "@supabase/supabase-js";

// Get environment variables with proper fallbacks
const getSupabaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Check localStorage override first
    const storedUrl = localStorage.getItem('supabase_project_url');
    if (storedUrl) return storedUrl;

    // Browser environment - use VITE_ prefixed vars
    return import.meta.env.VITE_SUPABASE_PROJECT_URL || 
           "https://shzfuasxqqflrfiiwtpw.supabase.co";
  }
  // Server environment
  return process.env.SUPABASE_PROJECT_URL || 
         process.env.VITE_SUPABASE_PROJECT_URL ||
         "https://shzfuasxqqflrfiiwtpw.supabase.co";
};

const getSupabaseKey = () => {
  if (typeof window !== 'undefined') {
    // Check localStorage override first
    const storedKey = localStorage.getItem('supabase_anon_key');
    if (storedKey) return storedKey;

    // Browser environment - use VITE_ prefixed vars
    return import.meta.env.VITE_SUPABASE_API_KEY || 
           "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoemZ1YXN4cXFmbHJmaWl3dHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDg5ODgsImV4cCI6MjA4NTAyNDk4OH0.RX8qwWNX11rZhlAzlI4494-m6jldeWre_PkHcOKEi6s";
  }
  // Server environment
  return process.env.SUPABASE_API_KEY || 
         process.env.VITE_SUPABASE_API_KEY ||
         "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoemZ1YXN4cXFmbHJmaWl3dHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NDg5ODgsImV4cCI6MjA4NTAyNDk4OH0.RX8qwWNX11rZhlAzlI4494-m6jldeWre_PkHcOKEi6s";
};

const supabaseUrl = getSupabaseUrl();
const supabaseKey = getSupabaseKey();

// Create Supabase client with proper configuration
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  global: {
    headers: {
      'x-application-name': 'bestseller-author-pro'
    }
  }
});

// Helper to check if database is accessible
export async function isDatabaseAccessible(): Promise<boolean> {
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

// Helper to ensure user exists in database
export async function ensureUserExists(userId: string, email?: string): Promise<void> {
  try {
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existing) {
      await supabase.from('users').insert({
        id: userId,
        email: email || null
      });
    }
  } catch (error) {
    console.error('Error ensuring user exists:', error);
  }
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          created_at: string;
        };
      };
      api_keys: {
        Row: {
          id: string;
          user_id: string;
          provider: string;
          encrypted_key: string;
          created_at: string;
          updated_at: string;
        };
      };
      ebooks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          subtitle: string | null;
          topic: string;
          metadata: any;
          status: string;
          created_at: string;
          updated_at: string;
        };
      };
      chapters: {
        Row: {
          id: string;
          ebook_id: string;
          chapter_number: number;
          title: string;
          content: string;
          word_count: number;
          created_at: string;
          updated_at: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          brainstorm_data: any;
          builder_config: any;
          ebook_id: string | null;
          status: string;
          expires_at: string;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
}
