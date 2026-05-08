import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';

export function AdminLayout() {
  const { signOut } = useAuth();

  return (
    <div className="layout">
      <header className="layout-header">
        <strong>RH Portal — Administration</strong>
        <nav className="layout-nav">
          <NavLink to="/admin" end className={({ isActive }) => (isActive ? 'active' : '')}>
            Tableau de bord
          </NavLink>
          <NavLink
            to="/admin/employes"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            Employés
          </NavLink>
          <NavLink
            to="/admin/conges"
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
