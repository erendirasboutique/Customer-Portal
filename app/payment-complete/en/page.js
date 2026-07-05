'use client';

import { useEffect, useState } from 'react';

function money(amount, currency = 'usd') {
  if (amount === null || amount === undefined) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: String(currency || 'usd').toUpperCase(),
  }).format(amount);
}

export default function Page() {
  const [time, setTime] = useState('');
  const [payment, setPayment] = useState(null);
  const [imageMissing, setImageMissing] = useState(false);

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString([], {
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
}));
    tick();
    const timer = setInterval(tick, 1000);

    const sessionId = new URLSearchParams(window.location.search).get('session_id') || '';
    fetch(`/api/payment-complete/session?session_id=${encodeURIComponent(sessionId)}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then(setPayment)
      .catch(() => setPayment({ productName: 'Boutique Payment' }));

    return () => clearInterval(timer);
  }, []);

  const name = payment?.productName || payment?.name || 'Boutique Payment';
  const amountText = payment?.amount ? money(payment.amount, payment.currency) : '';

  return (
    <main className="ebConfirmPage">
      <section className="ebConfirmShell">
        <div className="ebConfirmTop">
          <span>{time}</span>
          <span>Erendira&apos;s Bouti2222que</span>
        </div>

        <div className="ebConfirmBrand">
          <img src="/logo2.png" alt="Erendira's Boutique" />
        </div>

        <section className="ebSuccessCard">
          <div className="ebSuccessImageWrap">
            {!imageMissing ? (
              <img src="/checkmark.png" alt="Payment confirmed" className="ebSuccessImage" onError={() => setImageMissing(true)} />
            ) : (
              <div className="ebSuccessFallback">Paid</div>
            )}
          </div>

          <p className="ebOverline">Payment Confirmation</p>
          <h1>Payment confirmed</h1>

          <div className="ebPaymentInfo">
            <span>{name}</span>
            {amountText && <b>{amountText}</b>}
          </div>

          <div className="ebConfirmText">
            <p>Thank you for your payment. Your transaction was processed successfully.</p>
            <p>You’ll receive an email confirmation shortly with the details of your purchase.</p>
            <p>Please keep this confirmation for your records. If you need help, you can contact us anytime.</p>
          </div>

          <nav className="ebConfirmLinks">
            <a href="https://www.erendirasboutique.com/legal">Legal</a>
            <a href="https://www.erendirasboutique.com/returns">Returns</a>
            <a href="https://www.erendirasboutique.com/contact">Contact</a>
            <a href="/">Customer Portal</a>
          </nav>
        </section>
      </section>
    </main>
  );
}
