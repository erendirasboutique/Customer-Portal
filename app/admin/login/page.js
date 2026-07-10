'use client';

import { useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
    <main className="adminLoginPage">
      <section className="adminLoginShell">
        <nav className="adminLoginSwitch" aria-label="Portal navigation">
          <a href="/customer">App</a>
          <a className="active" href="/admin/login">
            Admin
          </a>
        </nav>

        <div className="adminLoginGrid">
          <section className="adminLoginCard">
            <div className="adminLoginLogoWrap">
              <img
                src="/logo.png"
                className="adminLoginLogo"
                alt="Erendira's Boutique"
              />
            </div>

            <p className="adminLoginEyebrow">Secure team access</p>

            <h1>
              Welcome Back to
              <br />
              Erendira&apos;s Boutique
            </h1>

            <p className="adminLoginIntro">
              Sign in with an approved team account to manage payments,
              customers, gift cards, and payment links.
            </p>

            <form className="adminLoginForm" onSubmit={login}>
              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </label>

              <label>
                <span>Password</span>

                <div className="adminPasswordField">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />

                  <button
                    type="button"
                    className="adminPasswordToggle"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </label>

              <button className="adminPrimaryButton" type="submit">
                Log In
              </button>
            </form>

            <div className="adminLoginDivider">
              <span>or</span>
            </div>

            <button
              className="adminGoogleButton"
              type="button"
              onClick={signInWithGoogle}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 48 48"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  fill="#FFC107"
                  d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.195 36 24 36c-6.627 0-12-5.373-12-12S17.373 12 24 12c3.059 0 5.842 1.154 7.959 3.041l5.657-5.657C34.053 6.053 29.277 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 12 24 12c3.059 0 5.842 1.154 7.959 3.041l5.657-5.657C34.053 6.053 29.277 4 24 4c-7.682 0-14.347 4.337-17.694 10.691z"
                />
                <path
                  fill="#4CAF50"
                  d="M24 44c5.176 0 9.86-1.977 13.409-5.192l-6.191-5.238C29.153 35.091 26.685 36 24 36c-5.176 0-9.621-3.326-11.276-7.946l-6.522 5.025C9.512 39.556 16.227 44 24 44z"
                />
                <path
                  fill="#1976D2"
                  d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.223 4.166-4.085 5.57l6.191 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
                />
              </svg>

              Continue with Google
            </button>

            {message && <div className="adminLoginMessage">{message}</div>}
          </section>

          <section className="adminStorefront" aria-hidden="true">
            <div className="storeAwning">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>

            <div className="storeSign">
              <img src="/logo.png" alt="" />
            </div>

            <div className="storeWindowGrid">
              <div className="displayWindow">
                <div className="displayShelf" />
                <div className="displayBag bagOne" />
                <div className="displayBag bagTwo" />
                <div className="displayBottle" />
              </div>

              <div className="storeDoor">
                <div className="doorWindow" />
                <div className="doorHandle" />
              </div>
            </div>

            <div className="storeBottomWindows">
              <span />
              <span />
            </div>

            <div className="storeCaption">
              Billing Studio
              <small>Payments · Customers · Gift Cards</small>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
