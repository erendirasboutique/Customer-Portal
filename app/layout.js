import './globals.css';

export const metadata = {
  title: "Erendira's Boutique | Billing Portal",
  description: "Customer Billing portal",
  icons: { icon: '/favicon.png' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
openGraph: {
    title: "Erendira's Boutique | Billing Portal",
    description: "Customer Billing portal",
    images: [
      {
        url: "/social-preview1.png",
        width: 1200,
        height: 630,
        alt: "Erendira's Boutique Billing Portal"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Erendira's Boutique | Billing Portal",
    description: "Customer Billing portal",
    images: ["/social-preview1.png"]
  }
};
