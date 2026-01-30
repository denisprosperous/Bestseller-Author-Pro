import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import { AuthService, type AuthUser } from "~/services/auth-service";
import { DEMO_MODE } from "~/lib/demo-mode";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ children, redirectTo = "/login" }: ProtectedRouteProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In demo mode, skip auth check and load immediately
    if (DEMO_MODE) {
      AuthService.getCurrentUser().then((currentUser) => {
        setUser(currentUser);
        setLoading(false);
      });
      return;
    }

    // Check initial auth state
    AuthService.getCurrentUser().then((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    }).catch((error) => {
      console.error("Auth error:", error);
      setLoading(false);
    });

    // Listen for auth state changes (only in non-demo mode)
    try {
      const { data: { subscription } } = AuthService.onAuthStateChange((user) => {
        setUser(user);
        setLoading(false);
      });

      return () => {
        subscription?.unsubscribe();
      };
    } catch (error) {
      console.error("Auth subscription error:", error);
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        fontSize: '18px',
        color: 'var(--color-text-secondary)'
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}