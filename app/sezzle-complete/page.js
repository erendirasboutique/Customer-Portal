'use client';
import { useEffect, useState } from 'react';

export default function Page() {
  const [time, setTime] = useState('');
  const [qs, setQs] = useState('');

  useEffect(() => {
    const tick = () =>
      setTime(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' }));
    tick();
    const timer = setInterval(tick, 1000);
    // Carry ALL Sezzle params through (ref, amt, plus anything Sezzle appends).
    setQs(window.location.search || '');
    return () => clearInterval(timer);
  }, []);

  const esHref = `/sezzle-complete/es${qs}`;
  const enHref = `/sezzle-complete/en${qs}`;

  return (
    <main className="eblPage">
      <section className="eblShell">
        <div className="eblVideoWrap">
          <video className="eblVideo" poster="/landing-gradient-poster.jpg" autoPlay muted loop playsInline preload="auto">
            <source src="/landing-gradient.webm" type="video/webm" />
            <source src="/landing-gradient.mp4" type="video/mp4" />
          </video>
          <div className="eblScrimTop" />
          <div className="eblScrimBottom" />
          <div className="eblTop">
            <span className="eblTime">{time}</span>
            <span className="eblTopLabel">Payment Confirmation</span>
          </div>
        </div>

        <section className="eblCard">
          <p className="eblOverline">Sezzle · Payment Confirmation</p>
          <h1 className="eblTitle">Please Select A Language</h1>
          <p className="eblSub">Por Favor, Seleccione Un Idioma</p>

          <nav className="eblOptions">
            <a className="eblOption" href={esHref} aria-label="Ver confirmación en Español">
              <span className="eblOptText">
                <span className="eblOptName">Español</span>
                <span className="eblOptHint">Ver confirmación en Español</span>
              </span>
              <i className="ti ti-chevron-right eblChev" aria-hidden="true"></i>
            </a>
            <a className="eblOption" href={enHref} aria-label="View confirmation in English">
              <span className="eblOptText">
                <span className="eblOptName">English</span>
                <span className="eblOptHint">View confirmation in English</span>
              </span>
              <i className="ti ti-chevron-right eblChev" aria-hidden="true"></i>
            </a>
          </nav>
        </section>
      </section>

      <style jsx global>{`
        @font-face { font-family:'La Luxes Serif'; src:url('/fonts/la_luxes_serif.otf') format('opentype'); font-weight:400; font-style:normal; font-display:swap; }
        @font-face { font-family:'Recoleta'; src:url('/fonts/recoleta-regular.otf') format('opentype'); font-weight:400; font-style:normal; font-display:swap; }
      `}</style>
      <style jsx>{`
        .eblPage { min-height:100vh; margin:0; padding:24px 16px 48px; display:flex; justify-content:center; align-items:center; background:#f5f3ef; font-family:'Recoleta', Georgia, serif; color:#3d3428; }
        .eblShell { width:100%; max-width:480px; background:#f5f3ef; border-radius:28px; overflow:hidden; box-shadow:0 24px 60px -28px rgba(61,52,40,.35); }
        .eblVideoWrap { position:relative; width:100%; height:clamp(230px,44vh,360px); background:#bda891 url('/landing-gradient-poster.jpg') center / cover; overflow:hidden; }
        .eblVideo { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:block; }
        .eblScrimTop { position:absolute; top:0; left:0; right:0; height:96px; background:linear-gradient(to bottom, rgba(45,37,28,.34), rgba(45,37,28,0)); pointer-events:none; }
        .eblScrimBottom { position:absolute; bottom:0; left:0; right:0; height:120px; background:linear-gradient(to top,#f5f3ef 6%, rgba(245,243,239,0)); pointer-events:none; }
        .eblTop { position:absolute; top:0; left:0; right:0; z-index:2; display:flex; justify-content:space-between; align-items:center; padding:16px 22px; color:#fdfcfa; }
        .eblTime { font-family:'La Luxes Serif', Georgia, serif; font-size:17px; letter-spacing:.5px; }
        .eblTopLabel { font-size:12.5px; letter-spacing:.4px; opacity:.92; }
        .eblCard { position:relative; z-index:3; margin-top:-34px; padding:0 26px 34px; }
        .eblOverline { margin:0 0 8px; font-size:11px; letter-spacing:2.4px; text-transform:uppercase; color:#bda891; }
        .eblTitle { margin:0 0 4px; font-family:'La Luxes Serif', Georgia, serif; font-weight:400; font-size:clamp(30px,8vw,44px); line-height:1.02; color:#806a52; }
        .eblSub { margin:0 0 22px; font-size:14px; color:#bda891; }
        .eblOptions { display:flex; flex-direction:column; gap:12px; }
        .eblOption { display:flex; align-items:center; justify-content:space-between; gap:14px; padding:17px 20px; border:1px solid #e2d9cc; border-radius:16px; background:rgba(255,255,255,.55); text-decoration:none; color:inherit; transition:background .18s ease, border-color .18s ease, transform .12s ease; }
        .eblOption:hover { background:#ffffff; border-color:#cdbfa9; }
        .eblOption:active { transform:scale(.99); }
        .eblOption:focus-visible { outline:2px solid #806a52; outline-offset:2px; }
        .eblOptText { display:flex; flex-direction:column; gap:2px; }
        .eblOptName { font-family:'La Luxes Serif', Georgia, serif; font-size:23px; color:#806a52; line-height:1.1; }
        .eblOptHint { font-size:12px; color:#8a7c6a; }
        .eblChev { font-size:22px; color:#bda891; flex-shrink:0; }
        @media (min-width:720px) { .eblShell { max-width:560px; } .eblVideoWrap { height:clamp(300px,40vh,440px); } .eblCard { padding:0 40px 42px; margin-top:-40px; } .eblOption { padding:20px 24px; } }
        @media (prefers-reduced-motion: reduce) { .eblVideo { display:none; } }
      `}</style>
    </main>
  );
}
