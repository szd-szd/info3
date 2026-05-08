import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';

export function EmployeeLayout() {
  const { signOut } = useAuth();

  return (
    <div className="layout">
      <header className="layout-header">
        <strong>Mon espace</strong>
        <nav className="layout-nav">
          <NavLink to="/app" end className={({ isActive }) => (isActive ? 'active' : '')}>
            Accueil
          </NavLink>
          <NavLink
            to="/app/profil"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            Profil
          </NavLink>
          <NavLink
            to="/app/conges"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            Congés
          </NavLink>
          <button type="button" className="btn btn-secondary" onClick={() => void signOut()}>
            Déconnexion
          </button>
        </nav>
      </header>
      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  );
}
