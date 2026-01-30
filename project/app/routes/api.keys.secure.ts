import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
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
      console.error('API keys secure: No user authenticated');
      return Response.json(
        { success: false, error: 'Authentication required' } as ApiKeyResponse,
        { status: 401 }
      );
    }

    console.log('API keys secure: User authenticated:', user.id);

    const body = await request.json() as ApiKeyRequest;
    const { action, provider, apiKey } = body;

    console.log('API keys secure: Action:', action, 'Provider:', provider);

    switch (action) {
      case 'save': {
        if (!provider || !apiKey) {
          console.error('API keys secure: Missing provider or apiKey');
          return Response.json(
            { success: false, error: 'Provider and API key are required' } as ApiKeyResponse,
            { status: 400 }
          );
        }

        console.log('API keys secure: Encrypting key for provider:', provider);

        // Encrypt the API key on the server
        let encryptedKey: string;
        try {
          encryptedKey = encrypt(apiKey);
          console.log('API keys secure: Key encrypted successfully');
        } catch (encryptError) {
          console.error('API keys secure: Encryption failed:', encryptError);
          throw new Error(`Encryption failed: ${encryptError instanceof Error ? encryptError.message : 'Unknown error'}`);
        }

        console.log('API keys secure: Saving to database...');

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
          console.error('API keys secure: Database error:', error);
          throw new Error(`Failed to save API key: ${error.message}`);
        }

        console.log('API keys secure: Key saved successfully');
        return Response.json({ success: true } as ApiKeyResponse);
      }

      case 'get': {
        if (!provider) {
          return Response.json(
            { success: false, error: 'Provider is required' } as ApiKeyResponse,
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
            return Response.json(
              { success: false, error: 'API key not found' } as ApiKeyResponse,
              { status: 404 }
            );
          }
          throw new Error(`Failed to get API key: ${error.message}`);
        }

        // Decrypt the API key on the server
        const decryptedKey = decrypt(data.encrypted_key);

        return Response.json({
          success: true,
          data: { apiKey: decryptedKey }
        } as ApiKeyResponse);
      }

      case 'delete': {
        if (!provider) {
          return Response.json(
            { success: false, error: 'Provider is required' } as ApiKeyResponse,
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

        return Response.json({ success: true } as ApiKeyResponse);
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

        return Response.json({
          success: true,
          data: { providers: data || [] }
        } as ApiKeyResponse);
      }

      default:
        return Response.json(
          { success: false, error: 'Invalid action' } as ApiKeyResponse,
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Secure API keys error:', error);
    return Response.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'API key operation failed' 
      } as ApiKeyResponse,
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
      return Response.json(
        { providers: [] },
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

    return Response.json({
      success: true,
      data: { 
        providers: (data || []).map(p => ({
          provider: p.provider,
          created_at: p.created_at,
          updated_at: p.updated_at
        }))
      }
    });

  } catch (error) {
    console.error('Secure API keys loader error:', error);
    return Response.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to load API keys',
        data: { providers: [] }
      },
      { status: 500 }
    );
  }
}