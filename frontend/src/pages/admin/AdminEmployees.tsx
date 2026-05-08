import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Employee } from '../../lib/types';

export function AdminEmployees() {
  const { data: rows, isLoading, error } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error: e } = await supabase
        .from('employees')
        .select('*')
        .order('last_name', { ascending: true });
      if (e) throw e;
      return data as Employee[];
    },
  });

  if (isLoading) return <p>Chargement…</p>;
  if (error) return <div className="flash flash-error">{(error as Error).message}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>Employés</h1>
        <Link to="/admin/employes/nouveau" className="btn">
          Nouvel employé
        </Link>
      </div>
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>E-mail</th>
              <th>Poste</th>
              <th>Service</th>
              <th>Actif</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows?.map((e) => (
              <tr key={e.id}>
                <td>
                  {e.last_name} {e.first_name}
                </td>
                <td>{e.email}</td>
                <td>{e.job_title ?? '—'}</td>
                <td>{e.department ?? '—'}</td>
                <td>{e.is_active ? 'Oui' : 'Non'}</td>
                <td>
                  <Link to={`/admin/employes/${e.id}`}>Modifier</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
