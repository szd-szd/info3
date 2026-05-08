import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../lib/supabase';
import { authEmailRedirectUrl } from '../lib/supabaseUrl';
import { registerSchema } from '../lib/validation';

type Form = { email: string; password: string };

export function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: Form) {
    setError(null);
    const emailRedirectTo = authEmailRedirectUrl();
    const { error: e } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        ...(emailRedirectTo ? { emailRedirectTo } : {}),
      },
    });
    if (e) {
      let msg = e.message;
      if (/invalid path|path specified|redirect/i.test(msg)) {
        msg +=
          ' Vérifiez dans Supabase : Authentication → URL Configuration — Site URL et Redirect URLs doivent inclure l’URL exacte de cette page (ex. http://127.0.0.1:5320/** et http://localhost:5320/**). Vérifiez aussi VITE_SUPABASE_URL dans .env (uniquement https://xxxx.supabase.co, sans /rest/v1).';
      }
      if (/email address.*invalid|email_address_invalid/i.test(msg)) {
        msg +=
          ' Réessayez en retapant l’e-mail à la main (sans copier-coller depuis Word/PDF). Si « Confirm email » est activé, vérifiez aussi SMTP / Auth hooks dans Supabase (voir README).';
      }
      setError(msg);
      return;
    }
    navigate('/', { replace: true });
  }

  return (
    <div className="layout-main" style={{ maxWidth: 420 }}>
      <div className="card">
        <h1>Inscription</h1>
        <p>Utilisez la même adresse e-mail que celle renseignée par les RH pour être relié automatiquement.</p>
        {error && <div className="flash flash-error">{error}</div>}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input id="email" type="email" autoComplete="email" {...register('email')} />
            {errors.email && <div className="error">{errors.email.message}</div>}
          </div>
          <div className="field">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register('password')}
            />
            {errors.password && <div className="error">{errors.password.message}</div>}
          </div>
          <button type="submit" className="btn" disabled={isSubmitting}>
            {isSubmitting ? 'Inscription…' : 'Créer mon compte'}
          </button>
        </form>
        <p style={{ marginTop: '1rem' }}>
          Déjà inscrit ? <Link to="/login">Connexion</Link>
        </p>
      </div>
    </div>
  );
}
