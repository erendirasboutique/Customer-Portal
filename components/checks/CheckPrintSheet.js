import { formatMoney } from "@/lib/checks/amount-to-words";

/* ============================================================
   Business check — prints on one US Letter sheet (8.5" × 11"):
     top    3.5"  the check                 (perforation at 3.5")
     middle 3.5"  Payment Detail → payee    (perforation at 7")
     bottom 4.0"  Business Copy → you
   Made for DocuGard Standard Top Check paper (04501, blue marble),
   which is perforated at 3-1/2" and 7" from the top.
   Every position is in inches so it lines up the same on every printer.
   Use the alignment controls on the print page if your printer shifts.
   ============================================================ */

const PAYER = {
  owner: "Erendira Moreno",
  business: "Erendira's Boutique",
  address1: "17121 Hawthorne Ave",
  address2: "Fontana, CA 92335",
};

function formatDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T12:00:00`);
  if (isNaN(date)) return String(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

function cap(s) {
  const str = String(s || "").trim();
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}

function Stub({ check, title, forPayee }) {
  const rows = [
    ["Date", formatDate(check.check_date)],
    ["Pay to", check.payee],
    ["Amount", formatMoney(check.amount_cents)],
    ["Memo", check.memo || "—"],
  ];

  if (!forPayee) {
    rows.push(["Related record", [check.related_type, check.related_id].filter(Boolean).join(" · ") || "—"]);
    rows.push(["Mailed to", check.mailing_address || "—"]);
  }

  return (
    <div className="ck-stub-in">
      <div className="ck-stub-head">
        <div>
          <div className="ck-stub-brand">{PAYER.business}</div>
          <div className="ck-stub-title">{title}</div>
        </div>
        <div className="ck-stub-no">
          <span>Check</span>
          <b>#{check.check_number}</b>
        </div>
      </div>

      <table className="ck-stub-table">
        <tbody>
          {rows.map(function (r) {
            return (
              <tr key={r[0]}>
                <th>{r[0]}</th>
                <td className={r[0] === "Amount" ? "ck-stub-amt" : ""}>{r[1]}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {!forPayee ? (
        <div className="ck-stub-notes">
          <span>Notes</span>
          <div>{check.internal_notes || ""}</div>
        </div>
      ) : (
        <div className="ck-stub-foot">
          Thank you · {PAYER.business} · {PAYER.address1}, {PAYER.address2}
        </div>
      )}
    </div>
  );
}

export default function CheckPrintSheet({ check }) {
  const routing = process.env.CHECK_ROUTING_NUMBER || "";
  const account = process.env.CHECK_ACCOUNT_NUMBER || "";
  const bankName = process.env.CHECK_BANK_NAME || "Wells Fargo Bank N.A.";
  const bankCity = process.env.CHECK_BANK_CITY || ""; // optional, e.g. "California"
  const fractional = process.env.CHECK_FRACTIONAL || ""; // optional, e.g. "11-24/1210"
  const micrReady = process.env.CHECK_MICR_READY === "true";

  const isVoid = check.status === "void";
  const checkNo = String(check.check_number || "").padStart(4, "0");
  const amountNumber = formatMoney(check.amount_cents).replace(/^\$/, "");

  // MICR line, in the order used by most business checks:
  //   ⑈check number⑈  ⑆routing⑆  account⑈
  // With a MICR E-13B font (GnuMICR style): A = transit ⑆, C = on-us ⑈.
  // Confirm the exact layout with your bank before using real checks.
  const micrText = routing && account ? `C${checkNo}C A${routing}A ${account}C` : "";

  return (
    <main className="ck-page">
      <style>{css}</style>

      <div className="ck-sheet">
        {/* ======================= CHECK ======================= */}
        <section className="ck-check">
          {isVoid ? <div className="ck-void">VOID</div> : null}
          <div className="ck-sample">SAMPLE · NOT NEGOTIABLE</div>

          <div className="ck-payer">
            <div className="ck-payer-biz">{PAYER.business}</div>
            <div>{PAYER.owner}</div>
            <div>{PAYER.address1}</div>
            <div>{PAYER.address2}</div>
          </div>

          <div className="ck-bank">
            <div className="ck-bank-name">{bankName}</div>
            {bankCity ? <div>{bankCity}</div> : null}
            {fractional ? <div className="ck-fraction">{fractional}</div> : null}
          </div>

          <div className="ck-number">{check.check_number}</div>

          <div className="ck-date">
            <span className="ck-lbl">Date</span>
            <span className="ck-line ck-date-val">{formatDate(check.check_date)}</span>
          </div>

          <div className="ck-payto">
            <span className="ck-lbl ck-payto-lbl">
              Pay to the
              <br />
              order of
            </span>
            <span className="ck-line ck-payee">{check.payee}</span>
          </div>

          <div className="ck-amount">
            <span className="ck-dollar">$</span>
            <span className="ck-amount-box">**{amountNumber}</span>
          </div>

          <div className="ck-words">
            <span className="ck-line ck-words-val">
              <span className="ck-words-text">{cap(check.amount_words)}</span>
              <span className="ck-fill" aria-hidden="true" />
            </span>
            <span className="ck-lbl ck-dollars">Dollars</span>
          </div>

          {check.mailing_address ? (
            <div className="ck-window">
              <div>{check.payee}</div>
              <div className="ck-preline">{check.mailing_address}</div>
            </div>
          ) : null}

          <div className="ck-memo">
            <span className="ck-lbl">Memo</span>
            <span className="ck-line ck-memo-val">{check.memo || ""}</span>
          </div>

          <div className="ck-sign">
            <span className="ck-sign-line" />
            <span className="ck-lbl">Authorized signature</span>
          </div>

          {micrReady && micrText ? (
            <div className="ck-micr">{micrText}</div>
          ) : (
            <div className="ck-micr-test">
              TEST ONLY — bank line not set up
              {routing && account ? ` · ${routing} · ${account} · ${checkNo}` : ""}
            </div>
          )}
        </section>

        {/* ======================= STUBS ======================= */}
        <section className="ck-stub">
          <Stub check={check} title="Payment detail" forPayee />
        </section>

        <section className="ck-stub">
          <Stub check={check} title="Business copy" />
        </section>
      </div>
    </main>
  );
}

const css = `
/* MICR E-13B font: put a MICR font file at /public/fonts/micr-e13b.ttf
   (for example GnuMICR) to print the bank line. */
@font-face { font-family:"EB MICR"; src:url("/fonts/micr-e13b.ttf") format("truetype"); font-display:block; }

@page { size:8.5in 11in; margin:0 !important; }

.ck-page { --ink:#1f1a15; --label:#5f4e3d; --brand:#7f6b55; --rule:#8c7a66; --soft:#cfbda9;
  background:#ece8e1; min-height:100vh; padding:24px 0 60px; font-family:Georgia, "Times New Roman", serif; color:var(--ink); }
.ck-page * { box-sizing:border-box; }

.ck-sheet { position:relative; width:8.5in; height:11in; margin:0 auto; background:#fff; overflow:hidden;
  box-shadow:0 2px 6px rgba(0,0,0,.08), 0 20px 50px rgba(0,0,0,.12);
  transform:translate(var(--ck-x, 0in), var(--ck-y, 0in)); }

/* ---------------- check (top 3.5") ---------------- */
.ck-check { position:absolute; left:0; top:0; width:8.5in; height:3.5in; }
.ck-check > * { position:absolute; }
.ck-lbl { font-family:Arial, Helvetica, sans-serif; font-size:6.5pt; letter-spacing:.08em; text-transform:uppercase; color:var(--label); }
.ck-line { border-bottom:0.75pt solid var(--rule); display:block; white-space:nowrap; overflow:hidden; }

.ck-payer { left:0.4in; top:0.32in; width:3in; font-size:8.5pt; line-height:1.3; }
.ck-payer-biz { font-size:13pt; color:var(--brand); margin-bottom:1pt; letter-spacing:.01em; }

.ck-bank { left:3.75in; top:0.34in; width:2.2in; text-align:center; font-size:8pt; line-height:1.3; }
.ck-bank-name { font-size:9pt; }
.ck-fraction { font-size:7pt; color:var(--label); margin-top:2pt; }

.ck-number { right:0.4in; top:0.3in; font-size:12pt; font-weight:bold; font-family:Arial, Helvetica, sans-serif; }

.ck-date { right:0.4in; top:0.85in; display:flex; align-items:flex-end; gap:6pt; }
.ck-date-val { width:1.45in; font-size:11pt; text-align:center; padding-bottom:1pt; }

.ck-payto { left:0.4in; top:1.28in; width:5.95in; display:flex; align-items:flex-end; gap:8pt; }
.ck-payto-lbl { line-height:1.2; flex-shrink:0; }
.ck-payee { flex:1; font-size:12.5pt; padding:0 0 1pt 4pt; }

.ck-amount { right:0.4in; top:1.2in; display:flex; align-items:center; gap:4pt; }
.ck-dollar { font-size:13pt; }
.ck-amount-box { display:block; width:1.5in; height:0.36in; line-height:0.34in; border:0.75pt solid var(--rule); text-align:right;
  padding:0 7pt; font-size:12.5pt; font-family:Arial, Helvetica, sans-serif; font-weight:bold; letter-spacing:.02em; }

.ck-words { left:0.4in; right:0.4in; top:1.78in; display:flex; align-items:flex-end; gap:8pt; }
.ck-words-val { flex:1; display:flex; font-size:11pt; padding:0 0 1pt 4pt; }
.ck-words-text { flex-shrink:0; }
.ck-fill { flex:1; overflow:hidden; white-space:nowrap; color:var(--label); padding-left:4pt; }
.ck-fill::after { content:"****************************************************************************************************"; }
.ck-dollars { flex-shrink:0; }

/* lines up with the window of a standard #9 / #10 double-window check envelope */
.ck-window { left:0.9in; top:2.08in; width:3.4in; font-size:9.5pt; line-height:1.25; }
.ck-preline { white-space:pre-line; }

.ck-memo { left:0.4in; top:2.62in; width:3.4in; display:flex; align-items:flex-end; gap:6pt; }
.ck-memo-val { flex:1; font-size:9.5pt; padding:0 0 1pt 4pt; }

.ck-sign { right:0.4in; top:2.5in; width:2.9in; text-align:center; }
.ck-sign-line { display:block; height:0.26in; border-bottom:0.75pt solid var(--ink); margin-bottom:2pt; }

/* MICR clear band = bottom 5/8". Characters sit 3/16"–7/16" from the bottom edge. */
.ck-micr { left:1.6in; bottom:0.19in; font-family:"EB MICR", monospace; font-size:12pt; line-height:0.25in; letter-spacing:0; color:#000; white-space:pre; }
.ck-micr-test { left:0.4in; bottom:0.22in; font-family:Arial, Helvetica, sans-serif; font-size:7pt; letter-spacing:.06em; color:#9a4a2a; }

.ck-void { left:0; right:0; top:1.05in; text-align:center; font:bold 72pt Arial, Helvetica, sans-serif; letter-spacing:.3em; color:rgba(160,60,40,.22);
  transform:rotate(-8deg); pointer-events:none; }
.ck-sample { display:none; left:0; right:0; top:2.15in; text-align:center; font:bold 22pt Arial, Helvetica, sans-serif; letter-spacing:.2em; color:rgba(160,60,40,.18); }

/* ---------------- stubs (2 × 3.75") ---------------- */
.ck-stub { position:absolute; left:0; width:8.5in; height:3.5in; }
.ck-stub:nth-of-type(2) { top:3.5in; }
.ck-stub:nth-of-type(3) { top:7in; height:4in; }
.ck-stub-in { position:absolute; inset:0.38in 0.45in 0.3in; font-size:9.5pt; }
.ck-stub-head { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:6pt; border-bottom:0.75pt solid var(--soft); }
.ck-stub-brand { font-size:11pt; color:var(--brand); }
.ck-stub-title { font-family:Arial, Helvetica, sans-serif; font-size:7pt; letter-spacing:.14em; text-transform:uppercase; color:var(--label); margin-top:2pt; }
.ck-stub-no { text-align:right; font-family:Arial, Helvetica, sans-serif; }
.ck-stub-no span { display:block; font-size:6.5pt; letter-spacing:.12em; text-transform:uppercase; color:var(--label); }
.ck-stub-no b { font-size:12pt; }
.ck-stub-table { width:100%; border-collapse:collapse; margin-top:4pt; }
.ck-stub-table th { width:1.35in; text-align:left; vertical-align:top; font:normal 7pt Arial, Helvetica, sans-serif; letter-spacing:.1em; text-transform:uppercase;
  color:var(--label); padding:5pt 0; }
.ck-stub-table td { padding:4pt 0; vertical-align:top; white-space:pre-line; border-bottom:0.5pt solid #ece6dd; }
.ck-stub-amt { font-family:Arial, Helvetica, sans-serif; font-weight:bold; }
.ck-stub-notes { margin-top:8pt; }
.ck-stub-notes span { font:normal 7pt Arial, Helvetica, sans-serif; letter-spacing:.1em; text-transform:uppercase; color:var(--label); }
.ck-stub-notes div { margin-top:3pt; min-height:0.4in; white-space:pre-line; }
.ck-stub-foot { position:absolute; left:0; right:0; bottom:0; text-align:center; font-size:7.5pt; color:var(--label); }

/* ---------------- screen preview ---------------- */
@media screen {
  .ck-stub::before { content:""; position:absolute; left:0.2in; right:0.2in; top:0; border-top:1px dashed #d9cfc2; }
  .ck-check::after { content:"Check"; position:absolute; right:0.08in; bottom:0.04in; font:7pt Arial, sans-serif; color:#c9bcab; }
}
@media screen and (max-width:900px) {
  .ck-page { overflow-x:auto; padding:12px; }
}

/* ---------------- alignment test on plain paper ---------------- */
html.ck-test .ck-sample { display:block; }
html.ck-test .ck-stub::before { content:""; position:absolute; left:0; right:0; top:0; border-top:0.75pt dashed #999; }
html.ck-test .ck-check { outline:0.5pt dotted #bbb; outline-offset:-0.12in; }

/* ---------------- print ---------------- */
@media print {
  html, body { margin:0 !important; padding:0 !important; background:#fff !important; }
  .ck-noprint, [class*="printToolbar"] { display:none !important; }
  .ck-page { background:#fff; padding:0; min-height:0; }
  .ck-sheet { margin:0; box-shadow:none; }
  .ck-page, .ck-sheet { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
}
`;
