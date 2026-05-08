import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';

export function EmployeeHome() {
  const { profile } = useAuth();

  return (
    <div>
      <h1>Bienvenue</h1>
      <p>Accédez à votre profil et gérez vos demandes de congé.</p>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Link to="/app/profil" className="card" style={{ flex: '1 1 200px', display: 'block' }}>
          <h3>Profil</h3>
          <p>Coordonnées et poste</p>
        </Link>
        <Link to="/app/conges" className="card" style={{ flex: '1 1 200px', display: 'block' }}>
          <h3>Congés</h3>
          <p>Nouvelle demande et suivi</p>
        </Link>
      </div>
      {profile?.employee_id && (
        <p style={{ marginTop: '1.5rem', fontSize: '0.9rem' }}>
          Compte relié au dossier employé <code>{profile.employee_id.slice(0, 8)}…</code>
        </p>
      )}
    </div>
  );
}
