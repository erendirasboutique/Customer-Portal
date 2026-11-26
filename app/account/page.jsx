// app/account/page.jsx
// Personal link: /account?t=<token>. Same account page as /customer.
import AccountApp from "@/components/account/AccountApp";

export const metadata = {
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return <AccountApp />;
}
