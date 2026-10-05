import { NextResponse } from "next/server";
import { db, todayPT, daysBetween, emailEnabled, sendEmail, escapeHtml, money, prettyDate } from "@/lib/studio/server";

export const dynamic = "force-dynamic";

/* ============================================================
   GET /api/cron/studio-reminders   (runs once a day — see README)
   Emails STUDIO_REMINDER_EMAIL one short list of:
     • bills and reminders overdue or due in the next 3 days
     • supplies at or under their reorder number
     • documents expiring inside their reminder window
   Sends nothing on days when there's nothing to do.
   ============================================================ */

const SOON_DAYS = 3;

export async function GET(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== "Bearer " + secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const to = process.env.STUDIO_REMINDER_EMAIL;
  if (!to || !emailEnabled()) return NextResponse.json({ skipped: "email not set up" });

  const today = todayPT();

  const { data: items } = await db().from("studio_reminders").select("*").eq("is_active", true);
  const { data: docs } = await db().from("studio_documents").select("id, title, expires_on, remind_days").not("expires_on", "is", null);

  const due = (items || [])
    .filter(function (i) { return i.next_due && daysBetween(today, i.next_due) <= SOON_DAYS; })
    .sort(function (a, b) { return a.next_due.localeCompare(b.next_due); });
  const low = (items || []).filter(function (i) {
    return i.kind === "supply" && i.on_hand != null && i.reorder_at != null && i.on_hand <= i.reorder_at;
  });
  const expiring = (docs || []).filter(function (d) {
    const n = daysBetween(today, d.expires_on);
    return n <= (d.remind_days ?? 30) && n >= -30;
  }).sort(function (a, b) { return a.expires_on.localeCompare(b.expires_on); });

  if (!due.length && !low.length && !expiring.length) return NextResponse.json({ sent: false, reason: "nothing due" });

  function whenText(dateStr) {
    const n = daysBetween(today, dateStr);
    if (n < 0) return "overdue " + -n + (n === -1 ? " day" : " days");
    if (n === 0) return "due today";
    if (n === 1) return "due tomorrow";
    return "due " + prettyDate(dateStr, { noYear: true });
  }

  function section(title, rows) {
    if (!rows.length) return "";
    return '<p style="margin:22px 0 8px;font-size:10px;letter-spacing:.24em;color:#eda033">' + title + "</p>" +
      rows.map(function (r) {
        return '<div style="background:#fffdf8;border-radius:12px;padding:10px 14px;margin-bottom:6px;font-size:14px">' + r + "</div>";
      }).join("");
  }

  const site = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  const html = '<div style="background:#fdfcf7;padding:24px 12px;font-family:Georgia,serif;color:#da5e16">' +
    '<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:22px;padding:26px 24px">' +
    '<p style="margin:0;font-size:10px;letter-spacing:.28em;color:#eda033">ADMIN STUDIO</p>' +
    '<p style="margin:6px 0 0;font-size:26px">Today’s reminders</p>' +
    section("BILLS & REMINDERS", due.map(function (i) {
      return "<b>" + escapeHtml(i.name) + "</b> — " + whenText(i.next_due) + (i.amount != null ? " · " + money(i.amount) : "");
    })) +
    section("RUNNING LOW", low.map(function (i) {
      return "<b>" + escapeHtml(i.name) + "</b> — " + i.on_hand + " " + escapeHtml(i.unit || "left") + " (reorder at " + i.reorder_at + ")";
    })) +
    section("DOCUMENTS TO RENEW", expiring.map(function (d) {
      const n = daysBetween(today, d.expires_on);
      return "<b>" + escapeHtml(d.title) + "</b> — " + (n < 0 ? "expired " + prettyDate(d.expires_on) : "expires " + prettyDate(d.expires_on));
    })) +
    (site ? '<p style="margin:22px 0 0"><a href="' + site + '/admin/reminders" style="display:inline-block;background:#eda033;color:#fff;text-decoration:none;border-radius:999px;padding:11px 20px;font-size:14px">Open Bills &amp; supplies</a></p>' : "") +
    "</div></div>";

  const count = due.length + low.length + expiring.length;
  await sendEmail({ to: to, subject: count + (count === 1 ? " thing" : " things") + " to take care of — Admin Studio", html: html });
  return NextResponse.json({ sent: true, due: due.length, low: low.length, documents: expiring.length });
}
