'use client';

import { useEffect, useMemo, useState } from 'react';

export default function PaymentCompleteLanguagePage() {
  const [time, setTime] = useState('');

  const sessionId = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('session_id') || '';
  }, []);

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  function go(lang) {
    window.location.href = `/payment-complete/${lang}${sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : ''}`;
  }

  return (
    <main className="confirmationPage confirmationLanguagePage">
      <div className="mobileTime">{time}</div>
      <div className="announcementBar">Envios Todos Los Sabados!<span>×</span></div>

      <header className="confirmationHeader">
        <div className="headerIcon">＋</div>
        <img src="/logo.png" alt="Erendira's Boutique" />
        <div className="bagIcon">⌑</div>
      </header>

      <section className="languagePanel">
        <p>Payment Confirmation</p>
        <h1>Por Favor,<br />Seleccione Un<br />Idioma</h1>
        <div className="languageDivider" />
        <h1>Please Select A<br />Language</h1>
        <div className="languageDivider" />
        <button type="button" onClick={() => go('es')}>Español</button>
        <button type="button" onClick={() => go('en')}>English</button>
      </section>

      <div className="confirmationWave" />
    </main>
  );
}
