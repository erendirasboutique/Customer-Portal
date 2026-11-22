// GET /brand/brand.json — the shared brand settings, for scripts and the season switch.
import { getSiteBrand, brandColors, BRAND_HEADERS } from "@/lib/siteBrand";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const brand = await getSiteBrand();
  const base = new URL("/brand/", request.url).toString();
  return Response.json(
    {
      name: "Erendira's Boutique",
      season: brand.season,
      logo: base + "logo.png",
      css: base + "brand.css",
      colors: { ...brandColors(brand), white: "#FFFFFF" },
      fonts: { heading: "Charman Serif", body: "Ltt Recoleta" },
    },
    { headers: BRAND_HEADERS }
  );
}
