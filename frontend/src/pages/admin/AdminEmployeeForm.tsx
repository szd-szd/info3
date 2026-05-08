import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { employeeFormSchema } from '../../lib/validation';
import type { z } from 'zod';

type Form = z.infer<typeof employeeFormSchema>;

const defaults: Form = {
  email: '',
  first_name: '',
  last_name: '',
  job_title: '',
  department: '',
  manager_name: '',
  hire_date: '',
  internal_id: '',
  phone_work: '',
  phone_personal: '',
  is_active: true,
};

export function AdminEmployeeForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isNew = !id || id === 'nouveau';

  const { data: existing, isLoading } = useQuery({
    queryKey: ['employee', id],
    enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await supabase.from('employees').select('*').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<Form>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    if (!existing) return;
    form.reset({
      email: existing.email,
      first_name: existing.first_name,
      last_name: existing.last_name,
      job_title: existing.job_title ?? '',
      department: existing.department ?? '',
      manager_name: existing.manager_name ?? '',
      hire_date: existing.hire_date ?? '',
      internal_id: existing.internal_id ?? '',
      phone_work: existing.phone_work ?? '',
      phone_personal: existing.phone_personal ?? '',
      is_active: existing.is_active,
    });
  }, [existing, form]);

  const save = useMutation({
    mutationFn: async (values: Form) => {
      const payload = {
        email: values.email.trim().toLowerCase(),
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        job_title: values.job_title?.trim() || null,
        department: values.department?.trim() || null,
        manager_name: values.manager_name?.trim() || null,
        hire_date: values.hire_date || null,
        internal_id: values.internal_id?.trim() || null,
        phone_work: values.phone_work?.trim() || null,
        phone_personal: values.phone_personal?.trim() || null,
        is_active: values.is_active,
      };

      if (isNew) {
        const { error } = await supabase.from('employees').insert(payload);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('employees').update(payload).eq('id', id!);
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['employees'] });
      navigate('/admin/employes');
    },
  });

  if (!isNew && isLoading) return <p>Chargement…</p>;

  return (
    <div>
      <h1>{isNew ? 'Nouvel employé' : 'Modifier employé'}</h1>
      {save.isError && (
        <div className="flash flash-error">{(save.error as Error).message}</div>
      )}
      <form
        className="card"
        onSubmit={form.handleSubmit((v) => save.mutate(v))}
        noValidate
        style={{ maxWidth: 560 }}
      >
        <div className="field">
          <label htmlFor="email">E-mail pro (liaison compte)</label>
          <input id="email" type="email" {...form.register('email')} />
          {form.formState.errors.email && (
            <div className="error">{form.formState.errors.email.message}</div>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
          <div className="field">
            <label htmlFor="first_name">Prénom</label>
            <input id="first_name" {...form.register('first_name')} />
            {form.formState.errors.first_name && (
              <div className="error">{form.formState.errors.first_name.message}</div>
            )}
          </div>
          <div className="field">
            <label htmlFor="last_name">Nom</label>
            <input id="last_name" {...form.register('last_name')} />
            {form.formState.errors.last_name && (
              <div className="error">{form.formState.errors.last_name.message}</div>
            )}
          </div>
        </div>
        <div className="field">
          <label htmlFor="job_title">Poste</label>
          <input id="job_title" {...form.register('job_title')} />
        </div>
        <div className="field">
          <label htmlFor="department">Service</label>
          <input id="department" {...form.register('department')} />
        </div>
        <div className="field">
          <label htmlFor="manager_name">Manager</label>
          <input id="manager_name" {...form.register('manager_name')} />
        </div>
        <div className="field">
          <label htmlFor="hire_date">Date d’entrée</label>
          <input id="hire_date" type="date" {...form.register('hire_date')} />
        </div>
        <div className="field">
          <label htmlFor="internal_id">Matricule / ID interne</label>
          <input id="internal_id" {...form.register('internal_id')} />
        </div>
        <div className="field">
          <label htmlFor="phone_work">Téléphone pro</label>
          <input id="phone_work" {...form.register('phone_work')} />
        </div>
        <div className="field">
          <label htmlFor="phone_personal">Téléphone perso</label>
          <input id="phone_personal" {...form.register('phone_personal')} />
        </div>
        <div className="field">
          <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input type="checkbox" {...form.register('is_active')} />
            Actif
          </label>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="submit" className="btn" disabled={save.isPending}>
            {save.isPending ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
