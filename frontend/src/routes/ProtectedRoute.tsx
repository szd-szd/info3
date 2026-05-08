import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../auth/useAuth';

type Props = {
  children: ReactNode;
  requireRh?: boolean;
  requireEmployee?: boolean;
};

export function ProtectedRoute({ children, requireRh, requireEmployee }: Props) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading && !session) {
    return (
      <div className="layout-main">
        <p>Chargement…</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!profile) {
    return (
      <div className="layout-main">
        <div className="flash flash-error">Profil introuvable. Contactez le RH.</div>
      </div>
    );
  }

  if (requireRh && profile.role !== 'rh') {
    return <Navigate to="/app" replace />;
  }

  if (requireEmployee && profile.role !== 'employee') {
    return <Navigate to="/admin" replace />;
  }

  if (requireEmployee && profile.role === 'employee' && !profile.employee_id) {
    return (
      <div className="layout-main card">
        <h2>Compte en attente</h2>
        <p>
          Votre compte n’est pas encore relié à un dossier employé. L’équipe RH doit créer votre
          fiche avec la même adresse e-mail, puis vous pourrez vous reconnecter ou rafraîchir cette
          page après validation du rattachement (inscription avec l’e‑mail professionnel).
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
