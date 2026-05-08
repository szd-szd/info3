import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../../lib/supabase';
import { leaveRequestSchema } from '../../lib/validation';
import type { LeaveRequest } from '../../lib/types';
import { leaveStatusBadgeClass, leaveStatusLabel } from '../../lib/types';
import { useAuth } from '../../auth/useAuth';
import type { z } from 'zod';

type Form = z.infer<typeof leaveRequestSchema>;

export function EmployeeLeaves() {
  const { profile } = useAuth();
  const empId = profile?.employee_id;
  const qc = useQueryClient();

  const { data: rows, isLoading, error } = useQuery({
    queryKey: ['leave-requests-self', empId],
    enabled: !!empId,
    queryFn: async () => {
      const { data, error: e } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('employee_id', empId!)
        .order('created_at', { ascending: false });
      if (e) throw e;
      return data as LeaveRequest[];
    },
  });

  const form = useForm<Form>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      start_date: '',
      end_date: '',
      leave_type: 'Congé payé',
      reason: '',
    },
  });

  const createLeave = useMutation({
    mutationFn: async (values: Form) => {
      if (!empId) throw new Error('Non relié à un employé');
      const { error: e } = await supabase.from('leave_requests').insert({
        employee_id: empId,
        start_date: values.start_date,
        end_date: values.end_date,
        leave_type: values.leave_type.trim(),
        reason: values.reason?.trim() || null,
        status: 'pending',
      });
      if (e) throw e;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['leave-requests-self', empId] });
      form.reset({ start_date: '', end_date: '', leave_type: 'Congé payé', reason: '' });
    },
  });

  const cancelLeave = useMutation({
    mutationFn: async (id: string) => {
      const { error: e } = await supabase.from('leave_requests').update({ status: 'cancelled' }).eq('id', id);
      if (e) throw e;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['leave-requests-self', empId] });
    },
  });

  if (!empId) return null;
  if (isLoading) return <p>Chargement…</p>;
  if (error) return <div className="flash flash-error">{(error as Error).message}</div>;

  return (
    <div>
      <h1>Congés</h1>

      <h2 style={{ fontSize: '1.1rem', marginTop: '1.5rem' }}>Nouvelle demande</h2>
      <form
        className="card"
        style={{ maxWidth: 480, marginBottom: '2rem' }}
        onSubmit={form.handleSubmit((v) => createLeave.mutate(v))}
        noValidate
      >
        {createLeave.isError && (
          <div className="flash flash-error">{(createLeave.error as Error).message}</div>
        )}
        <div className="field">
          <label htmlFor="start_date">Début</label>
          <input id="start_date" type="date" {...form.register('start_date')} />
          {form.formState.errors.start_date && (
            <div className="error">{form.formState.errors.start_date.message}</div>
          )}
        </div>
        <div className="field">
          <label htmlFor="end_date">Fin</label>
          <input id="end_date" type="date" {...form.register('end_date')} />
          {form.formState.errors.end_date && (
            <div className="error">{form.formState.errors.end_date.message}</div>
          )}
        </div>
        <div className="field">
          <label htmlFor="leave_type">Type</label>
          <select id="leave_type" {...form.register('leave_type')}>
            <option value="Congé payé">Congé payé</option>
            <option value="Sans solde">Sans solde</option>
            <option value="RTT">RTT</option>
            <option value="Autre">Autre</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="reason">Motif (optionnel)</label>
          <textarea id="reason" {...form.register('reason')} />
        </div>
        <button type="submit" className="btn" disabled={createLeave.isPending}>
          {createLeave.isPending ? 'Envoi…' : 'Envoyer la demande'}
        </button>
      </form>

      <h2 style={{ fontSize: '1.1rem' }}>Mes demandes</h2>
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Période</th>
              <th>Type</th>
              <th>Statut</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows?.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <p style={{ margin: 0 }}>Aucune demande pour le moment.</p>
                </td>
              </tr>
            )}
            {rows?.map((r) => (
              <tr key={r.id}>
                <td>
                  {r.start_date} → {r.end_date}
                </td>
                <td>{r.leave_type}</td>
                <td>
                  <span className={leaveStatusBadgeClass(r.status)}>{leaveStatusLabel(r.status)}</span>
                  {r.comment_rh && (
                    <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>RH : {r.comment_rh}</div>
                  )}
                </td>
                <td>
                  {r.status === 'pending' && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={cancelLeave.isPending}
                      onClick={() => cancelLeave.mutate(r.id)}
                    >
                      Annuler
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
