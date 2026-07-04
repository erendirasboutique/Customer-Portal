import './globals.css';

export const metadata = {
  title: "Erendira's Boutique | Billing Portal",
  description: "Secure Billing Portal",
  icons: {
    icon: "/favicon.png"
  },
  openGraph: {
    title: "Erendira's Boutique | Billing Portal",
    description: "",
    url: "https://billing.erendirasboutique.com",
    siteName: "Erendira's Boutique",
    images: [
      {
        url: "/social-preview.png",
        width: 1200,
        height: 630,
        alt: "Erendira's Boutique",
      },
    ],
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Erendira's Boutique Billing Portal",
    description: "Secure billing portal for Erendira's Boutique.",
    images: ["/social-preview.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
