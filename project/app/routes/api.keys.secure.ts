import { json } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@react-router/node";
import { AuthService } from "~/services/auth-service";
import { supabase } from "~/lib/supabase";
import { encrypt, decrypt } from "~/lib/encryption";

interface ApiKeyRequest {
  action: 'save' | 'get' | 'delete' | 'list';
  provider?: string;
  apiKey?: string;
}

interface ApiKeyResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Secure server-side API key management
 * All encryption/decryption happens on the server
 */
export async function action({ request }: ActionFunctionArgs): Promise<Response> {
  try {
    // Verify authentication
    const user = await AuthService.getCurrentUser();
    if (!user) {
      return json<ApiKeyResponse>(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json() as ApiKeyRequest;
    const { action, provider, apiKey } = body;

    switch (action) {
      case 'save': {
        if (!provider || !apiKey) {
          return json<ApiKeyResponse>(
            { success: false, error: 'Provider and API key are required' },
            { status: 400 }
          );
        }

        // Encrypt the API key on the server
        const encryptedKey = encrypt(apiKey);

        // Save to database
        const { error } = await supabase
          .from('api_keys')
          .upsert({
            user_id: user.id,
            provider,
            encrypted_key: encryptedKey,
            updated_at: new Date().toISOString()
          });

        if (error) {
          throw new Error(`Failed to save API key: ${error.message}`);
        }

        return json<ApiKeyResponse>({ success: true });
      }

      case 'get': {
        if (!provider) {
          return json<ApiKeyResponse>(
            { success: false, error: 'Provider is required' },
            { status: 400 }
          );
        }

        const { data, error } = await supabase
          .from('api_keys')
          .select('encrypted_key')
          .eq('user_id', user.id)
          .eq('provider', provider)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            return json<ApiKeyResponse>(
              { success: false, error: 'API key not found' },
              { status: 404 }
            );
          }
          throw new Error(`Failed to get API key: ${error.message}`);
        }

        // Decrypt the API key on the server
        const decryptedKey = decrypt(data.encrypted_key);

        return json<ApiKeyResponse>({
          success: true,
          data: { apiKey: decryptedKey }
        });
      }

      case 'delete': {
        if (!provider) {
          return json<ApiKeyResponse>(
            { success: false, error: 'Provider is required' },
            { status: 400 }
          );
        }

        const { error } = await supabase
          .from('api_keys')
          .delete()
          .eq('user_id', user.id)
          .eq('provider', provider);

        if (error) {
          throw new Error(`Failed to delete API key: ${error.message}`);
        }

        return json<ApiKeyResponse>({ success: true });
      }

      case 'list': {
        const { data, error } = await supabase
          .from('api_keys')
          .select('provider, created_at, updated_at')
          .eq('user_id', user.id)
          .order('provider');

        if (error) {
          throw new Error(`Failed to list API keys: ${error.message}`);
        }

        return json<ApiKeyResponse>({
          success: true,
          data: { providers: data || [] }
        });
      }

      default:
        return json<ApiKeyResponse>(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Secure API keys error:', error);
    return json<ApiKeyResponse>(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'API key operation failed' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for listing API keys
 */
export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
  try {
    // Verify authentication
    const user = await AuthService.getCurrentUser();
    if (!user) {
      return json<ApiKeyResponse>(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('api_keys')
      .select('provider, created_at, updated_at')
      .eq('user_id', user.id)
      .order('provider');

    if (error) {
      throw new Error(`Failed to list API keys: ${error.message}`);
    }

    return json<ApiKeyResponse>({
      success: true,
      data: { providers: data || [] }
    });

  } catch (error) {
    console.error('Secure API keys loader error:', error);
    return json<ApiKeyResponse>(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to load API keys' 
      },
      { status: 500 }
    );
  }
}