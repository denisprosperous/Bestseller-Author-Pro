import { supabase } from "~/lib/supabase";
import { DEMO_MODE, DEMO_USER } from "~/lib/demo-mode";
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

export class AuthService {
  /**
   * Get the current authenticated user
   */
  static async getCurrentUser(): Promise<AuthUser | null> {
    // Demo mode - return demo user
    if (DEMO_MODE) {
      return DEMO_USER;
    }

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
    // Demo mode - return demo session
    if (DEMO_MODE) {
      return {
        user: DEMO_USER,
        access_token: "demo-access-token",
        refresh_token: "demo-refresh-token",
        expires_at: Date.now() + 3600000 // 1 hour from now
      };
    }

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
    // Demo mode - simulate successful login
    if (DEMO_MODE) {
      return {
        user: DEMO_USER,
        error: null
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
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
    // Demo mode - simulate successful signup
    if (DEMO_MODE) {
      return {
        user: DEMO_USER,
        error: null
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
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
      return { user: null, error: "An unexpected error occurred" };
    }
  }

  /**
   * Sign out the current user
   */
  static async signOut(): Promise<{ error: string | null }> {
    // Demo mode - simulate successful signout
    if (DEMO_MODE) {
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { error: error.message };
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
    // Demo mode - immediately call with demo user
    if (DEMO_MODE) {
      callback(DEMO_USER);
      return { data: { subscription: null } };
    }

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
    // Demo mode - simulate successful reset
    if (DEMO_MODE) {
      return { error: null };
    }

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
    // Demo mode - simulate successful update
    if (DEMO_MODE) {
      return { error: null };
    }

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