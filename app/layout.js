import './globals.css';

export const metadata = {
  title: "Erendira's Boutique - Billing Portal",
  description: "Customer Billing portal",
  icons: { icon: '/favicon.png' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
