"use client";

import { useState } from "react";
import styles from "./checks.module.css";

export default function PrintControls({ checkId, canPrint }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function printCheck() {
    if (!canPrint) return;

    setBusy(true);
    setMessage("");

    try {
      const response = await fetch(`/api/checks/${checkId}/print`, {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to mark the check as printed.");
      }

      window.print();
      setMessage("Print dialog opened. Confirm the physical check printed correctly.");
    } catch (error) {
      setMessage(error.message || "Unable to print.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.printToolbar}>
      <button className={styles.button} disabled={busy || !canPrint} onClick={printCheck}>
        {busy ? "Preparing..." : "Print at 100%"}
      </button>
      <button className={styles.secondaryButton} onClick={() => window.close()}>
        Close
      </button>
      {message ? <span>{message}</span> : null}
    </div>
  );
}
