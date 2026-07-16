"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./checks.module.css";

export default function CheckActions({ checkId, status }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function updateStatus(nextStatus) {
    setBusy(true);
    setError("");

    try {
      const response = await fetch(`/api/checks/${checkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update the check.");

      router.refresh();
    } catch (err) {
      setError(err.message || "Unable to update the check.");
    } finally {
      setBusy(false);
    }
  }

  async function voidCheck() {
    const reason = window.prompt("Why are you voiding this check?");
    if (!reason?.trim()) return;

    setBusy(true);
    setError("");

    try {
      const response = await fetch(`/api/checks/${checkId}/void`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to void the check.");

      router.refresh();
    } catch (err) {
      setError(err.message || "Unable to void the check.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {error ? <div className={styles.error}>{error}</div> : null}
      <div className={styles.actions}>
        {status === "draft" ? (
          <button className={styles.button} disabled={busy} onClick={() => updateStatus("approved")}>
            Approve
          </button>
        ) : null}

        {["approved", "printed", "mailed"].includes(status) ? (
          <a className={styles.button} href={`/admin/checks/${checkId}/print`} target="_blank" rel="noreferrer">
            Print check
          </a>
        ) : null}

        {status === "printed" ? (
          <button className={styles.secondaryButton} disabled={busy} onClick={() => updateStatus("mailed")}>
            Mark mailed
          </button>
        ) : null}

        {["printed", "mailed"].includes(status) ? (
          <button className={styles.secondaryButton} disabled={busy} onClick={() => updateStatus("cleared")}>
            Mark cleared
          </button>
        ) : null}

        {status !== "void" && status !== "cleared" ? (
          <button className={styles.dangerButton} disabled={busy} onClick={voidCheck}>
            Void check
          </button>
        ) : null}
      </div>
    </div>
  );
}
