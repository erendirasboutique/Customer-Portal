// components/SmsPolicyPage.jsx
// Shared look for /sms/terms and /sms/privacy: logo, white card, Spanish then English.

const css = `
.smsp { --t: var(--brand-taupe, #957f67); --c: var(--brand-cream, #F5F3EF); --ink: var(--brand-ink, #332b23); --muted: #6b5f53; --line: #EAE4DC;
  --head: var(--brand-font-heading, "Charman Serif", Georgia, serif); --body: var(--brand-font-body, "Ltt Recoleta", Georgia, serif);
  min-height: 100vh; background: var(--c); color: var(--ink); font-family: var(--body); padding: 36px 20px 24px; }
.smsp a { color: var(--t); }
.smsp-wrap { max-width: 680px; margin: 0 auto; display: flex; flex-direction: column; gap: 28px; }
.smsp-logo { display: block; width: 170px; height: auto; margin: 0 auto; }
.smsp-card { background: #fff; border: 1px solid var(--line); border-radius: 24px; padding: 28px 24px; display: flex; flex-direction: column; gap: 26px; }
.smsp-h1 { margin: 0; font-family: var(--head); font-weight: 400; font-size: 30px; line-height: 1.2; color: var(--t); }
.smsp-updated { margin: 6px 0 0; font-size: 13px; color: var(--muted); }
.smsp-section { display: flex; flex-direction: column; gap: 10px; }
.smsp-h2 { margin: 0; font-family: var(--head); font-weight: 400; font-size: 21px; color: var(--t); }
.smsp-section p { margin: 0; font-size: 15px; line-height: 1.6; }
.smsp-rule { height: 1px; background: var(--line); }
.smsp-foot { display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 12px; color: var(--muted); text-align: center; }
.smsp-foot-links { display: flex; gap: 14px; }
`;

export default function SmsPolicyPage({ title, subtitle, updated, es, en }) {
  return (
    <div className="smsp">
      <style>{css}</style>
      <div className="smsp-wrap">
        <a href="/sms" aria-label="Erendira's Boutique">
          <img className="smsp-logo" src="/brand/logo.png" alt="Erendira's Boutique" />
        </a>
        <main className="smsp-card">
          <div>
            <h1 className="smsp-h1">{title}</h1>
            <p className="smsp-updated">
              {subtitle} · Actualizado / Updated: {updated}
            </p>
          </div>
          <section className="smsp-section" lang="es">
            <h2 className="smsp-h2">Español</h2>
            {es}
          </section>
          <div className="smsp-rule" />
          <section className="smsp-section" lang="en">
            <h2 className="smsp-h2">English</h2>
            {en}
          </section>
        </main>
        <footer className="smsp-foot">
          <div className="smsp-foot-links">
            <a href="/sms">Suscribirse</a>
            <a href="/sms/terms">Términos SMS</a>
            <a href="/sms/privacy">Privacidad SMS</a>
          </div>
          <span>Erendira&rsquo;s Boutique · hello@erendirasboutique.com</span>
        </footer>
      </div>
    </div>
  );
}
