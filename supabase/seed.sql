-- Données factices locales (optionnel).
-- Après migration : les employés ci‑dessous peuvent s’inscrire avec le même e-mail
-- pour être reliés automatiquement au déclencheur handle_new_user.

insert into public.employees (
  email, first_name, last_name, job_title, department, hire_date, is_active
) values
  ('marie.dupont@example.com', 'Marie', 'Dupont', 'Développeuse', 'IT', '2023-01-15', true),
  ('jean.martin@example.com', 'Jean', 'Martin', 'Chef de projet', 'Opérations', '2022-06-01', true)
on conflict (email) do nothing;

-- Promouvoir un compte en RH (remplacer l’UUID par celui de auth.users après inscription) :
-- update public.profiles set role = 'rh', employee_id = null where user_id = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
