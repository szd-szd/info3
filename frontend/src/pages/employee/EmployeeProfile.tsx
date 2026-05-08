import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { Employee } from '../../lib/types';
import { useAuth } from '../../auth/AuthProvider';

export function EmployeeProfile() {
  const { profile } = useAuth();
  const empId = profile?.employee_id;

  const { data: emp, isLoading, error } = useQuery({
    queryKey: ['employee-self', empId],
    enabled: !!empId,
    queryFn: async () => {
      const { data, error: e } = await supabase.from('employees').select('*').eq('id', empId!).single();
      if (e) throw e;
      return data as Employee;
    },
  });

  if (!empId) return null;
  if (isLoading) return <p>Chargement…</p>;
  if (error || !emp) return <div className="flash flash-error">Impossible de charger le profil.</div>;

  return (
    <div>
      <h1>Mon profil</h1>
      <div className="card" style={{ maxWidth: 520 }}>
        <p>
          <strong>Nom</strong> — {emp.first_name} {emp.last_name}
        </p>
        <p>
          <strong>E-mail pro</strong> — {emp.email}
        </p>
        <p>
          <strong>Poste</strong> — {emp.job_title ?? '—'}
        </p>
        <p>
          <strong>Service</strong> — {emp.department ?? '—'}
        </p>
        <p>
          <strong>Manager</strong> — {emp.manager_name ?? '—'}
        </p>
        <p>
          <strong>Date d’entrée</strong> — {emp.hire_date ?? '—'}
        </p>
        <p>
          <strong>Téléphone pro</strong> — {emp.phone_work ?? '—'}
        </p>
        <p>
          <strong>Téléphone perso</strong> — {emp.phone_personal ?? '—'}
        </p>
      </div>
    </div>
  );
}
