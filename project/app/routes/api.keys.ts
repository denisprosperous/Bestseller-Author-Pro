import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { supabase } from "~/lib/supabase";
import { AuthService } from "~/services/auth-service";
import { encrypt as encryptWithIv, decrypt as decryptWithIv } from "~/lib/encryption";
import { assertRateLimit } from "~/lib/rate-limit";
import { logger } from "~/lib/logger";

// Server-side encryption configuration
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 16) {
  throw new Error("ENCRYPTION_KEY must be set to a strong secret string");
}

/**
 * Encrypt API key on server-side using IV-based AES-256-CBC
 */
function encryptApiKey(apiKey: string): { encrypted: string; iv: string } {
  const combined = encryptWithIv(apiKey); // format: ivHex:encryptedHex
  const [iv, encrypted] = combined.split(":");
  return { encrypted, iv };
}

/**
 * Decrypt API key on server-side using IV-based AES-256-CBC
 */
function decryptApiKey(encryptedData: { encrypted: string; iv: string }): string {
  const combined = `${encryptedData.iv}:${encryptedData.encrypted}`;
  return decryptWithIv(combined);
}

/**
 * Create Supabase client for server-side operations
 */
// Using shared Supabase client for server-side operations

/**
 * GET /api/keys - Retrieve user's API keys
 */
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const user = await AuthService.getCurrentUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      assertRateLimit(user.id, 'api-keys')
    } catch (e) {
      return Response.json({ error: 'Too Many Requests' }, { status: 429 })
    }

    // Fetch encrypted API keys from database
    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select('provider, encrypted_key, iv, created_at, updated_at')
      .eq('user_id', user.id);

    if (error) {
      console.error('Database error:', error);
      return Response.json({ error: "Failed to fetch API keys" }, { status: 500 });
    }

    // Return providers without decrypting keys (for security)
    const providers = apiKeys?.map(key => ({
      provider: key.provider,
      hasKey: true,
      createdAt: key.created_at,
      updatedAt: key.updated_at
    })) || [];

    return Response.json({ providers });
  } catch (error) {
    console.error('Server error:', error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/keys - Save or update API key
 */
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const user = await AuthService.getCurrentUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { provider, apiKey, action: keyAction } = body;

    if (!provider || !keyAction) {
      return Response.json({ error: "Provider and action are required" }, { status: 400 });
    }

    if (keyAction === 'save') {
      if (!apiKey) {
        return Response.json({ error: "API key is required for save action" }, { status: 400 });
      }

      // Validate API key format
      if (!isValidApiKeyFormat(provider, apiKey)) {
        return Response.json({ error: `Invalid API key format for ${provider}` }, { status: 400 });
      }

      // Encrypt the API key
      const { encrypted, iv } = encryptApiKey(apiKey);

      // Save to database with upsert
      const { error } = await supabase
        .from('api_keys')
        .upsert({
          user_id: user.id,
          provider,
          encrypted_key: encrypted,
          iv,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,provider'
        });

      if (error) {
        logger.error('Database error: upsert api_keys', error);
        return Response.json({ error: "Failed to save API key" }, { status: 500 });
      }

      return Response.json({ success: true, message: `API key for ${provider} saved successfully` });
    }

    if (keyAction === 'delete') {
      // Delete API key
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', provider);

      if (error) {
        console.error('Database error:', error);
        return Response.json({ error: "Failed to delete API key" }, { status: 500 });
      }

      return Response.json({ success: true, message: `API key for ${provider} deleted successfully` });
    }

    if (keyAction === 'get') {
      // Retrieve and decrypt API key for use
      const { data: apiKeyData, error } = await supabase
        .from('api_keys')
        .select('encrypted_key, iv')
        .eq('user_id', user.id)
        .eq('provider', provider)
        .single();

      if (error || !apiKeyData) {
        return Response.json({ error: `No API key found for ${provider}` }, { status: 404 });
      }

      try {
        const decryptedKey = decryptApiKey({
          encrypted: apiKeyData.encrypted_key,
          iv: apiKeyData.iv
        });
        return Response.json({ apiKey: decryptedKey });
      } catch (decryptError) {
        logger.error('Decryption error', decryptError);
        return Response.json({ error: "Failed to decrypt API key" }, { status: 500 });
      }
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error('Server error:', error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Validate API key format for different providers
 */
function isValidApiKeyFormat(provider: string, apiKey: string): boolean {
  if (!apiKey || apiKey.trim().length === 0) {
    return false;
  }

  apiKey = apiKey.trim();

  switch (provider) {
    case "openai":
      return apiKey.startsWith("sk-") && apiKey.length >= 20;
    case "anthropic":
      return apiKey.startsWith("sk-ant-") && apiKey.length >= 30;
    case "google":
      return apiKey.length >= 20 && /^[A-Za-z0-9_-]+$/.test(apiKey);
    case "xai":
      return apiKey.startsWith("xai-") && apiKey.length >= 20;
    case "deepseek":
      return apiKey.startsWith("hf_") && apiKey.length >= 20;
    default:
      return apiKey.length >= 10;
  }
}
