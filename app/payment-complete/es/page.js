'use client';

import { useEffect, useState } from 'react';

function money(amount, currency = 'usd') {
  if (amount === null || amount === undefined) return '';
  return new Intl.NumberFormat('es-US', {
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
          <span></span>
        </div>

       <div className="ebConfirmVideoWrap">
  <video
    className="ebConfirmVideo"
    src="/confirmation-video.mp4"
    autoPlay
    muted
    loop
    playsInline
  />
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
          <h1>Gracias Por Su Pago!
</h1>

          <div className="ebPaymentInfo">
            <span>{name}</span>
            {amountText && <b>{amountText}</b>}
          </div>

          <div className="ebConfirmText">
            <p>Gracias por su pago. Su transacción fue procesada correctamente.</p>
            <p>En breve recibirá un correo electrónico con los detalles de su compra.</p>
            <p>Guarde esta confirmación para sus registros. Si necesita ayuda, puede contactarnos en cualquier momento.</p>
          </div>

          <nav className="ebConfirmLinks">
            <a href="https://www.erendirasboutique.com/legal/payments">Legales</a>
            <a href="https://www.erendirasboutique.com/returns">Devoluciones</a>
            <a href="https://www.erendirasboutique.com/contact">Contacto</a>
            <a href="https://my.erendirasboutique.com">Customer Portal</a>
          </nav>
        </section>
      </section>
    </main>
  );
}
