'use client';

import { useState } from 'react';
import LanguageToggle from '@/components/LanguageToggle';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';

export default function AdminLoginPage() {
  const [lang, setLang] = useState('en');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const supabase = getSupabaseBrowser();

  async function login(e) {
    e.preventDefault();
    setMessage('Signing in...');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message || 'Could not sign in.');
      return;
    }

    window.location.href = '/admin';
  }

  async function signInWithGoogle() {
    setMessage('Redirecting to Google...');

    const siteUrl = (
      process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    ).replace(/\/$/, '');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${siteUrl}/auth/callback?next=/admin`,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      setMessage(error.message || 'Could not continue with Google.');
    }
  }

  return (
    <main className="page">
      <span className="flower one">✿</span>
      <span className="flower two">❀</span>

      <div className="shell">
        <div className="topbar">
          <div className="brand">
            <img src="/logo.png" className="logo" alt="Erendira's Boutique" />
            <div className="brand-title">Admin Studio</div>
          </div>

          <LanguageToggle lang={lang} setLang={setLang} />
        </div>

        <section className="hero">
          <div className="card loginCard">
            <p className="eyebrow">Secure team access</p>
            <h1>Billing admin login</h1>
            <p>
              Sign in with an approved admin account to review payments and
              customers.
            </p>

            <button className="button googleButton" type="button" onClick={signInWithGoogle}>
              <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.195 36 24 36c-6.627 0-12-5.373-12-12S17.373 12 24 12c3.059 0 5.842 1.154 7.959 3.041l5.657-5.657C34.053 6.053 29.277 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 12 24 12c3.059 0 5.842 1.154 7.959 3.041l5.657-5.657C34.053 6.053 29.277 4 24 4c-7.682 0-14.347 4.337-17.694 10.691z"/>
                <path fill="#4CAF50" d="M24 44c5.176 0 9.86-1.977 13.409-5.192l-6.191-5.238C29.153 35.091 26.685 36 24 36c-5.176 0-9.621-3.326-11.276-7.946l-6.522 5.025C9.512 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.223 4.166-4.085 5.57l.003-.002 6.191 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="notice" style={{ marginTop: 16 }}>
              Or sign in with email and password.
            </div>

            <form onSubmit={login}>
              <label className="field">
                Email
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>

              <label className="field">
                Password
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>

              <button className="button ghost" type="submit">
                Sign In
              </button>
            </form>

            {message && <div className="notice">{message}</div>}
          </div>

          <div className="card brandShowcase">
            <img src="/logo.png" alt="Erendira's Boutique" />
          </div>
        </section>
      </div>
    </main>
  );
}
