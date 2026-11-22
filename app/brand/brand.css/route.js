// GET /brand/brand.css — shared colors and fonts, built from /admin/branding.
import { getSiteBrand, brandCss, BRAND_HEADERS } from "@/lib/siteBrand";

export const dynamic = "force-dynamic";

export async function GET() {
  const brand = await getSiteBrand();
  return new Response(brandCss(brand), {
    headers: { ...BRAND_HEADERS, "Content-Type": "text/css; charset=utf-8" },
  });
}
