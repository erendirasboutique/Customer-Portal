// GET /brand/logo.png — the logo chosen on /admin/branding (the default if none).
import { getSiteBrand, loadLogo, BRAND_HEADERS } from "@/lib/siteBrand";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const brand = await getSiteBrand();
  const logo = await loadLogo(brand, request.url);
  return new Response(logo.body, {
    headers: { ...BRAND_HEADERS, "Content-Type": logo.type, "X-Content-Type-Options": "nosniff" },
  });
}
