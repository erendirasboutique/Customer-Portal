'use client';

// components/account/TeamManager.js
// Invite form + roster for /admin/team. Talks to /api/admin/team,
// then refreshes the server page so the stats stay in sync.

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ROLE_LABEL = { owner: 'Owner', admin: 'Admin', staff: 'Staff' };

function initials(name) {
  return (name || '?')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(function (w) { return w[0]; })
    .join('')
    .toUpperCase();
}

const pageCss = '' +
'.eat-row { align-items:center; }' +
'.eat-av { width:38px; height:38px; border-radius:50%; flex-shrink:0; display:inline-flex; align-items:center;' +
'  justify-content:center; background:var(--line); color:var(--taupe); font-size:12.5px; }' +
'.eat-you { margin-left:6px; font-size:9px; letter-spacing:.14em; text-transform:uppercase; color:var(--sand); }' +
'.eat-role { padding:7px 30px 7px 13px; font-size:11.5px; }';

export default function TeamManager(props) {
  const router = useRouter();
  const members = props.members || [];
  const canManage = props.canManage;
  const isOwner = props.myRole === 'owner';

  const [form, setForm] = useState({ name: '', email: '', role: 'staff', sendInvite: true });
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function updateForm(field, value) {
    setForm(function (current) { return { ...current, [field]: value }; });
  }

  async function call(method, body) {
    const res = await fetch('/api/admin/team', {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(function () { return {}; });
    if (!res.ok) throw new Error(data.error || 'Something went wrong.');
    return data;
  }

  async function invite(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setBusy('invite');
    try {
      const data = await call('POST', form);
      setMessage(['Added ' + form.email + '.', data.note].filter(Boolean).join(' '));
      setForm({ name: '', email: '', role: 'staff', sendInvite: form.sendInvite });
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  }

  async function changeRole(member, role) {
    if (role === member.role) return;
    setError('');
    setMessage('');
    setBusy(member.id);
    try {
      await call('PATCH', { id: member.id, role: role });
      setMessage((member.name || member.email) + ' is now ' + ROLE_LABEL[role] + '.');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  }

  async function remove(member) {
    if (!confirm('Remove ' + (member.name || member.email) + ' from the team?')) return;
    setError('');
    setMessage('');
    setBusy(member.id);
    try {
      await call('DELETE', { id: member.id });
      setMessage('Removed ' + (member.name || member.email) + '.');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  }

  return (
    <>
      <style>{pageCss}</style>

      {canManage && (
        <form className="eba-panel" onSubmit={invite}>
          <div className="eba-panelhead">
            <div>
              <p className="eba-eyebrow">START HERE</p>
              <h2>Invite Someone</h2>
            </div>
          </div>

          <div className="eba-formrow even">
            <div>
              <span className="eba-lb">Name</span>
              <input className="eba-in" value={form.name} onChange={function (e) { updateForm('name', e.target.value); }} placeholder="Maria Lopez" />
            </div>
            <div>
              <span className="eba-lb">Email</span>
              <input className="eba-in" type="email" required value={form.email} onChange={function (e) { updateForm('email', e.target.value); }} placeholder="maria@example.com" />
            </div>
          </div>

          <div className="eba-checks">
            <label className="eba-check">
              <span>Role</span>
              <select className="eba-select" value={form.role} onChange={function (e) { updateForm('role', e.target.value); }}>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
                {isOwner && <option value="owner">Owner</option>}
              </select>
            </label>
            <label className="eba-check">
              <input type="checkbox" checked={form.sendInvite} onChange={function (e) { updateForm('sendInvite', e.target.checked); }} />
              <span>Email them a sign-in invite</span>
            </label>
          </div>

          <div className="eba-actions">
            <button className="eba-btn eba-btn-dark" type="submit" disabled={busy === 'invite'}>
              {busy === 'invite' ? 'Adding...' : 'Add to team'}
            </button>
          </div>

          {error && <div className="eba-err">{error}</div>}
          {message && <div className="eba-notice">{message}</div>}
        </form>
      )}

      <div className="eba-panel">
        <div className="eba-panelhead">
          <div>
            <p className="eba-eyebrow">ROSTER</p>
            <h2>Team Members</h2>
          </div>
        </div>

        {!canManage && (
          <div className="eba-notice" style={{ marginTop: 0, marginBottom: 14 }}>
            You can see the team, but only owners and admins can make changes.
          </div>
        )}
        {!canManage && error && <div className="eba-err">{error}</div>}

        {!members.length ? (
          <div className="eba-empty">No one on the team yet.</div>
        ) : (
          <div className="eba-rows">
            {members.map(function (m) {
              const isMe = m.email.toLowerCase() === props.myEmail;
              const lockOwner = m.role === 'owner' && !isOwner;
              return (
                <div className="eba-row eat-row" key={m.id}>
                  <span className="eat-av">{initials(m.name || m.email)}</span>
                  <span className="eba-who">
                    <span className="n">
                      {m.name || m.email}
                      {isMe && <span className="eat-you">You</span>}
                    </span>
                    <span className="s">{m.email} &middot; Added {m.invited_label}</span>
                  </span>
                  <span className={m.status === 'active' ? 'eba-pill ok' : 'eba-pill mid'}>
                    {m.status === 'active' ? 'Active' : 'Invited'}
                  </span>
                  {canManage && !lockOwner ? (
                    <span className="eba-rowbtns">
                      <select
                        className="eba-select eat-role"
                        value={m.role}
                        disabled={busy === m.id}
                        onChange={function (e) { changeRole(m, e.target.value); }}
                        aria-label={'Role for ' + m.email}
                      >
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                        {(isOwner || m.role === 'owner') && <option value="owner">Owner</option>}
                      </select>
                      {!isMe && (
                        <button className="eba-btn mini" type="button" disabled={busy === m.id} onClick={function () { remove(m); }}>
                          Remove
                        </button>
                      )}
                    </span>
                  ) : (
                    <span className="eba-pill off">{ROLE_LABEL[m.role] || m.role}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
