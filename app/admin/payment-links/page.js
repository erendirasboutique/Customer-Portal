// app/admin/payment-links/page.js
// Renders at: /admin/payment-links
// Place this behind your existing admin auth (same guard your other /admin pages use).
import SezzlePaymentLinkPanel from '@/components/SezzlePaymentLinkPanel';

export default function PaymentLinksPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 16, color: '#3d3128' }}>Payment links</h1>
      <SezzlePaymentLinkPanel />
    </main>
  );
}
