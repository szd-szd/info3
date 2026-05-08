import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export function HomeRedirect() {
  const { session, profile, loading } = useAuth();

  if (loading && !session) {
    return (
      <div className="layout-main">
        <p>Chargement…</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!profile) {
    return (
      <div className="layout-main">
        <p>Chargement du profil…</p>
      </div>
    );
  }

  if (profile.role === 'rh') {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/app" replace />;
}
