import { type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { createClient } from "@supabase/supabase-js";
import { encrypt, decrypt } from "~/lib/encryption";

// Environment variables for server-side
const SUPABASE_URL = process.env.VITE_SUPABASE_PROJECT_URL || process.env.SUPABASE_PROJECT_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_API_KEY || process.env.SUPABASE_API_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing Supabase environment variables on server");
}

// Helper to create a Supabase client with the user's access token
function createSupabaseClient(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  return createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });
}

// Map provider names to server-side environment variables
const SERVER_ENV_KEYS: Record<string, string | undefined> = {
  openai: process.env.OPENAI_API_KEY,
  anthropic: process.env.ANTHROPIC_API_KEY,
  google: process.env.GOOGLE_API_KEY || process.env.GOOGLE_AI_API_KEY,
  xai: process.env.XAI_API_KEY,
  deepseek: process.env.DEEPSEEK_API_KEY || process.env.HUGGINGFACE_API_KEY,
};

export async function loader({ request }: LoaderFunctionArgs) {
  if (request.method !== "GET") {
    return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  const supabase = createSupabaseClient(request);
  
  // 1. Verify User
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    // If no user, we can't return DB keys. 
    // But maybe we return available server env keys? 
    // Secure approach: Only return if authenticated.
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // 2. Get keys from DB
  const { data: dbKeys, error: dbError } = await supabase
    .from("api_keys")
    .select("*")
    .eq("user_id", user.id);

  if (dbError) {
    console.error("Database error fetching keys:", dbError);
    // Don't fail completely, try env vars
  }

  // 3. Construct response
  // We want to return a list of providers that are available (either in DB or Env)
  // For DB keys, we don't return the raw key in the list (usually), but the service expects 'getAllApiKeys' logic.
  // The service expects: { data: { providers: [...] } }
  
  const providers = [];
  const processedProviders = new Set();

  // Add DB keys
  if (dbKeys) {
    for (const key of dbKeys) {
      providers.push({
        provider: key.provider,
        created_at: key.created_at,
        updated_at: key.updated_at,
        source: 'database'
      });
      processedProviders.add(key.provider);
    }
  }

  // Add Env keys (if not in DB)
  for (const [provider, key] of Object.entries(SERVER_ENV_KEYS)) {
    if (key && !processedProviders.has(provider)) {
      providers.push({
        provider,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        source: 'environment'
      });
    }
  }

  return Response.json({
    success: true,
    data: { providers }
  });
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  const supabase = createSupabaseClient(request);
  
  // 1. Verify User
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, provider, apiKey } = body;

    if (!action || !provider) {
      return Response.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    if (action === "save") {
      if (!apiKey) {
        return Response.json({ success: false, error: "API Key required" }, { status: 400 });
      }

      // Encrypt key
      const encryptedKey = encrypt(apiKey);

      // Upsert into DB
      const { error: upsertError } = await supabase
        .from("api_keys")
        .upsert({
          user_id: user.id,
          provider,
          encrypted_key: encryptedKey,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,provider' });

      if (upsertError) {
        throw upsertError;
      }

      return Response.json({ success: true });
    }

    if (action === "get") {
      // Try DB first
      const { data, error } = await supabase
        .from("api_keys")
        .select("encrypted_key")
        .eq("user_id", user.id)
        .eq("provider", provider)
        .single();

      if (data && data.encrypted_key) {
        try {
          const decryptedKey = decrypt(data.encrypted_key);
          return Response.json({ success: true, data: { apiKey: decryptedKey } });
        } catch (e) {
          console.error("Decryption failed:", e);
          return Response.json({ success: false, error: "Failed to decrypt key" }, { status: 500 });
        }
      }

      // Fallback to Environment Variables
      const envKey = SERVER_ENV_KEYS[provider];
      if (envKey) {
        return Response.json({ success: true, data: { apiKey: envKey } });
      }

      return Response.json({ success: false, error: "Key not found" }, { status: 404 });
    }

    if (action === "delete") {
      const { error } = await supabase
        .from("api_keys")
        .delete()
        .eq("user_id", user.id)
        .eq("provider", provider);

      if (error) throw error;

      return Response.json({ success: true });
    }

    return Response.json({ success: false, error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("API Key Action Error:", error);
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Internal Server Error" 
    }, { status: 500 });
  }
}
