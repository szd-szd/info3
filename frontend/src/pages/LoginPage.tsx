import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../lib/supabase';
import { loginSchema } from '../lib/validation';
import authIllustration from '../assets/auth-illustration.svg';

type Form = { email: string; password: string };

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: Form) {
    setError(null);
    const { error: e } = await supabase.auth.signInWithPassword(values);
    if (e) {
      let msg = e.message;
      if (/email address.*invalid|email_address_invalid/i.test(msg)) {
        msg +=
          ' Réessayez en retapant l’e-mail à la main. Voir README (Supabase : Confirm email, SMTP, hooks).';
      }
      setError(msg);
      return;
    }
    navigate(from && from !== '/login' ? from : '/', { replace: true });
  }

  return (
    <div className="auth-shell">
      <section className="auth-hero card" aria-hidden="true">
        <img src={authIllustration} alt="" />
        <h2>Espace RH centralise</h2>
        <p>Connectez-vous pour consulter vos congés, demandes et informations employé.</p>
      </section>
      <div className="card auth-card">
        <h1>Connexion</h1>
        <p className="auth-subtitle">Accédez à votre espace collaborateur en toute sécurité.</p>
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
              autoComplete="current-password"
              {...register('password')}
            />
            {errors.password && <div className="error">{errors.password.message}</div>}
          </div>
          <button type="submit" className="btn auth-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
        <p className="auth-switch">
          Pas de compte ? <Link to="/register">Créer un compte</Link>
        </p>
      </div>
    </div>
  );
}
