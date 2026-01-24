import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { createServerClient } from "@supabase/ssr";
import crypto from "crypto";

// Server-side encryption configuration
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-cbc';

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
  throw new Error('ENCRYPTION_KEY must be a 64-character hex string');
}

/**
 * Encrypt API key on server-side
 */
function encryptApiKey(apiKey: string): { encrypted: string; iv: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'));
  
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return {
    encrypted,
    iv: iv.toString('hex')
  };
}

/**
 * Decrypt API key on server-side
 */
function decryptApiKey(encryptedData: { encrypted: string; iv: string }): string {
  const decipher = crypto.createDecipher(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Create Supabase client for server-side operations
 */
function createSupabaseClient(request: Request) {
  return createServerClient(
    process.env.SUPABASE_PROJECT_URL!,
    process.env.SUPABASE_API_KEY!,
    {
      cookies: {
        getAll() {
          return request.headers.get("Cookie")
            ?.split(";")
            .map((cookie) => {
              const [name, value] = cookie.trim().split("=");
              return { name, value };
            }) ?? [];
        },
        setAll(cookiesToSet) {
          // In a real app, you'd set response headers here
          // For now, we'll handle this in the response
        },
      },
    }
  );
}

/**
 * GET /api/keys - Retrieve user's API keys
 */
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const supabase = createSupabaseClient(request);
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch encrypted API keys from database
    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select('provider, encrypted_key, iv, created_at, updated_at')
      .eq('user_id', user.id);

    if (error) {
      console.error('Database error:', error);
      return json({ error: "Failed to fetch API keys" }, { status: 500 });
    }

    // Return providers without decrypting keys (for security)
    const providers = apiKeys?.map(key => ({
      provider: key.provider,
      hasKey: true,
      createdAt: key.created_at,
      updatedAt: key.updated_at
    })) || [];

    return json({ providers });
  } catch (error) {
    console.error('Server error:', error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/keys - Save or update API key
 */
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const supabase = createSupabaseClient(request);
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { provider, apiKey, action: keyAction } = body;

    if (!provider || !keyAction) {
      return json({ error: "Provider and action are required" }, { status: 400 });
    }

    if (keyAction === 'save') {
      if (!apiKey) {
        return json({ error: "API key is required for save action" }, { status: 400 });
      }

      // Validate API key format
      if (!isValidApiKeyFormat(provider, apiKey)) {
        return json({ error: `Invalid API key format for ${provider}` }, { status: 400 });
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
        console.error('Database error:', error);
        return json({ error: "Failed to save API key" }, { status: 500 });
      }

      return json({ success: true, message: `API key for ${provider} saved successfully` });
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
        return json({ error: "Failed to delete API key" }, { status: 500 });
      }

      return json({ success: true, message: `API key for ${provider} deleted successfully` });
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
        return json({ error: `No API key found for ${provider}` }, { status: 404 });
      }

      try {
        const decryptedKey = decryptApiKey({
          encrypted: apiKeyData.encrypted_key,
          iv: apiKeyData.iv
        });

        return json({ apiKey: decryptedKey });
      } catch (decryptError) {
        console.error('Decryption error:', decryptError);
        return json({ error: "Failed to decrypt API key" }, { status: 500 });
      }
    }

    return json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error('Server error:', error);
    return json({ error: "Internal server error" }, { status: 500 });
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