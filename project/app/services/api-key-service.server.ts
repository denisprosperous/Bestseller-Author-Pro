import { supabase } from "~/lib/supabase";
import { encrypt, decrypt } from "~/lib/encryption";

export interface ApiKey {
  id: string;
  user_id: string;
  provider: string;
  created_at: string;
}

export const apiKeyService = {
  /**
   * Get all API keys for a user (metadata only)
   */
  async getAllApiKeys(userId: string): Promise<ApiKey[]> {
    const { data, error } = await supabase
      .from("api_keys")
      .select("id, user_id, provider, created_at")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching API keys:", error);
      return [];
    }

    return data || [];
  },

  /**
   * Get decrypted API key for a provider
   */
  async getApiKey(userId: string, provider: string): Promise<string | null> {
    const { data, error } = await supabase
      .from("api_keys")
      .select("encrypted_key, iv")
      .eq("user_id", userId)
      .eq("provider", provider)
      .single();

    if (error || !data) {
      return null;
    }

    try {
      const encryptedData = `${data.iv}:${data.encrypted_key}`;
      return decrypt(encryptedData);
    } catch (err) {
      console.error(`Error decrypting API key for ${provider}:`, err);
      return null;
    }
  },

  /**
   * Save or update an API key
   */
  async saveApiKey(userId: string, provider: string, keyValue: string): Promise<void> {
    const encryptedResult = encrypt(keyValue);
    const [iv, encrypted_key] = encryptedResult.split(":");

    const { error } = await supabase
      .from("api_keys")
      .upsert(
        {
          user_id: userId,
          provider,
          encrypted_key,
          iv,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,provider" }
      );

    if (error) {
      throw new Error(`Failed to save API key: ${error.message}`);
    }
  },

  /**
   * Delete an API key
   */
  async deleteApiKey(userId: string, provider: string): Promise<void> {
    const { error } = await supabase
      .from("api_keys")
      .delete()
      .eq("user_id", userId)
      .eq("provider", provider);

    if (error) {
      throw new Error(`Failed to delete API key: ${error.message}`);
    }
  }
};
