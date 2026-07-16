import styles from "./checks.module.css";
import { formatMoney } from "@/lib/checks/amount-to-words";

function formatDate(value) {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

function Stub({ check, copyLabel }) {
  return (
    <>
      <div className={styles.stubHeader}>
        <div>
          <p className={styles.stubTitle}>{copyLabel}</p>
          <div>{process.env.CHECK_BUSINESS_NAME || "Erendira's Boutique"}</div>
        </div>
        <strong>Check #{check.check_number}</strong>
      </div>

      <table className={styles.stubTable}>
        <tbody>
          <tr><td>Payee</td><td>{check.payee}</td></tr>
          <tr><td>Date</td><td>{formatDate(check.check_date)}</td></tr>
          <tr><td>Amount</td><td>{formatMoney(check.amount_cents)}</td></tr>
          <tr><td>Memo</td><td>{check.memo || "—"}</td></tr>
          <tr><td>Related record</td><td>{check.related_type || "—"} {check.related_id || ""}</td></tr>
          <tr><td>Mailing address</td><td style={{ whiteSpace: "pre-line" }}>{check.mailing_address || "—"}</td></tr>
        </tbody>
      </table>
    </>
  );
}

export default function CheckPrintSheet({ check }) {
  const routing = process.env.CHECK_ROUTING_NUMBER || "ROUTING";
  const account = process.env.CHECK_ACCOUNT_NUMBER || "ACCOUNT";
  const businessName = process.env.CHECK_BUSINESS_NAME || "ERENDIRA'S BOUTIQUE";
  const businessAddress = process.env.CHECK_BUSINESS_ADDRESS || "";
  const bankName = process.env.CHECK_BANK_NAME || "";
  const micrReady = process.env.CHECK_MICR_READY === "true";

  // Confirm exact MICR symbols and field order with your bank before real use.
  const micrText = `${routing}   ${account}   ${String(check.check_number).padStart(4, "0")}`;

  return (
    <main className={styles.printPage}>
      <section className={styles.checkSection}>
        {check.status === "void" ? <div className={styles.voidOverlay}>VOID</div> : null}

        <div className={styles.businessBlock}>
          <div className={styles.businessName}>{businessName}</div>
          <div className={styles.businessAddress}>{businessAddress}</div>
        </div>

        <div className={styles.bankName}>{bankName}</div>
        <div className={styles.checkNumber}>{check.check_number}</div>
        <div className={styles.dateLabel}>DATE</div>
        <div className={styles.checkDate}>{formatDate(check.check_date)}</div>
        <div className={styles.payLabel}>PAY TO THE ORDER OF</div>
        <div className={styles.payee}>{check.payee}</div>
        <div className={styles.numericAmount}>{formatMoney(check.amount_cents)}</div>
        <div className={styles.amountWords}>{check.amount_words}</div>
        <div className={styles.memoLabel}>MEMO</div>
        <div className={styles.memo}>{check.memo || ""}</div>
        <div className={styles.signatureLine}>AUTHORIZED SIGNATURE</div>
        <div className={styles.micrLine}>{micrText}</div>

        {!micrReady ? (
          <div className={styles.micrWarning}>TEST ONLY — MICR setup has not been confirmed</div>
        ) : null}
      </section>

      <section className={styles.stubOne}>
        <Stub check={check} copyLabel="Payment Detail" />
      </section>

      <section className={styles.stubTwo}>
        <Stub check={check} copyLabel="Business Copy" />
      </section>
    </main>
  );
}
