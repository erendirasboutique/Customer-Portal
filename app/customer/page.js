import AccountApp from '@/components/account/AccountApp';
import SignIn from '@/components/account/SignIn';
import { getSupabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

// Signed in (email code, text code or Face ID): the same account page
// customers get from their personal link (/account?t=...).
// Not signed in: the sign-in page.
export default async function CustomerPage() {
  const supabase = await getSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || (!user.email && !user.phone)) {
    return <SignIn />;
  }

  return <AccountApp />;
}
