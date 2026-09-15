// app/admin/sezzle-links/page.js
// Renders at: /admin/sezzle-links   (separate from your Stripe generator)
// Place behind the same auth guard your other /admin pages use.
import SezzlePaymentLinkPanel from '@/components/SezzlePaymentLinkPanel';

export default function SezzleLinksPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 16, color: '#3d3128' }}>Sezzle payment links</h1>
      <SezzlePaymentLinkPanel />
    </main>
  );
}
