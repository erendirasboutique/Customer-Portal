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
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  function go(lang) {
    window.location.href = `/payment-complete/${lang}${sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : ''}`;
  }

  return (
    <main className="ebConfirmPage ebLanguagePage">
      <section className="ebConfirmShell">
        <div className="ebConfirmTop">
          <span>{time}</span>
          <span>Payment Confirmation</span>
        </div>

        <div className="ebConfirmBrand">
          <img src="/logo.png" alt="Erendira's Boutique" />
        </div>

        <section className="ebLanguageCard">
          <p className="ebOverline">Payment Confirmation</p>
          <h1>Please Select A Language
</h1>
          <p className="ebSubtext">Por Favor, Seleccione Un Idioma
</p>

          <div className="ebLanguageActions">
            <button type="button" onClick={() => go('es')}>
              <span>Español</span>
              <small>Ver confirmación en Español</small>
            </button>
            <button type="button" onClick={() => go('en')}>
              <span>English</span>
              <small>View confirmation in English</small>
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
