'use client';

// components/LiveLinkAdmin.js
// One field. Paste the link after the live ends, hit save, done.

import { useCallback, useEffect, useState } from 'react';
import { describeAge, isStale } from '@/lib/liveLink';

export default function LiveLinkAdmin() {
  const [value, setValue] = useState('');
  const [saved, setSaved] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [updatedBy, setUpdatedBy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [justSaved, setJustSaved] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/live-link', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load the current link.');

      setValue(data.url || '');
      setSaved(data.url || '');
      setUpdatedAt(data.updated_at);
      setUpdatedBy(data.updated_by);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/live-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save the link.');

      setValue(data.url);
      setSaved(data.url);
      setUpdatedAt(data.updated_at);
      setUpdatedBy(data.updated_by);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2600);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function onKeyDown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (!saving && dirty) save();
    }
  }

  const dirty = value.trim() !== (saved ?? '').trim();
  const stale = isStale(updatedAt);
  const age = describeAge(updatedAt);

  return (
    <section className="wrap">
      <header className="head">
        <p className="eyebrow">Live sales</p>
        <h1 className="title">This week&rsquo;s link</h1>
        <p className="sub">
          Anyone who opens <strong>live.erendirasboutique.com</strong> lands wherever this
          points. Paste the new video link after each live.
        </p>
      </header>

      {loading ? (
        <p className="muted">Loading&hellip;</p>
      ) : (
        <>
          <div className={`status ${stale ? 'is-stale' : 'is-fresh'}`}>
            <span className="dot" aria-hidden="true" />
            <span className="status-text">
              {updatedAt ? (
                <>
                  Updated {age}
                  {updatedBy ? ` by ${updatedBy}` : ''}
                  {stale ? ' — probably last week&rsquo;s' : ''}
                </>
              ) : (
                <>No link set. Visitors go to the boutique&rsquo;s Facebook page for now.</>
              )}
            </span>
          </div>

          <label className="label" htmlFor="live-url">
            Facebook video link
          </label>
          <input
            id="live-url"
            className="input"
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck="false"
            placeholder="https://www.facebook.com/..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={saving}
          />

          {error && <p className="error">{error}</p>}

          <div className="actions">
            <button className="save" onClick={save} disabled={saving || !dirty}>
              {saving ? 'Saving…' : justSaved ? 'Saved' : 'Save link'}
            </button>

            {saved && (
              <a className="check" href="/live" target="_blank" rel="noreferrer">
                Test the redirect
              </a>
            )}
          </div>

          <p className="note">
            The video has to be set to <strong>Public</strong> on Facebook, or customers who
            aren&rsquo;t your friends will hit a login wall.
          </p>
        </>
      )}

      <style jsx>{`
        .wrap {
          --cream: #f5f3ef;
          --taupe: #806a52;
          --sand: #bda891;
          --ink: #3d3428;
          --ink-soft: #4a3f33;
          --amber: #a8702f;

          max-width: 34rem;
          margin: 0 auto;
          padding: 3rem 1.5rem 4rem;
          background: var(--cream);
          color: var(--ink);
          font-family: 'Recoleta', Georgia, serif;
        }

        .head {
          margin-bottom: 2.25rem;
        }

        .eyebrow {
          margin: 0 0 0.5rem;
          font-size: 0.6875rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--sand);
        }

        .title {
          margin: 0 0 0.75rem;
          font-family: 'La Luxes Serif', Georgia, serif;
          font-size: clamp(1.75rem, 5vw, 2.375rem);
          font-weight: 400;
          line-height: 1.15;
          color: var(--ink);
        }

        .sub {
          margin: 0;
          font-size: 0.9375rem;
          line-height: 1.6;
          color: var(--ink-soft);
        }

        .sub strong {
          font-weight: 600;
          color: var(--taupe);
        }

        .status {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          margin-bottom: 1.75rem;
          padding: 0.75rem 0.875rem;
          border-radius: 2px;
          background: rgba(189, 168, 145, 0.14);
          font-size: 0.8125rem;
          color: var(--ink-soft);
        }

        .dot {
          flex: none;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--taupe);
        }

        .is-stale .dot {
          background: var(--amber);
        }

        .is-stale {
          background: rgba(168, 112, 47, 0.1);
        }

        .status-text {
          line-height: 1.4;
        }

        .label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.75rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--taupe);
        }

        .input {
          width: 100%;
          padding: 0.8125rem 0.875rem;
          border: 1px solid var(--sand);
          border-radius: 2px;
          background: #fff;
          color: var(--ink);
          font-family: inherit;
          font-size: 0.9375rem;
          transition: border-color 0.15s ease;
        }

        .input::placeholder {
          color: rgba(61, 52, 40, 0.35);
        }

        .input:focus {
          outline: 2px solid var(--taupe);
          outline-offset: 2px;
          border-color: var(--taupe);
        }

        .input:disabled {
          opacity: 0.6;
        }

        .error {
          margin: 0.75rem 0 0;
          font-size: 0.8125rem;
          line-height: 1.5;
          color: #8c3a2b;
        }

        .actions {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          margin-top: 1.5rem;
        }

        .save {
          padding: 0.75rem 1.75rem;
          border: none;
          border-radius: 2px;
          background: var(--taupe);
          color: var(--cream);
          font-family: inherit;
          font-size: 0.875rem;
          letter-spacing: 0.04em;
          cursor: pointer;
          transition: background 0.15s ease, opacity 0.15s ease;
        }

        .save:hover:not(:disabled) {
          background: var(--ink-soft);
        }

        .save:focus-visible {
          outline: 2px solid var(--ink);
          outline-offset: 2px;
        }

        .save:disabled {
          opacity: 0.4;
          cursor: default;
        }

        .check {
          font-size: 0.8125rem;
          color: var(--taupe);
          text-decoration: none;
          border-bottom: 1px solid var(--sand);
          padding-bottom: 1px;
        }

        .check:hover {
          color: var(--ink);
          border-color: var(--taupe);
        }

        .check:focus-visible {
          outline: 2px solid var(--taupe);
          outline-offset: 3px;
        }

        .note {
          margin: 2.5rem 0 0;
          padding-top: 1.25rem;
          border-top: 1px solid rgba(189, 168, 145, 0.4);
          font-size: 0.8125rem;
          line-height: 1.6;
          color: var(--ink-soft);
        }

        .note strong {
          font-weight: 600;
          color: var(--taupe);
        }

        .muted {
          font-size: 0.875rem;
          color: var(--sand);
        }

        @media (prefers-reduced-motion: reduce) {
          .save,
          .input {
            transition: none;
          }
        }
      `}</style>
    </section>
  );
}
