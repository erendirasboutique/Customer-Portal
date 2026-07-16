// app/admin/live-link/page.js

import { redirect } from 'next/navigation';
import { getAdminUser } from '@/lib/requireAdmin';
import LiveLinkAdmin from '@/components/LiveLinkAdmin';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Live Link — Erendira's Boutique",
};

export default async function LiveLinkPage() {
  // Same guard as app/admin/page.js. Without this the page renders for anyone.
  const admin = await getAdminUser();
  if (!admin) redirect('/admin/login');

  return <LiveLinkAdmin />;
}
