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
  
  async signOut() {
    await supabase.auth.signOut();
  }
};
