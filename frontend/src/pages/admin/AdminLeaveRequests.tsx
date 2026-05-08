import { Fragment, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import { leaveDecisionSchema } from '../../lib/validation';
import type { LeaveRequest, LeaveStatus } from '../../lib/types';
import { leaveStatusBadgeClass, leaveStatusLabel } from '../../lib/types';
import { useAuth } from '../../auth/useAuth';
import type { z } from 'zod';

type Row = LeaveRequest & {
  employees: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
};

type DecisionForm = z.infer<typeof leaveDecisionSchema>;

function DecisionPanel({ row, onDone }: { row: Row; onDone: () => void }) {
  const { session } = useAuth();
  const qc = useQueryClient();
  const form = useForm<{ comment_rh: string }>({
    defaultValues: { comment_rh: '' },
  });

  const decision = useMutation({
    mutationFn: async (input: DecisionForm) => {
      const uid = session?.user?.id;
      if (!uid) throw new Error('Session invalide');
      const { error } = await supabase
        .from('leave_requests')
        .update({
          status: input.status as LeaveStatus,
          comment_rh: input.comment_rh?.trim() || null,
          handled_by: uid,
        })
        .eq('id', row.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['leave-requests-admin'] });
      await qc.invalidateQueries({ queryKey: ['leave-count-pending'] });
      onDone();
    },
  });

  function submitDecision(status: 'approved' | 'rejected') {
    const comment_rh = form.getValues('comment_rh');
    const parsed = leaveDecisionSchema.safeParse({ status, comment_rh: comment_rh || undefined });
    if (!parsed.success) return;
    decision.mutate(parsed.data);
  }

  return (
    <div style={{ padding: '0.75rem 0' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
        <div className="field" style={{ flex: '1 1 220px', marginBottom: 0 }}>
          <label htmlFor={`c-${row.id}`}>Commentaire RH (optionnel)</label>
          <input id={`c-${row.id}`} {...form.register('comment_rh')} placeholder="Message pour l’employé" />
        </div>
        <button type="button" className="btn" disabled={decision.isPending} onClick={() => submitDecision('approved')}>
          Approuver
        </button>
        <button
          type="button"
          className="btn btn-danger"
          disabled={decision.isPending}
          onClick={() => submitDecision('rejected')}
        >
          Refuser
        </button>
      </div>
      {decision.isError && <div className="error">{(decision.error as Error).message}</div>}
    </div>
  );
}

export function AdminLeaveRequests() {
  const [openId, setOpenId] = useState<string | null>(null);
  const { data: rows, isLoading, error } = useQuery({
    queryKey: ['leave-requests-admin'],
    queryFn: async () => {
      const { data, error: e } = await supabase
        .from('leave_requests')
        .select(
          `
          id,
          employee_id,
          start_date,
          end_date,
          leave_type,
          reason,
          status,
          comment_rh,
          handled_by,
          created_at,
          employees ( first_name, last_name, email )
        `
        )
        .order('created_at', { ascending: false });
      if (e) throw e;
      return data as unknown as Row[];
    },
  });

  if (isLoading) return <p>Chargement…</p>;
  if (error) return <div className="flash flash-error">{(error as Error).message}</div>;

  return (
    <div>
      <h1>Demandes de congé</h1>
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Employé</th>
              <th>Période</th>
              <th>Type</th>
              <th>Motif</th>
              <th>Statut</th>
              <th>Créé</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows?.map((r) => (
              <Fragment key={r.id}>
                <tr>
                  <td>
                    {r.employees ? `${r.employees.last_name} ${r.employees.first_name}` : '—'}
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{r.employees?.email}</div>
                  </td>
                  <td>
                    {r.start_date} → {r.end_date}
                  </td>
                  <td>{r.leave_type}</td>
                  <td>{r.reason ?? '—'}</td>
                  <td>
                    <span className={leaveStatusBadgeClass(r.status)}>{leaveStatusLabel(r.status)}</span>
                  </td>
                  <td>{new Date(r.created_at).toLocaleDateString('fr-FR')}</td>
                  <td>
                    {r.status === 'pending' ? (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setOpenId(openId === r.id ? null : r.id)}
                      >
                        {openId === r.id ? 'Fermer' : 'Traiter'}
                      </button>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
                {openId === r.id && r.status === 'pending' && (
                  <tr className="detail-row">
                    <td colSpan={7}>
                      <DecisionPanel row={r} onDone={() => setOpenId(null)} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
