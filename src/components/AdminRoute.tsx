import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { ReactNode } from 'react';

interface AdminRouteProps {
  children: ReactNode;
}

/**
 * Protects admin routes: only users with role 'admin' can access.
 * - Not logged in → redirect to login with return url
 * - Logged in as user → redirect to home (no access)
 * - Admin → render children
 */
export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-slate-500">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
