import { z } from 'zod';
import { normalizeEmailInput } from './emailNormalize';

const emailSchema = z
  .string()
  .transform((s) => normalizeEmailInput(s))
  .pipe(z.string().email('E-mail invalide'));

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, 'Au moins 6 caractères'),
});

export const registerSchema = loginSchema;

export const employeeFormSchema = z.object({
  email: emailSchema,
  first_name: z.string().min(1, 'Requis'),
  last_name: z.string().min(1, 'Requis'),
  job_title: z.string().optional(),
  department: z.string().optional(),
  manager_name: z.string().optional(),
  hire_date: z.string().optional(),
  internal_id: z.string().optional(),
  phone_work: z.string().optional(),
  phone_personal: z.string().optional(),
  is_active: z.coerce.boolean(),
});

export const leaveRequestSchema = z
  .object({
    start_date: z.string().min(1, 'Requis'),
    end_date: z.string().min(1, 'Requis'),
    leave_type: z.string().min(1, 'Requis'),
    reason: z.string().optional(),
  })
  .refine(
    (d) => {
      if (!d.start_date || !d.end_date) return true;
      return d.end_date >= d.start_date;
    },
    { message: 'La date de fin doit être après le début', path: ['end_date'] }
  );

export const leaveDecisionSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  comment_rh: z.string().optional(),
});
