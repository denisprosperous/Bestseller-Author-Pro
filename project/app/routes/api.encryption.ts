import type { ActionFunctionArgs } from "react-router";
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
      return Response.json(
        { success: false, error: 'Authentication required' } as EncryptResponse,
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json() as EncryptRequest;
    const { action, data } = body;

    if (!action || !data) {
      return Response.json(
        { success: false, error: 'Missing action or data' } as EncryptResponse,
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
        return Response.json(
          { success: false, error: 'Invalid action' } as EncryptResponse,
          { status: 400 }
        );
    }

    return Response.json({
      success: true,
      result
    } as EncryptResponse);

  } catch (error) {
    console.error('Encryption API error:', error);
    return Response.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Encryption operation failed' 
      } as EncryptResponse,
      { status: 500 }
    );
  }
}

// Only allow POST requests
export async function loader() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}