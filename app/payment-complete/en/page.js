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
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    tick();
    const timer = setInterval(tick, 1000);

    const sessionId =
      new URLSearchParams(window.location.search).get('session_id') || '';
    fetch(
      `/api/payment-complete/session?session_id=${encodeURIComponent(sessionId)}`,
      { cache: 'no-store' }
    )
      .then((res) => res.json())
      .then(setPayment)
      .catch(() => setPayment({ productName: 'Boutique Payment' }));

    return () => clearInterval(timer);
  }, []);

  const name = payment?.productName || payment?.name || 'Boutique Payment';
  const amountText = payment?.amount ? money(payment.amount, payment.currency) : '';

  return (
    <main className="ebcPage">
      <section className="ebcShell">
        <div className="ebcVideoWrap">
          <video
            className="ebcVideo"
            src="/confirmation-video.mp4"
            autoPlay
            muted
            loop
            playsInline
          />
          <div className="ebcVideoScrimTop" />
          <div className="ebcVideoScrimBottom" />
          <div className="ebcTop">
            <span className="ebcTime">{time}</span>
            <span className="ebcTopLabel">Payment Confirmation</span>
          </div>
        </div>

        <section className="ebcCard">
          <div className="ebcCheck">
            {!imageMissing ? (
              <img
                src="/checkmark.png"
                alt="Payment confirmed"
                className="ebcCheckImg"
                onError={() => setImageMissing(true)}
              />
            ) : (
              <span className="ebcCheckFallback">Paid</span>
            )}
          </div>

          <p className="ebcOverline">Payment Confirmation</p>
          <h1 className="ebcTitle">Thanks For Your Payment!</h1>

          <div className="ebcPayment">
            <span className="ebcPayName">{name}</span>
            {amountText && <span className="ebcPayAmount">{amountText}</span>}
          </div>

          <div className="ebcText">
            <p>
              Your transaction has been successfully processed, and we&rsquo;re
              pleased to confirm receipt of your payment.
            </p>
            <p>
              You&rsquo;ll receive an email confirmation shortly with the details
              of your purchase.
            </p>
            <p>
              Please keep this confirmation for your records. If you need help,
              you can contact us anytime.
            </p>
          </div>

          <nav className="ebcLinks">
            <a href="https://www.erendirasboutique.com/legal/payments">Legal</a>
            <a href="https://returns.erendirasboutique.com">Returns</a>
            <a href="https://www.erendirasboutique.com/contact">Contact</a>
            <a className="ebcLinkPrimary" href="https://my.erendirasboutique.com">
              Customer Portal
            </a>
          </nav>
        </section>
      </section>

      <style jsx global>{`
        @font-face {
          font-family: 'La Luxes Serif';
          src: url('/fonts/la_luxes_serif.otf') format('opentype');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        @font-face {
          font-family: 'Recoleta';
          src: url('/fonts/recoleta-regular.otf') format('opentype');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
      `}</style>

      <style jsx>{`
        .ebcPage {
          min-height: 100vh;
          margin: 0;
          padding: 24px 16px 48px;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          background: #f5f3ef;
          font-family: 'Recoleta', Georgia, serif;
          color: #3d3428;
        }
        .ebcShell {
          width: 100%;
          max-width: 460px;
          background: #f5f3ef;
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 24px 60px -28px rgba(61, 52, 40, 0.35);
        }

        /* ---- Cinematic video hero ---- */
        .ebcVideoWrap {
          position: relative;
          width: 100%;
          height: clamp(240px, 46vh, 400px);
          background: #bda891;
          overflow: hidden;
        }
        .ebcVideo {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .ebcVideoScrimTop {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 96px;
          background: linear-gradient(
            to bottom,
            rgba(45, 37, 28, 0.34),
            rgba(45, 37, 28, 0)
          );
          pointer-events: none;
        }
        .ebcVideoScrimBottom {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 130px;
          background: linear-gradient(
            to top,
            #f5f3ef 6%,
            rgba(245, 243, 239, 0)
          );
          pointer-events: none;
        }
        .ebcTop {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 22px;
          color: #fdfcfa;
        }
        .ebcTime {
          font-family: 'La Luxes Serif', Georgia, serif;
          font-size: 17px;
          letter-spacing: 0.5px;
        }
        .ebcTopLabel {
          font-size: 12.5px;
          letter-spacing: 0.4px;
          opacity: 0.92;
        }

        /* ---- Confirmation card, pulled up over the seam ---- */
        .ebcCard {
          position: relative;
          z-index: 3;
          margin-top: -54px;
          padding: 0 26px 34px;
          text-align: center;
        }
        .ebcCheck {
          width: 78px;
          height: 78px;
          margin: 0 auto 16px;
          border-radius: 22px;
          background: #ffffff;
          box-shadow: 0 12px 26px -8px rgba(61, 52, 40, 0.28);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ebcCheckImg {
          width: 46px;
          height: 46px;
          object-fit: contain;
        }
        .ebcCheckFallback {
          font-family: 'La Luxes Serif', Georgia, serif;
          font-size: 16px;
          color: #806a52;
        }
        .ebcOverline {
          margin: 0 0 8px;
          font-size: 11px;
          letter-spacing: 2.4px;
          text-transform: uppercase;
          color: #bda891;
        }
        .ebcTitle {
          margin: 0 0 18px;
          font-family: 'La Luxes Serif', Georgia, serif;
          font-weight: 400;
          font-size: clamp(30px, 8.5vw, 40px);
          line-height: 1.02;
          color: #806a52;
        }

        /* ---- Product name + amount line item ---- */
        .ebcPayment {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          max-width: 320px;
          margin: 0 auto 22px;
          padding: 13px 18px;
          border: 1px solid #e2d9cc;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.55);
        }
        .ebcPayName {
          font-size: 14px;
          color: #4a3f33;
          text-align: left;
        }
        .ebcPayAmount {
          font-family: 'La Luxes Serif', Georgia, serif;
          font-size: 20px;
          color: #806a52;
          white-space: nowrap;
        }

        .ebcText {
          max-width: 340px;
          margin: 0 auto 24px;
        }
        .ebcText p {
          margin: 0 0 12px;
          font-size: 14px;
          line-height: 1.62;
          color: #5b4f40;
        }
        .ebcText p:last-child {
          margin-bottom: 0;
        }

        /* ---- Footer link pills ---- */
        .ebcLinks {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
          justify-content: center;
        }
        .ebcLinks a {
          font-size: 12.5px;
          padding: 8px 16px;
          border: 1px solid #d8ccbb;
          border-radius: 22px;
          color: #806a52;
          text-decoration: none;
          transition: background 0.18s ease, color 0.18s ease;
        }
        .ebcLinks a:hover {
          background: #efe9e0;
        }
        .ebcLinkPrimary {
          background: #806a52;
          border-color: #806a52 !important;
          color: #f5f3ef !important;
        }
        .ebcLinkPrimary:hover {
          background: #6d5943 !important;
        }
        .ebcLinks a:focus-visible {
          outline: 2px solid #806a52;
          outline-offset: 2px;
        }

        @media (prefers-reduced-motion: reduce) {
          .ebcVideo {
            /* Static poster frame still shows; motion handled by the file */
          }
        }
      `}</style>
    </main>
  );
}
