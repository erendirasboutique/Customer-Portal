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

function FloralCorner({ className = "", mirror = false }) {
  return (
    <svg
      className={`${styles.floralCorner} ${className}`}
      viewBox="0 0 260 260"
      aria-hidden="true"
      style={mirror ? { transform: "scaleX(-1)" } : undefined}
    >
      <path
        className={styles.flowerStem}
        d="M18 240C58 198 76 154 89 105C98 69 111 40 145 16"
      />
      <path
        className={styles.flowerStem}
        d="M50 210C91 194 118 165 139 132C157 103 181 83 220 72"
      />
      <path
        className={styles.flowerStem}
        d="M80 166C104 154 118 134 126 108"
      />

      <ellipse className={styles.flowerLeaf} cx="57" cy="202" rx="12" ry="25" transform="rotate(-48 57 202)" />
      <ellipse className={styles.flowerLeaf} cx="77" cy="173" rx="11" ry="24" transform="rotate(28 77 173)" />
      <ellipse className={styles.flowerLeaf} cx="94" cy="141" rx="10" ry="22" transform="rotate(-54 94 141)" />
      <ellipse className={styles.flowerLeaf} cx="111" cy="104" rx="10" ry="22" transform="rotate(30 111 104)" />
      <ellipse className={styles.flowerLeaf} cx="139" cy="69" rx="9" ry="20" transform="rotate(-50 139 69)" />
      <ellipse className={styles.flowerLeaf} cx="147" cy="127" rx="10" ry="22" transform="rotate(-35 147 127)" />
      <ellipse className={styles.flowerLeaf} cx="179" cy="98" rx="10" ry="22" transform="rotate(35 179 98)" />

      <g transform="translate(35 215)">
        <ellipse className={styles.flowerPetal} cx="0" cy="-15" rx="10" ry="20" />
        <ellipse className={styles.flowerPetal} cx="14" cy="-4" rx="10" ry="20" transform="rotate(72 14 -4)" />
        <ellipse className={styles.flowerPetal} cx="9" cy="13" rx="10" ry="20" transform="rotate(144 9 13)" />
        <ellipse className={styles.flowerPetal} cx="-9" cy="13" rx="10" ry="20" transform="rotate(216 -9 13)" />
        <ellipse className={styles.flowerPetal} cx="-14" cy="-4" rx="10" ry="20" transform="rotate(288 -14 -4)" />
        <circle className={styles.flowerCenter} r="6" />
      </g>

      <g transform="translate(124 92) scale(.82)">
        <ellipse className={styles.flowerPetalLight} cx="0" cy="-15" rx="10" ry="20" />
        <ellipse className={styles.flowerPetalLight} cx="14" cy="-4" rx="10" ry="20" transform="rotate(72 14 -4)" />
        <ellipse className={styles.flowerPetalLight} cx="9" cy="13" rx="10" ry="20" transform="rotate(144 9 13)" />
        <ellipse className={styles.flowerPetalLight} cx="-9" cy="13" rx="10" ry="20" transform="rotate(216 -9 13)" />
        <ellipse className={styles.flowerPetalLight} cx="-14" cy="-4" rx="10" ry="20" transform="rotate(288 -14 -4)" />
        <circle className={styles.flowerCenter} r="6" />
      </g>

      <g transform="translate(205 74) scale(.68)">
        <ellipse className={styles.flowerPetal} cx="0" cy="-15" rx="10" ry="20" />
        <ellipse className={styles.flowerPetal} cx="14" cy="-4" rx="10" ry="20" transform="rotate(72 14 -4)" />
        <ellipse className={styles.flowerPetal} cx="9" cy="13" rx="10" ry="20" transform="rotate(144 9 13)" />
        <ellipse className={styles.flowerPetal} cx="-9" cy="13" rx="10" ry="20" transform="rotate(216 -9 13)" />
        <ellipse className={styles.flowerPetal} cx="-14" cy="-4" rx="10" ry="20" transform="rotate(288 -14 -4)" />
        <circle className={styles.flowerCenter} r="6" />
      </g>
    </svg>
  );
}

function Stub({ check, copyLabel }) {
  return (
    <div className={styles.stubCard}>
      <div className={styles.stubHeader}>
        <div>
          <p className={styles.stubEyebrow}>ERENDIRA&apos;S BOUTIQUE</p>
          <h2 className={styles.stubTitle}>{copyLabel}</h2>
        </div>

        <div className={styles.stubNumberBlock}>
          <span>CHECK</span>
          <strong>#{check.check_number}</strong>
        </div>
      </div>

      <div className={styles.stubDetails}>
        <div>
          <span>Payee</span>
          <strong>{check.payee}</strong>
        </div>
        <div>
          <span>Date</span>
          <strong>{formatDate(check.check_date)}</strong>
        </div>
        <div>
          <span>Amount</span>
          <strong>{formatMoney(check.amount_cents)}</strong>
        </div>
        <div>
          <span>Memo</span>
          <strong>{check.memo || "—"}</strong>
        </div>
        <div>
          <span>Related record</span>
          <strong>
            {check.related_type || "—"}
            {check.related_id ? ` · ${check.related_id}` : ""}
          </strong>
        </div>
        <div>
          <span>Mailing address</span>
          <strong className={styles.preLine}>{check.mailing_address || "—"}</strong>
        </div>
      </div>

      <div className={styles.stubNotes}>
        <span>Notes</span>
        <div>{check.internal_notes || ""}</div>
      </div>

      <FloralCorner className={styles.stubFlower} mirror />
    </div>
  );
}

export default function CheckPrintSheet({ check }) {
  const routing = process.env.CHECK_ROUTING_NUMBER || "ROUTING";
  const account = process.env.CHECK_ACCOUNT_NUMBER || "ACCOUNT";
  const bankName = process.env.CHECK_BANK_NAME || "Wells Fargo Bank N.A.";
  const micrReady = process.env.CHECK_MICR_READY === "true";

  // Confirm the exact MICR symbols and field order with your bank before real use.
  const micrText = `${routing}   ${account}   ${String(check.check_number).padStart(4, "0")}`;

  return (
    <main className={styles.printPage}>
      <section className={styles.checkSection}>
        <div className={styles.checkBorder} />

        <FloralCorner className={styles.topLeftFlower} />
        <FloralCorner className={styles.bottomRightFlower} mirror />

        {check.status === "void" ? <div className={styles.voidOverlay}>VOID</div> : null}

        <div className={styles.businessBlock}>
          <div className={styles.ownerName}>Erendira Moreno</div>
          <div className={styles.businessName}>Erendira&apos;s Boutique</div>
          <div className={styles.businessAddress}>
            17121 Hawthorne Ave
            <br />
            Fontana, CA 92335
          </div>
        </div>

        <div className={styles.bankBlock}>
          <div className={styles.bankName}>{bankName}</div>
        </div>

        <div className={styles.checkNumber}>{check.check_number}</div>

        <div className={styles.dateRow}>
          <span>DATE</span>
          <div>{formatDate(check.check_date)}</div>
        </div>

        <div className={styles.payeeRow}>
          <span className={styles.payeeLabel}>
            PAY TO THE
            <br />
            ORDER OF
          </span>
          <div className={styles.payeeValue}>{check.payee}</div>
          <div className={styles.numericAmount}>{formatMoney(check.amount_cents)}</div>
        </div>

        <div className={styles.wordsRow}>
          <div className={styles.amountWords}>{check.amount_words}</div>
          <span>DOLLARS</span>
        </div>

        <div className={styles.memoRow}>
          <span>MEMO</span>
          <div>{check.memo || ""}</div>
        </div>

        <div className={styles.signatureArea}>
          <div className={styles.signatureLine} />
          <span>AUTHORIZED SIGNATURE</span>
        </div>

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
