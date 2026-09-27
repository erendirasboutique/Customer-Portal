/* ============================================================
   /studio.webmanifest — makes Admin Studio installable on phones.
   Deliberately NOT under /admin, so a sign-in check in your
   middleware can't block the browser from reading it.
   ============================================================ */

export const dynamic = "force-static";

export function GET() {
  const manifest = {
    name: "Erendira's Boutique Admin Studio",
    short_name: "EB Studio",
    description: "Payments, gift cards, checks and lives for Erendira's Boutique.",
    id: "/admin",
    start_url: "/admin?source=app",
    scope: "/admin",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fdfcf7",
    theme_color: "#fdfcf7",
    icons: [
      { src: "/studio-icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/studio-icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/studio-icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "New payment link", url: "/admin/payment-links", icons: [{ src: "/studio-icons/icon-192.png", sizes: "192x192" }] },
      { name: "Gift cards", url: "/admin/gift-cards", icons: [{ src: "/studio-icons/icon-192.png", sizes: "192x192" }] },
      { name: "Live link", url: "/admin/live-link", icons: [{ src: "/studio-icons/icon-192.png", sizes: "192x192" }] },
    ],
  };

  return new Response(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
