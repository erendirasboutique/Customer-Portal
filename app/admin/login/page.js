'use client';

import { useState } from 'react';
import LanguageToggle from '@/components/LanguageToggle';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';

// Where the App tab goes (customer-facing side of the billing portal).
const APP_URL = 'https://my.erendirasboutique.com';

var css = '' +
'.eb-page { min-height: 100vh; background: #e9e3d9; color: #332b23; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 16px; font-family: Georgia, serif; }' +
'.eb-toggle-row { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }' +
'.eb-toggle { display: flex; background: #fff; border: 1px solid rgba(128,106,82,0.35); border-radius: 999px; padding: 4px; }' +
'.eb-toggle button { border: 0; background: transparent; border-radius: 999px; padding: 8px 24px; font-size: 14px; color: rgba(51,43,35,0.7); cursor: pointer; font-family: inherit; }' +
'.eb-toggle button.active { background: rgba(189,168,145,0.6); color: #332b23; font-weight: 600; }' +
'.eb-grid { display: grid; grid-template-columns: 1fr; gap: 32px; width: 100%; max-width: 1000px; align-items: stretch; }' +
'@media (min-width: 1024px) { .eb-grid { grid-template-columns: 1fr 1fr; } }' +
'.eb-card { background: #fff; border: 2px solid rgba(51,43,35,0.75); border-radius: 24px; padding: 44px 40px; box-shadow: 6px 6px 0 rgba(60,48,36,0.85); display: flex; flex-direction: column; justify-content: center; }' +
'.eb-logo { display: block; margin: 0 auto; width: 150px; height: auto; }' +
'.eb-title { margin: 20px 0 0; text-align: center; font-size: 30px; line-height: 1.2; font-weight: 700; color: #332b23; }' +
'.eb-alert { margin-top: 20px; border-radius: 16px; padding: 12px 16px; font-size: 14px; text-align: center; background: #e9e3d9; color: #806a52; }' +
'.eb-fields { margin-top: 26px; display: flex; flex-direction: column; gap: 12px; }' +
'.eb-input { width: 100%; box-sizing: border-box; border: 1px solid rgba(51,43,35,0.5); border-radius: 16px; background: #fff; padding: 14px 16px; font-size: 15px; color: #332b23; font-family: inherit; outline: none; }' +
'.eb-input:focus { border-color: #806a52; }' +
'.eb-forgot { text-align: right; }' +
'.eb-forgot button { border: 0; background: none; font-size: 13px; color: rgba(51,43,35,0.7); text-decoration: underline; text-underline-offset: 2px; cursor: pointer; font-family: inherit; }' +
'.eb-login { margin-top: 16px; width: 100%; border: 0; border-radius: 16px; background: #4a3a2a; color: #f2ede4; padding: 16px; font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; }' +
'.eb-login:hover { opacity: 0.9; }' +
'.eb-google { margin-top: 12px; width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; border: 1px solid rgba(51,43,35,0.5); border-radius: 16px; background: #fff; color: #332b23; padding: 15px; font-size: 15px; cursor: pointer; font-family: inherit; }' +
'.eb-google:hover { background: rgba(233,227,217,0.6); }' +
'.eb-foot { margin-top: 20px; text-align: center; font-size: 13px; color: rgba(51,43,35,0.7); }' +
'.eb-art { display: none; align-items: center; justify-content: center; }' +
'@media (min-width: 1024px) { .eb-art { display: flex; } }' +
'.eb-art svg { width: 100%; height: auto; }';

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.6 39.6 16.3 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </svg>
  );
}

function Storefront() {
  return (
    <svg viewBox="0 0 460 480" role="img" aria-label="Illustration of the Erendira's Boutique storefront">
      <rect x="30" y="40" width="400" height="420" rx="6" fill="#d8c9b4" stroke="#5c4a38" strokeWidth="3" />
      <rect x="18" y="28" width="424" height="26" rx="4" fill="#c4b096" stroke="#5c4a38" strokeWidth="3" />
      <rect x="60" y="80" width="96" height="100" fill="#cfa963" stroke="#5c4a38" strokeWidth="3" />
      <path d="M96 96 h24 l8 44 h-40 z" fill="#a68bc0" stroke="#5c4a38" strokeWidth="3" />
      <line x1="108" y1="84" x2="108" y2="96" stroke="#5c4a38" strokeWidth="3" />
      <rect x="182" y="80" width="96" height="100" fill="#cfa963" stroke="#5c4a38" strokeWidth="3" />
      <rect x="204" y="96" width="52" height="34" rx="3" fill="#e6d9f0" stroke="#5c4a38" strokeWidth="3" />
      <rect x="196" y="136" width="68" height="36" rx="3" fill="#cbb6df" stroke="#5c4a38" strokeWidth="3" />
      <rect x="304" y="80" width="96" height="100" fill="#cfa963" stroke="#5c4a38" strokeWidth="3" />
      <rect x="316" y="104" width="26" height="66" fill="#b98a45" stroke="#5c4a38" strokeWidth="3" />
      <rect x="348" y="92" width="40" height="52" fill="#b98a45" stroke="#5c4a38" strokeWidth="3" />
      <rect x="352" y="148" width="28" height="26" fill="#e3cf9f" stroke="#5c4a38" strokeWidth="3" />
      <rect x="18" y="196" width="424" height="24" rx="4" fill="#c4b096" stroke="#5c4a38" strokeWidth="3" />
      <g fill="none" stroke="#5c4a38" strokeWidth="3">
        <circle cx="78" cy="248" r="12" /><circle cx="78" cy="248" r="5" />
        <circle cx="154" cy="248" r="12" /><circle cx="154" cy="248" r="5" />
        <circle cx="230" cy="248" r="12" /><circle cx="230" cy="248" r="5" />
        <circle cx="306" cy="248" r="12" /><circle cx="306" cy="248" r="5" />
        <circle cx="382" cy="248" r="12" /><circle cx="382" cy="248" r="5" />
      </g>
      <rect x="18" y="274" width="424" height="24" rx="4" fill="#c4b096" stroke="#5c4a38" strokeWidth="3" />
      <rect x="58" y="322" width="92" height="86" fill="#cfa963" stroke="#5c4a38" strokeWidth="3" />
      <path d="M92 336 h28 l10 22 h-48 z" fill="#c4b096" stroke="#5c4a38" strokeWidth="3" />
      <circle cx="104" cy="364" r="9" fill="#fdf9f1" stroke="#5c4a38" strokeWidth="3" />
      <line x1="104" y1="322" x2="104" y2="336" stroke="#5c4a38" strokeWidth="3" />
      <rect x="74" y="366" width="34" height="18" rx="9" fill="#8a7150" stroke="#5c4a38" strokeWidth="3" />
      <circle cx="84" cy="375" r="5" fill="#e3cf9f" />
      <rect x="170" y="310" width="230" height="150" fill="#cfa963" stroke="#5c4a38" strokeWidth="3" />
      <circle cx="216" cy="336" r="11" fill="#e6d9f0" stroke="#5c4a38" strokeWidth="3" />
      <circle cx="216" cy="336" r="4" fill="#a68bc0" />
      <rect x="202" y="350" width="30" height="26" fill="#b98a45" stroke="#5c4a38" strokeWidth="3" />
      <rect x="210" y="356" width="13" height="13" fill="#fdf9f1" stroke="#5c4a38" strokeWidth="2.5" />
      <rect x="194" y="380" width="46" height="40" fill="#b98a45" stroke="#5c4a38" strokeWidth="3" />
      <text x="330" y="384" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize="30" fill="#4a3a2a">Erendira&#8217;s</text>
      <text x="352" y="412" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize="17" fill="#5c4a38">boutique</text>
      <rect x="356" y="418" width="34" height="42" fill="#b98a45" stroke="#5c4a38" strokeWidth="3" />
      <rect x="364" y="428" width="14" height="12" fill="#fdf9f1" stroke="#5c4a38" strokeWidth="2.5" />
    </svg>
  );
}

export default function AdminLoginPage() {
  const [lang, setLang] = useState('en');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const supabase = getSupabaseBrowser();

  async function login(e) {
    e.preventDefault();
    setBusy(true);
    setMessage('Signing in...');

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setBusy(false);
      setMessage(
        error.message === 'Invalid login credentials'
          ? 'Wrong email or password.'
          : error.message || 'Could not sign in.'
      );
      return;
    }

    window.location.href = '/admin';
  }

  async function signInWithGoogle() {
    setBusy(true);
    setMessage('Redirecting to Google...');

    // Always return to the SAME domain this page is running on.
    // Using NEXT_PUBLIC_SITE_URL here caused PKCE failures after the
    // customer portal moved to my.erendirasboutique.com: the code
    // verifier was stored on this domain but Google returned users
    // to the other one.
    const siteUrl = window.location.origin.replace(/\/$/, '');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: siteUrl + '/auth/callback?next=/admin',
        queryParams: {
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      setBusy(false);
      setMessage(error.message || 'Could not continue with Google.');
    }
  }

  return (
    <main className="eb-page">
      <style>{css}</style>
<div className="eb-toggle">
          <button
            type="button"
            onClick={function () {
              window.location.href = APP_URL;
            }}
          >
            App
          </button>
          <button
            type="button"
            className="active"
            onClick={function () {
              window.location.href = 'https://billing.erendirasboutique.com/admin';
            }}
          >
            Admin
          </button>
        </div>

      <div className="eb-grid">
        <div className="eb-card">
          <img src="/logo2.png" className="eb-logo" alt="Erendira&#8217;s Boutique" />
          <h1 className="eb-title">Welcome Back to Erendira&#8217;s Boutique</h1>

          {message && <div className="eb-alert">{message}</div>}

          <form onSubmit={login}>
            <div className="eb-fields">
              <input
                className="eb-input"
                type="email"
                placeholder="Email"
                value={email}
                onChange={function (e) {
                  setEmail(e.target.value);
                }}
                required
              />
              <input
                className="eb-input"
                type="password"
                placeholder="Password"
                value={password}
                onChange={function (e) {
                  setPassword(e.target.value);
                }}
                required
              />
              <div className="eb-forgot">
                <button
                  type="button"
                  onClick={function () {
                    setMessage('Ask an admin to reset your password.');
                  }}
                >
                  Forgot password
                </button>
              </div>
            </div>

            <button className="eb-login" type="submit" disabled={busy}>
              {busy ? 'Signing in...' : 'Log in'}
            </button>
          </form>

          <button className="eb-google" type="button" onClick={signInWithGoogle} disabled={busy}>
            <GoogleG />
            <span>Continue with Google</span>
          </button>

          <p className="eb-foot">Admin access only &middot; need an account? Ask an admin.</p>
        </div>

        <div className="eb-art">
          <Storefront />
        </div>
      </div>
    </main>
  );
}
