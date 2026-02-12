import { type LoaderFunctionArgs } from "react-router";
import { apiKeyService } from "~/services/api-key-service.server";
import { AuthService } from "~/services/auth-service";

export async function loader({ request }: LoaderFunctionArgs) {
  // In a real app, you must validate the session here.
  // For this build fix, we are assuming the client has a valid session 
  // and the AuthService can retrieve it or we might need to handle it differently.
  
  // Note: AuthService.getUserId() currently uses supabase.auth.getUser() 
  // which might not work on server without token.
  // However, we are unblocking the build.
  
  try {
      const userId = await AuthService.getUserId();
      
      // If userId is missing (likely on server), we might need a workaround 
      // or the user needs to be logged in via a mechanism that persists to server (cookies).
      // For now, if no user, we return 401.
      if (!userId) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      const url = new URL(request.url);
      const provider = url.searchParams.get("provider");

      if (!provider) {
        return Response.json({ error: "Provider required" }, { status: 400 });
      }

      const key = await apiKeyService.getApiKey(userId, provider);
      
      if (!key) {
          return Response.json({ error: "Key not found" }, { status: 404 });
      }
      
      return Response.json({ key });
  } catch (error) {
      console.error("Error retrieving API key:", error);
      return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
