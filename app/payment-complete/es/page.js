'use client';

import { useEffect, useState } from 'react';

function money(amount, currency = 'usd') {
  if (amount === null || amount === undefined) return '';
  return new Intl.NumberFormat('es-US', { style: 'currency', currency: String(currency || 'usd').toUpperCase() }).format(amount);
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
        <h1 dangerouslySetInnerHTML={{ __html: `Gracias Por Su<br />Pago!` }} />
        <p>Su transacción se ha procesado correctamente y nos complace confirmar la recepción de su pago.</p>
        <p>En breve recibirá un correo electrónico de confirmación con todos los detalles relevantes.</p>
        <p>Guarde esta confirmación para sus registros. Si tiene alguna pregunta sobre su pago, no dude en comunicarse con nosotros.</p>
        <nav className="confirmationLinks">
          <a href="https://www.erendirasboutique.com/legal">Legales</a>
          <a href="https://www.erendirasboutique.com/returns">Devoluciones</a>
          <a href="https://www.erendirasboutique.com/contact">Contacto</a>
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
