'use client';

import { useMemo, useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';
import { money, formatDate, formatAddress, paymentMethodLabel } from '@/lib/format';
import LanguageToggle from './LanguageToggle';

function orderStatus(payment) {
  if (payment.refund_status === 'refunded') return 'Refunded';
  if (payment.tracking_number) return 'Shipped';
  if (payment.payment_status === 'paid') return 'Paid';
  return payment.payment_status || 'Unknown';
}

export default function CustomerPortal({ initialUser, initialPayments }) {
  const [lang, setLang] = useState('en');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const supabase = getSupabaseBrowser();
  const payments = initialPayments || [];
  const name = payments.find(p => p.customer_name)?.customer_name || initialUser?.email || 'Customer';
  const total = payments.reduce((sum, p) => sum + Number(p.amount_total || 0), 0);
  const latest = payments[0];

  async function sendMagicLink(e) {
    e.preventDefault();
    setMessage('Sending secure login link...');
    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    setMessage(error ? error.message : 'Check your email for the secure login link.');
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  if (!initialUser) {
    return (
      <main className="page">
        <span className="flower one">✿</span><span className="flower two">❀</span>
        <div className="shell">
          <div className="topbar">
            <div className="brand">
              <img src="/logo.png" className="logo" alt="Erendira's Boutique" />
              <div className="brand-title">Erendira&apos;s Boutique</div>
            </div>
            <LanguageToggle lang={lang} setLang={setLang} />
          </div>
          <section className="hero">
            <div className="card loginCard">
              <p className="eyebrow">Secure billing portal</p>
              <h1>{lang === 'es' ? 'Tus pagos, en un solo lugar.' : 'Your payments, beautifully organized.'}</h1>
              <p>{lang === 'es' ? 'Ingresa con el mismo correo que usaste para pagar.' : 'Sign in with the email you used at checkout to view your lifetime payment history, receipts, and order status.'}</p>
              <form onSubmit={sendMagicLink}>
                <label className="field">
                  Email
                  <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@email.com" />
                </label>
                <button className="button secondary" type="submit">Send secure link</button>
              </form>
              {message && <div className="notice">{message}</div>}
            </div>
            <div className="card brandShowcase">
              <img src="/logo.png" alt="Erendira's Boutique" />
            </div>
          </section>
          <div className="footer">Erendira&apos;s Boutique LLC</div>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <span className="flower one">✿</span><span className="flower two">❀</span>
      <div className="shell customerDashboard">
        <div className="topbar">
          <div className="brand">
            <img src="/logo.png" className="logo" alt="Erendira's Boutique" />
            <div className="brand-title">Erendira&apos;s Boutique</div>
          </div>
          <div className="lang">
            <LanguageToggle lang={lang} setLang={setLang} />
            <button className="button ghost mini" onClick={logout}>Logout</button>
          </div>
        </div>

        <section className="customerHero">
          <div>
            <p className="eyebrow">{lang === 'es' ? 'Bienvenida de nuevo' : 'Welcome back'}</p>
            <h1>{name} 🌸</h1>
            <p>{lang === 'es' ? 'Aquí puedes ver tus pagos, recibos y estado de pedido.' : 'Here is your Erendira’s Boutique payment history, receipts, and order status.'}</p>
          </div>
        </section>

        <div className="customerStats">
          <div className="stat highlight"><span>Lifetime Purchases</span><b>{money(total)}</b></div>
          <div className="stat"><span>Total Orders</span><b>{payments.length}</b></div>
          <div className="stat"><span>Latest Order</span><b>{latest ? formatDate(latest.created_at) : '—'}</b></div>
        </div>

        <section className="paymentList">
          {payments.map((p) => (
            <article className="orderCard customerPaymentCard" key={p.id || p.stripe_session_id || p.clover_payment_id}>
              <div className="orderTop">
                <div className="customerBlock">
                  <p className="eyebrow">{formatDate(p.created_at)}</p>
                  <h3>{money(p.amount_total, p.currency)}</h3>
                  <p>{paymentMethodLabel(p)}</p>
                </div>
                <div className="amountBlock">
                  <span className={`pill source-${p.payment_source || 'stripe'}`}>{p.payment_source || 'stripe'}</span>
                  <span className="pill">{orderStatus(p)}</span>
                </div>
              </div>
              <div className="quickDetails">
                <div><b>Receipt</b><p>{p.receipt_url ? <a href={p.receipt_url} target="_blank" rel="noopener noreferrer">Open receipt</a> : '—'}</p></div>
                <div><b>Description</b><p>{p.description || 'Boutique purchase'}</p></div>
                <div><b>Shipping</b><p>{formatAddress(p.shipping_address)}</p></div>
                <div><b>Tracking</b><p>{p.tracking_url ? <a href={p.tracking_url} target="_blank" rel="noopener noreferrer">{p.tracking_number || 'Track package'}</a> : (p.tracking_number || 'Not shipped yet')}</p></div>
              </div>
              <div className="orderTimeline">
                <span className="step done">Paid</span>
                <span className={`step ${p.tracking_number ? 'done' : ''}`}>Shipped</span>
                <span className={`step ${p.delivered_at ? 'done' : ''}`}>Delivered</span>
              </div>
            </article>
          ))}
          {payments.length === 0 && <div className="emptyState">No payments found for this email yet.</div>}
        </section>
      </div>
    </main>
  );
}
