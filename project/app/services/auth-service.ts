import { supabase } from "~/lib/supabase";

export const AuthService = {
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async getUserId() {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id;
  },
  
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { user: null, error: error.message };
    }
    return { user: data.user, error: null };
  },
  
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      return { user: null, error: error.message };
    }
    return { user: data.user, error: null };
  },
  
  async signOut() {
    await supabase.auth.signOut();
  }
};
