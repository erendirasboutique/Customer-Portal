'use client';

// components/shop/GiftCardSalesActions.js
// Row buttons on /admin/gift-card-sales: Retry, Resend email, PDF.

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GiftCardSalesActions(props) {
  const o = props.order;
  const router = useRouter();
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState('');

  async function run(action) {
    if (action === 'resend' && !confirm('Email this gift card again now?')) return;
    setBusy(action);
    setNote('');
    try {
      const res = await fetch('/api/admin/gift-card-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: action, id: o.id }),
      });
      const data = await res.json().catch(function () { return {}; });
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      setNote(data.message || 'Done.');
      router.refresh();
    } catch (e) {
      setNote(e.message);
    } finally {
      setBusy('');
    }
  }

  const canRetry = o.status === 'failed' || o.status === 'fulfilling';
  const canResend = o.status === 'fulfilled' && props.canEmail && o.has_email;

  return (
    <span className="eba-rowbtns">
      {canRetry && (
        <button className="eba-btn eba-btn-dark mini" type="button" disabled={Boolean(busy)} onClick={function () { run('retry'); }}>
          {busy === 'retry' ? 'Retrying...' : 'Retry'}
        </button>
      )}
      {canResend && (
        <button className="eba-btn mini" type="button" disabled={Boolean(busy)} onClick={function () { run('resend'); }}>
          {busy === 'resend' ? 'Sending...' : o.email_status === 'scheduled' ? 'Send now' : 'Resend email'}
        </button>
      )}
      {o.pdf_url && (
        <a className="eba-btn mini" href={o.pdf_url} target="_blank" rel="noopener noreferrer">PDF</a>
      )}
      {note && <span className="eba-muted" style={{ flexBasis: '100%' }}>{note}</span>}
    </span>
  );
}
