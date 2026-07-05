'use client';

import { useEffect, useState } from 'react';

function money(amount, currency = 'usd') {
  if (amount === null || amount === undefined) return '';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: String(currency || 'usd').toUpperCase() }).format(amount);
}

export default function Page() {
  const [time, setTime] = useState('');
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
    tick();
    const t = setInterval(tick, 1000);
    const sessionId = new URLSearchParams(window.location.search).get('session_id') || '';
    fetch(`/api/payment-complete/session?session_id=${encodeURIComponent(sessionId)}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then(setPayment)
      .catch(() => setPayment({ productName: 'Boutique Payment' }));
    return () => clearInterval(t);
  }, []);

  const name = payment?.productName || payment?.name || 'Boutique Payment';
  const amountText = payment?.amount ? money(payment.amount, payment.currency) : '';

  return (
    <main className="confirmationPage">
      <div className="mobileTime">{time}</div>
      <div className="announcementBar">Envios Todos Los Sabados!<span>×</span></div>

      <header className="confirmationHeader">
        <div className="headerIcon">＋</div>
        <img src="/logo.png" alt="Erendira's Boutique" />
        <div className="bagIcon">⌑</div>
      </header>

      <section className="confirmationContent">
        <div className="checkCard"><div className="checkMark">✓</div></div>
        <p className="paymentName">{name}{amountText ? ` • ${amountText}` : ''}</p>
        <h1 dangerouslySetInnerHTML={{ __html: `Thanks For<br />Your Payment!` }} />
        <p>Your transaction has been successfully processed, and we’re pleased to confirm receipt of your payment.</p>
        <p>You will receive an email confirmation shortly with all the relevant details, including a summary of your purchase.</p>
        <p>Please keep this confirmation for your records. If you have any questions or concerns about your payment, don’t hesitate to reach out to us.</p>
        <nav className="confirmationLinks">
          <a href="https://www.erendirasboutique.com/legal">Legal</a>
          <a href="https://www.erendirasboutique.com/returns">Returns</a>
          <a href="https://www.erendirasboutique.com/contact">Contact</a>
          <a href="/">Customer Portal</a>
        </nav>
      </section>

      <div className="confirmationWave" />

      <section className="confirmationSocial">
        <img src="/logo-icon.png" alt="Erendira's Boutique" />
        <div className="socialIcons"><span>f</span><span>◎</span><span>♪</span><span>✉</span></div>
        <a href="https://www.erendirasboutique.com">erendirasboutique.com</a>
      </section>
    </main>
  );
}
