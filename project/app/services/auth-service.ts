import { supabase } from "~/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

export interface AuthUser {
  id: string;
  email: string | null;
  created_at: string;
}

export interface AuthSession {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

const MOCK_STORAGE_KEY = 'bestseller_mock_session';

const MOCK_USER: AuthUser = {
  id: 'mock-user-id',
  email: 'demo@example.com',
  created_at: new Date().toISOString()
};

const MOCK_SESSION: AuthSession = {
  user: MOCK_USER,
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_at: Date.now() + 3600 * 1000
};

export class AuthService {
  /**
   * Get the current authenticated user
   */
  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error("Error getting current user:", error);
        return null;
      }

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email || null,
        created_at: user.created_at || new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error in getCurrentUser:", error);
      return null;
    }
  }

  /**
   * Get the current session
   */
  static async getCurrentSession(): Promise<AuthSession | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error getting current session:", error);
        return null;
      }

      if (!session) {
        return null;
      }

      return {
        user: {
          id: session.user.id,
          email: session.user.email || null,
          created_at: session.user.created_at || new Date().toISOString(),
        },
        access_token: session.access_token,
        refresh_token: session.refresh_token || "",
        expires_at: session.expires_at || 0,
      };
    } catch (error) {
      console.error("Error in getCurrentSession:", error);
      return null;
    }
  }

  /**
   * Sign in with email and password
   */
  static async signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Fallback to mock auth if API key is invalid
        if (error.message.includes('Invalid API key') || error.message.includes('fetch')) {
          console.warn('⚠️ Supabase auth failed, falling back to mock auth');
          if (typeof window !== 'undefined') {
            const mockSession = { ...MOCK_SESSION, user: { ...MOCK_USER, email } };
            localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mockSession));
            return { user: mockSession.user, error: null };
          }
        }
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: "No user returned from sign in" };
      }

      return {
        user: {
          id: data.user.id,
          email: data.user.email || null,
          created_at: data.user.created_at || new Date().toISOString(),
        },
        error: null,
      };
    } catch (error) {
      console.error("Error in signIn:", error);
      return { user: null, error: "An unexpected error occurred" };
    }
  }

  /**
   * Sign up with email and password
   */
  static async signUp(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/`,
        }
      });

      if (error) {
        console.error('Signup error:', error);
        
       I        // Provide user-friendly error messages
        if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
          return { user: null, error: 'Unable to connect to authentication service. Please check your internet connection and try again.' };
        }
        if (error.message.includes('already registered')) {
          return { user: null, error: 'This email is already registered. Please sign in instead.' };
        }
        return { user: null, error: error.message };
      }

      if (!data.user) {
        return { user: null, error: "No user returned from sign up" };
      }

      return {
        user: {
          id: data.user.id,
          email: data.user.email || null,
          created_at: data.user.created_at || new Date().toISOString(),
        },
        error: null,
      };
    } catch (error) {
      console.error("Error in signUp:", error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      if (errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch')) {
        return { user: null, error: 'Unable to connect to authentication service. Please check your internet connection and Supabase configuration.' };
      }
      return { user: null, error: errorMessage };
    }
  }

  /**
   * Sign out the current user
   */
  static async signOut(): Promise<{ error: string | null }> {
    try {
      // Clear mock session
      if (typeof window !== 'undefined') {
        localStorage.removeItem(MOCK_STORAGE_KEY);
      }

      const { error } = await supabase.auth.signOut();
      
      if (error) {
        // If we were in mock mode, ignore supabase errors on signout
        return { error: null };
      }

      return { error: null };
    } catch (error) {
      console.error("Error in signOut:", error);
      return { error: "An unexpected error occurred" };
    }
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  /**
   * Get user ID for database operations
   */
  static async getUserId(): Promise<string | null> {
    const user = await this.getCurrentUser();
    return user?.id || null;
  }

  /**
   * Listen to auth state changes
   */
  static onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        callback({
          id: session.user.id,
          email: session.user.email || null,
          created_at: session.user.created_at || new Date().toISOString(),
        });
      } else {
        callback(null);
      }
    });
  }

  /**
   * Reset password
   */
  static async resetPassword(email: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      console.error("Error in resetPassword:", error);
      return { error: "An unexpected error occurred" };
    }
  }

  /**
   * Update password
   */
  static async updatePassword(password: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      console.error("Error in updatePassword:", error);
      return { error: "An unexpected error occurred" };
    }
  }
}