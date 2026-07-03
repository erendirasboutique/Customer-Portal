'use client';
import { useState } from 'react';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';

export default function AdminLogin(){
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [message,setMessage]=useState('');
  async function login(e){
    e.preventDefault(); setMessage('Signing in...');
    const supabase=getSupabaseBrowser();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if(error || !data.session?.access_token){ setMessage('Wrong admin email or password.'); return; }
    const res=await fetch('/api/admin/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accessToken:data.session.access_token})});
    const json=await res.json();
    if(!res.ok){ setMessage(json.error || 'This account is not an active admin.'); return; }
    window.location.href='/admin';
  }
  return <main className="page"><span className="flower one">✿</span><span className="flower two">❀</span><div className="shell"><section className="hero"><div className="card loginCard"><img src="/logo2.png" className="logo" alt="Erendira's Boutique"/><p className="eyebrow">Admin only</p><h1>Billing Studio</h1><p>Sign in to review Stripe and Clover payments, receipts, customers, exports, and private notes.</p><form onSubmit={login}><label className="field">Admin email<input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label className="field">Password<input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label><button className="button secondary" type="submit">Sign in</button></form>{message && <div className="notice">{message}</div>}</div><div className="card brandShowcase"><img src="/logo.png" alt="Erendira's Boutique logo"/></div></section></div></main>;
}
