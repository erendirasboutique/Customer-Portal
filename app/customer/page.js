import CustomerPortal from '@/components/CustomerPortal';
import AccountApp from '@/components/account/AccountApp';
import { getSupabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

// Signed in (magic link): the same account page customers get from their
// personal link (/account?t=...). Not signed in: the email sign-in screen.
export default async function CustomerPage() {
  const supabase = await getSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return <CustomerPortal initialUser={null} initialPayments={[]} />;
  }

  return <AccountApp />;
}
