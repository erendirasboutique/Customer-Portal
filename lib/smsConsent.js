// lib/smsConsent.js
// The exact words customers agree to on /sms. Shared by the page and the API,
// and saved with every sign-up as the record of what they agreed to.
// If you change these, also update the Telnyx campaign's opt-in description.

export const SMS_CONSENT_ES =
  "Sí, quiero recibir mensajes de texto de Erendira's Boutique sobre mis pedidos y envíos, y anuncios de lives y ofertas. " +
  "La frecuencia varía. Pueden aplicar tarifas de mensajes y datos. El consentimiento no es una condición de compra. " +
  "Responde STOP para cancelar y HELP para ayuda.";

/** First text after signing up (same as the campaign's opt-in message). */
export const SMS_WELCOME =
  "Erendira's Boutique: ¡Gracias por suscribirte! Recibirás actualizaciones de tus pedidos y anuncios de lives y ofertas. " +
  "La frecuencia varía. Pueden aplicar tarifas de mensajes y datos. Responde HELP para ayuda, STOP para cancelar.";

export const SMS_TERMS_URL = "https://erendirasboutique.com/sms/terms";
export const SMS_PRIVACY_URL = "https://erendirasboutique.com/sms/privacy";

/** US numbers -> +1XXXXXXXXXX, else null. */
export function toE164(raw) {
  const s = String(raw || "").trim();
  const d = s.replace(/\D/g, "");
  if (s.startsWith("+") && d.length >= 10) return "+" + d;
  if (d.length === 10) return "+1" + d;
  if (d.length === 11 && d.startsWith("1")) return "+" + d;
  return null;
}
