"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./checks.module.css";

export default function NewCheckForm({ accounts }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const payload = {
      accountId: form.get("accountId"),
      payee: form.get("payee"),
      amount: form.get("amount"),
      checkDate: form.get("checkDate"),
      mailingAddress: form.get("mailingAddress"),
      memo: form.get("memo"),
      internalNotes: form.get("internalNotes"),
      relatedType: form.get("relatedType") || null,
      relatedId: form.get("relatedId") || null,
    };

    try {
      const response = await fetch("/api/checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to create the check.");
      }

      router.push(`/admin/checks/${data.check.id}`);
      router.refresh();
    } catch (err) {
      setError(err.message || "Unable to create the check.");
      setSubmitting(false);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {error ? <div className={styles.error}>{error}</div> : null}

      <div className={styles.grid}>
        <div className={styles.field}>
          <label htmlFor="accountId">Bank account</label>
          <select id="accountId" name="accountId" required defaultValue={accounts[0]?.id || ""}>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} — next check #{Number(account.last_check_number) + 1}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="checkDate">Check date</label>
          <input id="checkDate" name="checkDate" type="date" required defaultValue={today} />
        </div>

        <div className={`${styles.field} ${styles.full}`}>
          <label htmlFor="payee">Pay to the order of</label>
          <input
            id="payee"
            name="payee"
            required
            maxLength={160}
            placeholder="Customer, vendor, or employee name"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="amount">Amount</label>
          <input
            id="amount"
            name="amount"
            type="number"
            min="0.01"
            max="999999999.99"
            step="0.01"
            required
            placeholder="0.00"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="memo">Memo</label>
          <input id="memo" name="memo" maxLength={140} placeholder="Refund, invoice, order number..." />
        </div>

        <div className={styles.field}>
          <label htmlFor="relatedType">Related record</label>
          <select id="relatedType" name="relatedType" defaultValue="">
            <option value="">None</option>
            <option value="payment">Stripe payment</option>
            <option value="refund">Refund</option>
            <option value="order">Order</option>
            <option value="vendor">Vendor</option>
            <option value="expense">Expense</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="relatedId">Record ID</label>
          <input id="relatedId" name="relatedId" maxLength={200} placeholder="Optional Stripe or portal ID" />
        </div>

        <div className={`${styles.field} ${styles.full}`}>
          <label htmlFor="mailingAddress">Mailing address</label>
          <textarea id="mailingAddress" name="mailingAddress" rows="3" maxLength={500} />
        </div>

        <div className={`${styles.field} ${styles.full}`}>
          <label htmlFor="internalNotes">Private notes</label>
          <textarea id="internalNotes" name="internalNotes" rows="3" maxLength={1500} />
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.button} type="submit" disabled={submitting || accounts.length === 0}>
          {submitting ? "Creating..." : "Create check"}
        </button>
        <button className={styles.secondaryButton} type="button" onClick={() => router.back()}>
          Cancel
        </button>
      </div>
    </form>
  );
}
