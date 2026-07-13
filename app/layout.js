import './globals.css';

export const metadata = {
  metadataBase: new URL('https://my.erendirasboutique.com'),
  title: "Erendira's Boutique | Customer Portal",
  description: "Customer portal for Erendira's Boutique.",
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: "Erendira's Boutique | Customer Portal",
    description: "Customer portal for Erendira's Boutique.",
    url: 'https://my.erendirasboutique.com',
    siteName: "Erendira's Boutique",
    images: [
      {
        url: '/social-preview1.png',
        width: 1200,
        height: 630,
        alt: "Erendira's Boutique Customer Portal",
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Erendira's Boutique | Customer Portal",
    description: "Customer portal for Erendira's Boutique.",
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
