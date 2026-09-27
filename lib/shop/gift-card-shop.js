/* ============================================================
   Erendira's Boutique — online gift card shop (server-only)

   Flow:
   1. /buy-gift-card → POST /api/gift-card-shop/checkout
      saves a "pending" order and sends the buyer to Stripe Checkout.
   2. After payment, BOTH the Stripe webhook and the thank-you page call
      fulfillOrder(). Only one of them actually makes the card; the
      other just reads the result. So a card is made even if the buyer
      closes the tab, and never made twice.
   3. fulfillOrder() creates the Stripe coupon + promotion code (the
      same way your admin gift cards work), adds the card to your
      gift_cards table so it shows on /admin/gift-cards, and emails it.
   ============================================================ */

import crypto from "crypto";
import { db, stripe, sendEmail, emailEnabled, todayPT, escapeHtml } from "@/lib/shop/service";

/* ---------------- settings you can change ---------------- */
export const SHOP = {
  presets: [25, 50, 75, 100, 150, 200],
  min: 10,
  max: 500,
  currency: "usd",
  giftCardsTable: "gift_cards",
  // Your existing PDF route (app/api/admin/gift-cards/[id]/pdf).
  pdfPath: function (id) { return "/api/admin/gift-cards/" + id + "/pdf"; },
  // Where a customer checks their card. Uses the balance page.
  cardPath: function (code) { return "/gift-card-balance?code=" + encodeURIComponent(code); },
};

/* ---------------- input checks ---------------- */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(s, max) {
  return String(s == null ? "" : s).trim().slice(0, max);
}

export function validateOrder(input) {
  const amount = Math.round(Number(input.amount) * 100) / 100;
  if (!Number.isFinite(amount) || amount < SHOP.min || amount > SHOP.max) {
    return { error: "amount" };
  }
  if (Math.round(amount * 100) % 100 !== 0) return { error: "amount" }; // whole dollars only

  const forSomeoneElse = Boolean(input.forSomeoneElse);
  const order = {
    amount: amount,
    currency: SHOP.currency,
    buyer_name: clean(input.buyerName, 120),
    buyer_email: clean(input.buyerEmail, 200).toLowerCase(),
    recipient_name: forSomeoneElse ? clean(input.recipientName, 120) : "",
    recipient_email: forSomeoneElse ? clean(input.recipientEmail, 200).toLowerCase() : "",
    message: clean(input.message, 300),
    deliver_on: null,
    lang: input.lang === "es" ? "es" : "en",
  };

  if (!order.buyer_name) return { error: "buyerName" };
  if (!EMAIL.test(order.buyer_email)) return { error: "buyerEmail" };
  if (forSomeoneElse) {
    if (!order.recipient_name) return { error: "recipientName" };
    if (order.recipient_email && !EMAIL.test(order.recipient_email)) return { error: "recipientEmail" };
  }

  if (forSomeoneElse && order.recipient_email && emailEnabled() && input.deliverOn) {
    const d = String(input.deliverOn);
    const today = todayPT();
    const limit = new Date(Date.now() + 366 * 86400000).toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || d < today || d > limit) return { error: "deliverOn" };
    order.deliver_on = d > today ? d : null;
  }

  return { order: order };
}

/* ---------------- checkout ---------------- */
export async function createCheckout(order, site) {
  const { data: saved, error } = await db()
    .from("gift_card_orders")
    .insert({ ...order, status: "pending" })
    .select()
    .single();
  if (error) throw new Error(error.message);

  const cents = Math.round(order.amount * 100);
  const label = order.lang === "es" ? "Tarjeta de regalo" : "Gift card";

  const session = await stripe("POST", "/checkout/sessions", {
    mode: "payment",
    customer_email: order.buyer_email,
    allow_promotion_codes: "false",
    line_items: [{
      quantity: 1,
      price_data: {
        currency: order.currency,
        unit_amount: cents,
        product_data: {
          name: "Erendira's Boutique " + label + " — $" + order.amount.toFixed(0),
          description: order.recipient_name ? (order.lang === "es" ? "Para " : "For ") + order.recipient_name : undefined,
        },
      },
    }],
    metadata: { kind: "gift_card_purchase", order_id: saved.id },
    payment_intent_data: {
      description: "Online gift card $" + order.amount.toFixed(0),
      metadata: { kind: "gift_card_purchase", order_id: saved.id },
    },
    locale: order.lang === "es" ? "es" : "auto",
    success_url: site + "/buy-gift-card/thank-you?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: site + "/buy-gift-card?canceled=1",
  }, "gc-session-" + saved.id);

  await db().from("gift_card_orders").update({ stripe_session_id: session.id }).eq("id", saved.id);
  return session.url;
}

/* ---------------- code generation ---------------- */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I

export function newCode() {
  const bytes = crypto.randomBytes(8);
  let s = "";
  for (let i = 0; i < 8; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
  return "EB-" + s.slice(0, 4) + "-" + s.slice(4);
}

/* Insert, dropping any column your gift_cards table doesn't have. */
async function insertTolerant(table, row) {
  let data = { ...row };
  for (let i = 0; i < 8; i++) {
    const res = await db().from(table).insert(data).select().single();
    if (!res.error) return res.data;
    const m = /Could not find the '([^']+)' column|column "?([a-z_]+)"? .*does not exist/i.exec(res.error.message || "");
    const col = m && (m[1] || m[2]);
    if (col && col in data) { delete data[col]; continue; }
    throw new Error(res.error.message);
  }
  throw new Error("Could not save the gift card.");
}

async function updateTolerant(table, id, patch) {
  let data = { ...patch };
  for (let i = 0; i < 8 && Object.keys(data).length; i++) {
    const res = await db().from(table).update(data).eq("id", id);
    if (!res.error) return;
    const m = /Could not find the '([^']+)' column|column "?([a-z_]+)"? .*does not exist/i.exec(res.error.message || "");
    const col = m && (m[1] || m[2]);
    if (col && col in data) { delete data[col]; continue; }
    throw new Error(res.error.message);
  }
}

/* ---------------- make the card ---------------- */
async function makeCard(order, site) {
  const cents = Math.round(Number(order.amount) * 100);

  // One coupon per order, even if this runs twice.
  const coupon = await stripe("POST", "/coupons", {
    amount_off: cents,
    currency: order.currency || "usd",
    duration: "once",
    name: "Gift card $" + Number(order.amount).toFixed(0),
    metadata: { kind: "gift_card", source: "online", order_id: order.id },
  }, "gc-coupon-" + order.id);

  // Reuse a promotion code if one was already made for this coupon.
  const existing = await stripe("GET", "/promotion_codes", { coupon: coupon.id, limit: 1 });
  let promo = existing.data && existing.data[0];

  for (let attempt = 0; !promo && attempt < 5; attempt++) {
    const code = newCode();
    try {
      promo = await stripe("POST", "/promotion_codes", {
        coupon: coupon.id,
        code: code,
        max_redemptions: 1,
        metadata: { kind: "gift_card", source: "online", order_id: order.id },
      }, "gc-promo-" + order.id + "-" + code);
    } catch (e) {
      if (!/already exists|in use/i.test(e.message)) throw e;
    }
  }
  if (!promo) throw new Error("Could not create a unique gift card code.");

  // Reuse the gift_cards row if it was already saved.
  const { data: found } = await db()
    .from(SHOP.giftCardsTable)
    .select("*")
    .eq("stripe_promotion_code_id", promo.id)
    .maybeSingle();

  let card = found;
  if (!card) {
    card = await insertTolerant(SHOP.giftCardsTable, {
      code: promo.code,
      amount: Number(order.amount),
      customer_name: order.recipient_name || order.buyer_name,
      customer_email: order.recipient_email || order.buyer_email,
      message: order.message || null,
      status: "active",
      stripe_promotion_code_id: promo.id,
      stripe_coupon_id: coupon.id,
      redeemed_count: 0,
      total_redeemed: 0,
      source: "online",
    });
  }

  const pdf_url = site + SHOP.pdfPath(card.id);
  const gift_card_url = site + SHOP.cardPath(card.code);
  if (card.pdf_url !== pdf_url || card.gift_card_url !== gift_card_url) {
    await updateTolerant(SHOP.giftCardsTable, card.id, { pdf_url: pdf_url, gift_card_url: gift_card_url });
  }

  return { id: card.id, code: card.code, pdf_url: pdf_url, gift_card_url: gift_card_url };
}

/* ---------------- fulfil (safe to call many times) ---------------- */
export async function fulfillBySession(sessionId, site) {
  if (!/^cs_[A-Za-z0-9_]+$/.test(String(sessionId || ""))) return { state: "invalid" };

  const session = await stripe("GET", "/checkout/sessions/" + sessionId);
  const orderId = session.metadata && session.metadata.order_id;
  if (!session.metadata || session.metadata.kind !== "gift_card_purchase" || !orderId) return { state: "invalid" };
  if (session.payment_status !== "paid") return { state: "unpaid" };

  return fulfillOrder(orderId, site, session);
}

export async function fulfillOrder(orderId, site, session) {
  const { data: order } = await db().from("gift_card_orders").select("*").eq("id", orderId).maybeSingle();
  if (!order) return { state: "invalid" };
  if (order.status === "fulfilled") return { state: "fulfilled", order: order };

  // Claim the order so only one caller makes the card.
  const staleBefore = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  const { data: claimed } = await db()
    .from("gift_card_orders")
    .update({ status: "fulfilling", claimed_at: new Date().toISOString(), error: null })
    .eq("id", order.id)
    .or('status.in.(pending,failed),and(status.eq.fulfilling,claimed_at.lt."' + staleBefore + '")')
    .select();

  if (!claimed || !claimed.length) {
    const { data: again } = await db().from("gift_card_orders").select("*").eq("id", order.id).single();
    return { state: again.status === "fulfilled" ? "fulfilled" : "working", order: again };
  }

  try {
    const card = await makeCard(order, site);
    const patch = {
      status: "fulfilled",
      gift_card_id: card.id,
      gift_card_code: card.code,
      pdf_url: card.pdf_url,
      fulfilled_at: new Date().toISOString(),
      stripe_payment_intent: session ? session.payment_intent : order.stripe_payment_intent,
    };
    const { data: done } = await db().from("gift_card_orders").update(patch).eq("id", order.id).select().single();

    const emailed = await deliverEmails(done, site, { buyerReceipt: true });
    return { state: "fulfilled", order: emailed };
  } catch (e) {
    console.error("[gift-card-shop] fulfil failed", order.id, e);
    await db().from("gift_card_orders").update({ status: "failed", error: String(e.message || e).slice(0, 500) }).eq("id", order.id);
    await alertOwner(order, e);
    return { state: "failed", order: { ...order, status: "failed" } };
  }
}

/* ---------------- emails ---------------- */
const COPY = {
  en: {
    cardSubject: function (o) { return (o.recipient_name ? o.buyer_name + " sent you" : "Your") + " an Erendira's Boutique gift card"; },
    receiptSubject: "Your gift card purchase",
    hi: "Hi",
    sent: function (o) { return o.buyer_name + " sent you a gift card to Erendira's Boutique."; },
    yours: "Here's your Erendira's Boutique gift card.",
    code: "Your code",
    use: "Enter this code in the promo code box at checkout.",
    pdf: "Download the gift card",
    balance: "Check the balance",
    thanks: "Thank you for your purchase!",
    receiptLine: function (o) {
      if (o.deliver_on) return "We'll email it to " + o.recipient_name + " on " + o.deliver_on + ".";
      if (o.recipient_email) return "We've emailed it to " + o.recipient_name + ".";
      if (o.recipient_name) return "Forward this email or the PDF to " + o.recipient_name + ".";
      return "";
    },
  },
  es: {
    cardSubject: function (o) { return (o.recipient_name ? o.buyer_name + " te envió" : "Tu") + " una tarjeta de regalo de Erendira's Boutique"; },
    receiptSubject: "Tu compra de tarjeta de regalo",
    hi: "Hola",
    sent: function (o) { return o.buyer_name + " te envió una tarjeta de regalo de Erendira's Boutique."; },
    yours: "Aquí está tu tarjeta de regalo de Erendira's Boutique.",
    code: "Tu código",
    use: "Escribe este código en la casilla de código promocional al pagar.",
    pdf: "Descargar la tarjeta",
    balance: "Ver el saldo",
    thanks: "¡Gracias por tu compra!",
    receiptLine: function (o) {
      if (o.deliver_on) return "Se la enviaremos a " + o.recipient_name + " el " + o.deliver_on + ".";
      if (o.recipient_email) return "Ya se la enviamos a " + o.recipient_name + ".";
      if (o.recipient_name) return "Reenvía este correo o el PDF a " + o.recipient_name + ".";
      return "";
    },
  },
};

function emailHtml(o, c, intro, extra) {
  const amount = "$" + Number(o.amount).toFixed(2);
  const msg = o.message
    ? '<p style="margin:18px 0 0;padding:14px 16px;background:#fffdf8;border-radius:14px;font-style:italic;color:#da5e16">“' + escapeHtml(o.message) + '”</p>'
    : "";
  return '' +
    '<div style="background:#fdfcf7;padding:28px 12px;font-family:Georgia,serif;color:#da5e16">' +
    '<div style="max-width:460px;margin:0 auto;background:#fff;border-radius:24px;padding:30px 26px;text-align:center">' +
    '<p style="margin:0 0 6px;font-size:10px;letter-spacing:.28em;color:#eda033">ERENDIRA&#8217;S BOUTIQUE</p>' +
    '<p style="margin:0;font-size:15px">' + escapeHtml(intro) + '</p>' +
    '<p style="margin:18px 0 0;font-size:48px;line-height:1">' + amount + '</p>' +
    msg +
    '<p style="margin:22px 0 6px;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#eda033">' + c.code + '</p>' +
    '<p style="margin:0;font-family:Menlo,monospace;font-size:20px;letter-spacing:.12em">' + escapeHtml(o.gift_card_code) + '</p>' +
    '<p style="margin:12px 0 0;font-size:13px">' + c.use + '</p>' +
    '<p style="margin:22px 0 0">' +
    '<a href="' + escapeHtml(o.pdf_url) + '" style="display:inline-block;background:#eda033;color:#fff;text-decoration:none;border-radius:999px;padding:12px 22px;font-size:14px">' + c.pdf + '</a>' +
    '</p>' +
    '<p style="margin:12px 0 0"><a href="' + escapeHtml(o._balance_url) + '" style="color:#da5e16;font-size:13px">' + c.balance + '</a></p>' +
    (extra ? '<p style="margin:20px 0 0;font-size:13px">' + escapeHtml(extra) + '</p>' : '') +
    '</div></div>';
}

export async function deliverEmails(order, site, opts) {
  if (!emailEnabled()) {
    await db().from("gift_card_orders").update({ email_status: "off" }).eq("id", order.id);
    return { ...order, email_status: "off" };
  }

  const c = COPY[order.lang] || COPY.en;
  const o = { ...order, _balance_url: site + SHOP.cardPath(order.gift_card_code) };
  const today = todayPT();
  const scheduled = order.deliver_on && order.deliver_on > today && !(opts && opts.force);
  let email_status = order.email_status;

  try {
    if (order.recipient_email && !scheduled) {
      await sendEmail({
        to: order.recipient_email,
        subject: c.cardSubject(o),
        html: emailHtml(o, c, c.hi + " " + order.recipient_name + ", " + c.sent(o)),
      });
      email_status = "sent";
    } else if (order.recipient_email && scheduled) {
      email_status = "scheduled";
    }

    if (opts && opts.buyerReceipt) {
      const own = !order.recipient_name;
      await sendEmail({
        to: order.buyer_email,
        subject: own ? c.cardSubject(o) : c.receiptSubject,
        html: emailHtml(o, c, own ? c.hi + " " + order.buyer_name + ". " + c.yours : c.thanks, own ? "" : c.receiptLine(order)),
      });
      if (!order.recipient_email) email_status = "sent";
    }

    const patch = { email_status: email_status };
    if (email_status === "sent") patch.delivered_at = new Date().toISOString();
    await db().from("gift_card_orders").update(patch).eq("id", order.id);
    return { ...order, ...patch };
  } catch (e) {
    console.error("[gift-card-shop] email failed", order.id, e);
    await db().from("gift_card_orders").update({ email_status: "failed", error: String(e.message).slice(0, 500) }).eq("id", order.id);
    return { ...order, email_status: "failed" };
  }
}

async function alertOwner(order, err) {
  const to = process.env.GIFT_CARD_ALERT_EMAIL;
  if (!to || !emailEnabled()) return;
  try {
    await sendEmail({
      to: to,
      subject: "Gift card order needs attention",
      html: "<p>A customer paid for a $" + Number(order.amount).toFixed(2) + " gift card, but the card couldn't be created.</p>" +
        "<p>Buyer: " + escapeHtml(order.buyer_name) + " (" + escapeHtml(order.buyer_email) + ")</p>" +
        "<p>Error: " + escapeHtml(err && err.message) + "</p>" +
        "<p>Open Admin Studio → Gift card sales and press Retry.</p>",
    });
  } catch (e) {
    console.error("[gift-card-shop] alert email failed", e);
  }
}

/* ---------------- webhook signature ---------------- */
export function verifyStripeSignature(rawBody, header, secret) {
  if (!header || !secret) return false;
  const parts = {};
  header.split(",").forEach(function (p) {
    const i = p.indexOf("=");
    const k = p.slice(0, i);
    const v = p.slice(i + 1);
    if (k === "v1") (parts.v1 = parts.v1 || []).push(v);
    else parts[k] = v;
  });
  const t = Number(parts.t);
  if (!t || !parts.v1 || Math.abs(Date.now() / 1000 - t) > 300) return false;
  const expected = crypto.createHmac("sha256", secret).update(t + "." + rawBody, "utf8").digest("hex");
  return parts.v1.some(function (sig) {
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
}
