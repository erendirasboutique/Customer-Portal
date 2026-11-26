// app/sms/terms/page.jsx — my.erendirasboutique.com/sms/terms
// SMS Terms & Conditions. Linked in the Telnyx campaign and on /sms.
import SmsPolicyPage from "@/components/SmsPolicyPage";

export const metadata = { title: "Términos de mensajes de texto | Erendira's Boutique" };

const mail = <a href="mailto:hello@erendirasboutique.com">hello@erendirasboutique.com</a>;

export default function SmsTermsPage() {
  return (
    <SmsPolicyPage
      title="Términos de mensajes de texto (SMS)"
      subtitle="SMS Terms & Conditions"
      updated="25 de noviembre de 2026 · November 25, 2026"
      es={
        <>
          <p><b>Programa:</b> Erendira&rsquo;s Boutique te envía mensajes de texto sobre tus pedidos y envíos (empacado, en camino, sale a entrega, entregado), respuestas a tus preguntas, y anuncios de lives y ofertas.</p>
          <p><b>Cómo suscribirte:</b> en <a href="/sms">my.erendirasboutique.com/sms</a>, escribiendo tu número y marcando la casilla de consentimiento. El consentimiento no es una condición de compra.</p>
          <p><b>Frecuencia:</b> varía. Normalmente hasta 4 mensajes por pedido y algunos anuncios al mes.</p>
          <p><b>Costo:</b> pueden aplicar tarifas de mensajes y datos de tu compañía telefónica.</p>
          <p><b>Cancelar:</b> responde <b>STOP</b> en cualquier momento. Te enviaremos un mensaje confirmando que te diste de baja y no recibirás más mensajes. Para volver a suscribirte, responde <b>START</b>.</p>
          <p><b>Ayuda:</b> responde <b>HELP</b> o escríbenos a {mail}.</p>
          <p>Las compañías telefónicas no son responsables por mensajes retrasados o no entregados. Debes ser el titular o usuario autorizado del número que registras. Podemos cambiar o terminar este programa en cualquier momento. Consulta nuestra <a href="/sms/privacy">Política de privacidad de SMS</a>.</p>
        </>
      }
      en={
        <>
          <p><b>Program:</b> Erendira&rsquo;s Boutique sends text messages about your orders and shipping (packed, on the way, out for delivery, delivered), replies to your questions, and announcements about lives and sales.</p>
          <p><b>How to opt in:</b> at <a href="/sms">my.erendirasboutique.com/sms</a>, by entering your number and checking the consent box. Consent is not a condition of purchase.</p>
          <p><b>Message frequency:</b> varies. Usually up to 4 messages per order plus a few announcements per month.</p>
          <p><b>Cost:</b> message and data rates may apply.</p>
          <p><b>Opt out:</b> reply <b>STOP</b> at any time. You&rsquo;ll get one message confirming you&rsquo;re unsubscribed, and no more messages after that. To opt back in, reply <b>START</b>.</p>
          <p><b>Help:</b> reply <b>HELP</b> or email {mail}.</p>
          <p>Carriers are not liable for delayed or undelivered messages. You must be the account holder or an authorized user of the number you register. We may change or end this program at any time. See our <a href="/sms/privacy">SMS Privacy Policy</a>.</p>
        </>
      }
    />
  );
}
