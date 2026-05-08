import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export function AdminDashboard() {
  const { data: pendingCount, isLoading } = useQuery({
    queryKey: ['leave-count-pending'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('leave_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: empCount } = useQuery({
    queryKey: ['employees-active-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      if (error) throw error;
      return count ?? 0;
    },
  });

  return (
    <div>
      <h1>Tableau de bord</h1>
      <p>Résumé pour le service RH.</p>
      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
        <div className="card">
          <h3>Congés en attente</h3>
          {isLoading ? <p>…</p> : <p style={{ fontSize: '2rem', fontWeight: 700 }}>{pendingCount}</p>}
          <Link to="/admin/conges">Voir les demandes →</Link>
        </div>
        <div className="card">
          <h3>Employés actifs</h3>
          <p style={{ fontSize: '2rem', fontWeight: 700 }}>{empCount ?? '—'}</p>
          <Link to="/admin/employes">Gérer les employés →</Link>
        </div>
      </div>
    </div>
  );
}
