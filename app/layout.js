import './globals.css';

export const metadata = {
  title: "Erendira's Boutique | Billing Portal",
  description: "Customer billing portal for Erendira's Boutique.",

  openGraph: {
    title: "Erendira's Boutique | Billing Portal",
    description: "Customer billing portal for Erendira's Boutique.",
    url: 'https://billing.erendirasboutique.com',
    siteName: "Erendira's Boutique",
    images: [
      {
        url: '/social-preview1.png',
        width: 1200,
        height: 630,
        alt: "Erendira's Boutique Billing Portal",
      },
    ],
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: "Erendira's Boutique | Billing Portal",
    description: "Customer billing portal for Erendira's Boutique.",
    images: ['/social-preview1.png'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
