import { headers } from "next/headers";
import ThankYou from "@/components/shop/ThankYou";
import { fulfillBySession } from "@/lib/shop/gift-card-shop";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Thank you · Erendira's Boutique",
  robots: { index: false },
};

/* ============================================================
   /buy-gift-card/thank-you?session_id=cs_...
   Checks the payment with Stripe and makes the card if the webhook
   hasn't already. Only shows the card when Stripe says it's paid.
   ============================================================ */

async function currentSite() {
  const env = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  if (env) return env;
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "https";
  return proto + "://" + host;
}

export default async function ThankYouPage(props) {
  const params = await props.searchParams;
  const sessionId = params && params.session_id;

  let result = { state: "invalid" };
  try {
    result = await fulfillBySession(sessionId, await currentSite());
  } catch (e) {
    console.error("[gift-card-shop] thank-you", e);
    result = { state: "error" };
  }

  const o = result.order || {};
  const view = {
    state: result.state,
    amount: o.amount ? Number(o.amount) : null,
    code: result.state === "fulfilled" ? o.gift_card_code : null,
    pdfUrl: result.state === "fulfilled" ? o.pdf_url : null,
    recipientName: o.recipient_name || "",
    recipientEmailed: Boolean(o.recipient_email),
    deliverOn: o.deliver_on || null,
    emailStatus: o.email_status || null,
    buyerEmail: o.buyer_email || "",
  };

  return <ThankYou view={view} />;
}
