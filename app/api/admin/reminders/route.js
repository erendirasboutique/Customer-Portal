import { NextResponse } from "next/server";
import { db, requireAdmin, nextDue, todayPT, REPEATS } from "@/lib/studio/server";
import { PRESETS } from "@/lib/studio/reminder-presets";

export const dynamic = "force-dynamic";

/* ============================================================
   POST /api/admin/reminders   (admins only)
   { action: "create", ...fields }
   { action: "update", id, ...fields }
   { action: "delete", id }
   { action: "done",   id, amount?, note?, received? }  paid / reordered / done
   { action: "stock",  id, delta }                      +/- on hand
   { action: "seed",   keys: [...] }                    add starter items
   ============================================================ */

const KINDS = ["bill", "supply", "task"];

function str(v, max) {
  const s = String(v == null ? "" : v).trim().slice(0, max);
  return s || null;
}
function num(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function int(v) {
  const n = num(v);
  return n == null ? null : Math.max(0, Math.round(n));
}

function clean(b) {
  const name = str(b.name, 120);
  if (!name) return { error: "Give it a name." };
  const kind = KINDS.includes(b.kind) ? b.kind : "task";
  const repeat = REPEATS[b.repeat] ? b.repeat : "none";
  const due = str(b.next_due, 10);
  if (due && !/^\d{4}-\d{2}-\d{2}$/.test(due)) return { error: "Pick a valid date." };
  if (repeat !== "none" && !due) return { error: "Pick the next due date so it can repeat." };
  const everyDays = repeat === "custom" ? int(b.every_days) : null;
  if (repeat === "custom" && !(everyDays >= 1 && everyDays <= 730)) return { error: "Repeat every 1 to 730 days." };
  const link = str(b.link, 500);
  if (link && !/^https?:\/\//i.test(link)) return { error: "The link must start with https://" };
  const amount = num(b.amount);
  if (amount != null && (amount < 0 || amount > 1000000)) return { error: "Check the amount." };

  return {
    row: {
      name: name,
      kind: kind,
      category: str(b.category, 60),
      vendor: str(b.vendor, 120),
      amount: amount,
      next_due: due,
      repeat: repeat,
      every_days: everyDays,
      link: link,
      notes: str(b.notes, 1000),
      unit: kind === "supply" ? str(b.unit, 30) : null,
      on_hand: kind === "supply" ? int(b.on_hand) : null,
      reorder_at: kind === "supply" ? int(b.reorder_at) : null,
      is_active: true,
      updated_at: new Date().toISOString(),
    },
  };
}

function firstOfNextMonth() {
  const t = todayPT();
  const y = +t.slice(0, 4);
  const m = +t.slice(5, 7);
  const ny = m === 12 ? y + 1 : y;
  const nm = m === 12 ? 1 : m + 1;
  return ny + "-" + String(nm).padStart(2, "0") + "-01";
}

export async function POST(req) {
  const me = await requireAdmin();
  if (!me.ok) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const b = await req.json().catch(function () { return {}; });
  const t = db().from("studio_reminders");

  try {
    if (b.action === "create" || b.action === "update") {
      const c = clean(b);
      if (c.error) return NextResponse.json({ error: c.error }, { status: 400 });
      if (b.action === "create") {
        const { data, error } = await t.insert(c.row).select().single();
        if (error) throw error;
        return NextResponse.json({ item: data });
      }
      if (!b.id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
      const { data, error } = await t.update(c.row).eq("id", b.id).select().single();
      if (error) throw error;
      return NextResponse.json({ item: data });
    }

    if (b.action === "delete") {
      const { error } = await t.delete().eq("id", b.id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (b.action === "done") {
      const { data: item } = await db().from("studio_reminders").select("*").eq("id", b.id).maybeSingle();
      if (!item) return NextResponse.json({ error: "Not found." }, { status: 404 });

      const received = int(b.received);
      const amount = num(b.amount);
      const action = item.kind === "bill" ? "paid" : item.kind === "supply" ? "reordered" : "done";

      await db().from("studio_reminder_log").insert({
        reminder_id: item.id,
        action: action,
        amount: amount != null ? amount : item.kind === "bill" ? item.amount : null,
        qty: received,
        note: str(b.note, 300),
        due_date: item.next_due,
        done_by: me.email,
      });

      const next = nextDue(item.next_due, item.repeat, item.every_days);
      const patch = {
        last_done_at: new Date().toISOString(),
        last_done_by: me.email,
        next_due: next,
        updated_at: new Date().toISOString(),
      };
      if (item.kind === "supply" && received) patch.on_hand = (item.on_hand || 0) + received;
      // One-time bills and tasks move to "Done" once checked off.
      if (!next && item.kind !== "supply") patch.is_active = false;

      const { data, error } = await db().from("studio_reminders").update(patch).eq("id", item.id).select().single();
      if (error) throw error;
      return NextResponse.json({ item: data, action: action });
    }

    if (b.action === "reopen") {
      const { data, error } = await t.update({ is_active: true, updated_at: new Date().toISOString() }).eq("id", b.id).select().single();
      if (error) throw error;
      return NextResponse.json({ item: data });
    }

    if (b.action === "stock") {
      const { data: item } = await db().from("studio_reminders").select("id, on_hand").eq("id", b.id).maybeSingle();
      if (!item) return NextResponse.json({ error: "Not found." }, { status: 404 });
      const delta = Math.round(Number(b.delta) || 0);
      const set = b.set != null && b.set !== "" ? int(b.set) : null;
      const onHand = set != null ? set : Math.max(0, (item.on_hand || 0) + delta);
      const { data, error } = await db().from("studio_reminders").update({ on_hand: onHand, updated_at: new Date().toISOString() }).eq("id", item.id).select().single();
      if (error) throw error;
      return NextResponse.json({ item: data });
    }

    if (b.action === "seed") {
      const keys = Array.isArray(b.keys) ? b.keys.filter(function (k) { return PRESETS[k]; }) : [];
      if (!keys.length) return NextResponse.json({ error: "Pick at least one." }, { status: 400 });
      const due = firstOfNextMonth();
      const rows = keys.map(function (k) {
        const p = PRESETS[k];
        return {
          name: p.name,
          kind: p.kind,
          category: p.category,
          unit: p.unit || null,
          reorder_at: p.reorder_at == null ? null : p.reorder_at,
          repeat: p.repeat || "none",
          next_due: p.repeat ? due : null,
          is_active: true,
        };
      });
      const { error } = await t.insert(rows);
      if (error) throw error;
      return NextResponse.json({ added: rows.length });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Something went wrong." }, { status: 500 });
  }
}
