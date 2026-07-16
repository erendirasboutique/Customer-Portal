// app/admin/live-link/page.js

import LiveLinkAdmin from '@/components/LiveLinkAdmin';

export const metadata = {
  title: "Live link — Erendira's Boutique",
};

export const dynamic = 'force-dynamic';

export default function LiveLinkPage() {
  return <LiveLinkAdmin />;
}
