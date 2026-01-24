import { json, type ActionFunctionArgs } from "react-router";
import { AuthService } from "~/services/auth-service";
import { encrypt, decrypt } from "~/lib/encryption";

interface EncryptRequest {
  action: 'encrypt' | 'decrypt';
  data: string;
}

interface EncryptResponse {
  success: boolean;
  result?: string;
  error?: string;
}

/**
 * Server-side encryption/decryption API endpoint
 * This moves sensitive encryption operations to the server side
 */
export async function action({ request }: ActionFunctionArgs): Promise<Response> {
  try {
    // Verify authentication
    const user = await AuthService.getCurrentUser();
    if (!user) {
      return json<EncryptResponse>(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json() as EncryptRequest;
    const { action, data } = body;

    if (!action || !data) {
      return json<EncryptResponse>(
        { success: false, error: 'Missing action or data' },
        { status: 400 }
      );
    }

    let result: string;

    switch (action) {
      case 'encrypt':
        result = encrypt(data);
        break;
      
      case 'decrypt':
        result = decrypt(data);
        break;
      
      default:
        return json<EncryptResponse>(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    return json<EncryptResponse>({
      success: true,
      result
    });

  } catch (error) {
    console.error('Encryption API error:', error);
    return json<EncryptResponse>(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Encryption operation failed' 
      },
      { status: 500 }
    );
  }
}

// Only allow POST requests
export async function loader() {
  return json({ error: 'Method not allowed' }, { status: 405 });
}