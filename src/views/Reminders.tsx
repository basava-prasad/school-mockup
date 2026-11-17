"use client";
import React, { useMemo, useState } from "react";
import { Bell, Users, Wallet, Send, UserX, History, CalendarClock, Play, CheckCircle2, Loader2, Database, Search, Contact, FileText, MessageCircle, ClipboardCheck, Eye, BadgeCheck, CheckCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { Avatar, Badge, Btn, Card, CardHeader, Check, Confirm, Empty, Modal, Pager, SearchBox, Select, Stat, Table, Td, Textarea, Toggle, Tr, statusTone, usePaged } from "@/components/ui";
import { FEE_MESSAGE } from "@/lib/data";
import { TODAY, addDays, cx, fmtDate, money, num, weekday } from "@/lib/utils";
import { go } from "@/lib/router";

export function fillTemplate(body: string, v: Record<string, string>) {
  return body.replace(/\{\{(\w+)\}\}/g, (_, k) => v[k] ?? `{{${k}}}`);
}
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEK_START = "2026-11-09"; // Monday of the current week
const STEPS = [
  { t: "System checks fee records", d: "Scans all student fee ledgers", icon: Database },
  { t: "Identifies outstanding payments", d: "Filters accounts with balance > 0", icon: Search },
  { t: "Finds parent contacts", d: "Matches registered mobile numbers", icon: Contact },
  { t: "Generates personalised messages", d: "Fills template placeholders", icon: FileText },
  { t: "Simulates message delivery", d: "Sends via selected channels", icon: MessageCircle },
  { t: "Updates notification history", d: "Logs every delivery status", icon: ClipboardCheck },
];

export function WhatsAppBubble({ text, time = "10:00 AM", sender }: { text: string; time?: string; sender?: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2.5 bg-[#075e54] px-4 py-2.5 text-white"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-bold">SA</span><div className="leading-tight"><p className="text-sm font-medium">{sender ?? "School Administration"}</p><p className="text-[10px] text-white/70">Business account · online</p></div></div>
      <div className="bg-[#ece5dd] p-4" style={{ backgroundImage: "radial-gradient(rgba(0,0,0,0.035) 1px, transparent 1px)", backgroundSize: "14px 14px" }}>
        <div className="relative ml-0 max-w-[92%] rounded-lg rounded-tl-none bg-white px-3 py-2 text-[13px] leading-relaxed text-slate-800 shadow-sm">
          <p className="whitespace-pre-wrap">{text}</p>
          <p className="mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-400">{time} <CheckCheck size={12} className="text-sky-500" /></p>
        </div>
      </div>
    </div>
  );
}

export default function Reminders() {
  const { s, up, toast, fee, parentOf, addNotifications, student, nextId } = useStore();
  const R = s.reminder;
  const setR = (p: Partial<typeof R>) => up(st => ({ reminder: { ...st.reminder, ...p } }));
  const tpl = s.templates.find(t => t.id === "TP5")?.body ?? FEE_MESSAGE;
  const [step, setStep] = useState(-1);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState<null | { sent: number; failed: number }>(null);
  const [prevId, setPrevId] = useState<string | null>(null);
  const [edit, setEdit] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [markPaid, setMarkPaid] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("All");

  const rows = useMemo(() => s.students.map(x => ({ x, f: fee(x.id), p: parentOf(x.parentId)!, log: s.reminderLog[x.id] as { last: string; status: string } | undefined })).filter(r => r.f.balance > 0), [s.students, s.payments, s.reminderLog, fee, parentOf]);
  const statusOf = (r: (typeof rows)[number]) => !r.log ? "Not notified" : r.log.status === "Failed" ? "Failed" : r.log.last >= WEEK_START ? "Sent" : "Pending";
  const shown = rows.filter(r => (filter === "All" || statusOf(r) === filter) && (!q || r.x.name.toLowerCase().includes(q.toLowerCase()) || r.p.name.toLowerCase().includes(q.toLowerCase())));
  const pg = usePaged(shown, 8);

  const sentThisWeek = rows.filter(r => r.log && r.log.last >= WEEK_START && r.log.status !== "Failed").length;
  const notNotified = rows.filter(r => statusOf(r) === "Not notified" || statusOf(r) === "Pending" || statusOf(r) === "Failed").length;
  const nextDate = (() => { const target = WEEKDAYS.indexOf(R.day); let d = addDays(TODAY, 1); while (weekday(d) !== target) d = addDays(d, 1); return d; })();

  const vars = (r: (typeof rows)[number]) => ({ student_name: r.x.name, class_name: `${r.x.cls}-${r.x.section}`, pending_amount: num(r.f.balance), due_date: fmtDate(r.f.due), parent_name: r.p.name });

  const send = (r: (typeof rows)[number], channels = R.channels.length ? R.channels : ["WhatsApp"]) => {
    const failed = r.x.name.length % 11 === 0;
    addNotifications(channels.map(ch => ({ parentName: r.p.name, studentName: r.x.name, cls: `${r.x.cls}-${r.x.section}`, type: "Fee Reminder", channel: ch, date: TODAY, status: failed ? "Failed" as const : "Delivered" as const })));
    up(st => ({ reminderLog: { ...st.reminderLog, [r.x.id]: { last: TODAY, status: failed ? "Failed" : "Delivered" } } }));
    return !failed;
  };

  const runCycle = async () => {
    if (running) return;
    setRunning(true); setDone(null);
    for (let i = 0; i < STEPS.length; i++) { setStep(i); await new Promise(r => setTimeout(r, 750)); }
    const targets = rows.filter(r => !R.onlyOutstanding || r.f.balance > 0);
    let ok = 0, bad = 0;
    targets.forEach(r => (send(r) ? ok++ : bad++));
    setStep(STEPS.length); setRunning(false); setDone({ sent: ok, failed: bad });
    toast(`Reminder cycle complete — ${ok} delivered, ${bad} failed (simulated)`, bad ? "warn" : "ok");
  };

  const preview = prevId ? rows.find(r => r.x.id === prevId) ?? (() => { const x = student(prevId); return x ? { x, f: fee(x.id), p: parentOf(x.parentId)!, log: undefined } : undefined; })() : undefined;
  const sample = rows[0];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><div className="flex items-center gap-2"><h1 className="text-xl font-semibold text-slate-900">Automated Fee Reminders</h1><Badge tone={R.enabled ? "green" : "slate"}>{R.enabled ? "Active" : "Paused"}</Badge></div><p className="mt-0.5 text-sm text-slate-500">Weekly reminders to parents with outstanding dues — fully simulated in this prototype</p></div>
        <div className="flex gap-2"><Btn tone="secondary" icon={<History size={15} />} onClick={() => go("communication/history")}>Notification history</Btn><Btn icon={running ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />} onClick={runCycle} disabled={running}>{running ? "Running cycle…" : "Run reminder cycle now"}</Btn></div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <Stat label="Students with dues" value={String(rows.length)} icon={<Users size={17} />} tone="amber" />
        <Stat label="Total pending" value={money(rows.reduce((a, r) => a + r.f.balance, 0))} icon={<Wallet size={17} />} tone="red" />
        <Stat label="Sent this week" value={String(sentThisWeek)} icon={<Send size={17} />} tone="green" />
        <Stat label="Not yet notified" value={String(notNotified)} icon={<UserX size={17} />} tone="amber" sub="this week" />
        <Stat label="Last reminder cycle" value="9 Nov" icon={<History size={17} />} sub="Monday, 10:00 AM · Auto" />
        <Stat label="Next scheduled" value={R.enabled ? `${fmtDate(nextDate, false)}` : "Paused"} icon={<CalendarClock size={17} />} tone="violet" sub={R.enabled ? `${R.day}, ${R.time}` : "Auto reminders off"} />
      </div>

      <Card>
        <CardHeader title="Weekly reminder workflow" sub="What the system does at each scheduled run" action={done && <Badge tone="green"><CheckCircle2 size={12} /> Last run: {done.sent} delivered{done.failed ? `, ${done.failed} failed` : ""}</Badge>} />
        <div className="grid gap-3 md:grid-cols-6">
          {STEPS.map((st, i) => {
            const state = step > i || step === STEPS.length ? "done" : step === i ? "active" : "idle";
            const Icon = st.icon;
            return (
              <div key={i} className="relative">
                <div className={cx("h-full rounded-xl border p-3.5 transition-all", state === "done" ? "border-emerald-200 bg-emerald-50/60" : state === "active" ? "border-brand-400 bg-brand-50 shadow-md ring-2 ring-brand-100" : "border-slate-200 bg-white")}>
                  <div className="mb-2 flex items-center justify-between"><span className={cx("flex h-8 w-8 items-center justify-center rounded-lg", state === "done" ? "bg-emerald-500 text-white" : state === "active" ? "bg-brand-700 text-white" : "bg-slate-100 text-slate-500")}>{state === "done" ? <CheckCircle2 size={16} /> : state === "active" ? <Loader2 size={16} className="animate-spin" /> : <Icon size={16} />}</span><span className="text-[10px] font-bold text-slate-300">0{i + 1}</span></div>
                  <p className="text-[13px] font-semibold leading-snug text-slate-800">{st.t}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{st.d}</p>
                </div>
                {i < STEPS.length - 1 && <span className="absolute -right-2.5 top-1/2 z-10 hidden -translate-y-1/2 text-slate-300 md:block">›</span>}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Automation settings" sub="Changes apply to the next scheduled cycle" action={<div className="flex items-center gap-2"><span className="text-xs text-slate-500">{R.enabled ? "Enabled" : "Disabled"}</span><Toggle on={R.enabled} onChange={v => { setR({ enabled: v }); toast(v ? "Automatic reminders enabled" : "Automatic reminders disabled", v ? "ok" : "warn"); }} label="Enable automatic reminders" /></div>} />
          <div className={cx("grid gap-4 sm:grid-cols-3", !R.enabled && "pointer-events-none opacity-50")}>
            <label className="block"><span className="mb-1 block text-xs font-medium text-slate-600">Frequency</span><Select value={R.frequency} onChange={e => setR({ frequency: e.target.value })}><option>Weekly</option><option>Fortnightly</option><option>Monthly</option></Select></label>
            <label className="block"><span className="mb-1 block text-xs font-medium text-slate-600">Reminder day</span><Select value={R.day} onChange={e => setR({ day: e.target.value })}>{WEEKDAYS.slice(1).map(d => <option key={d}>{d}</option>)}</Select></label>
            <label className="block"><span className="mb-1 block text-xs font-medium text-slate-600">Time</span><Select value={R.time} onChange={e => setR({ time: e.target.value })}>{["08:00 AM", "10:00 AM", "12:00 PM", "04:00 PM", "06:00 PM"].map(d => <option key={d}>{d}</option>)}</Select></label>
          </div>
          <div className={cx("mt-5", !R.enabled && "pointer-events-none opacity-50")}>
            <p className="mb-2 text-xs font-medium text-slate-600">Communication channels</p>
            <div className="flex flex-wrap gap-4">{["WhatsApp", "SMS", "Email"].map(c => <Check key={c} checked={R.channels.includes(c)} onChange={v => setR({ channels: v ? [...R.channels, c] : R.channels.filter(x => x !== c) })} label={c} />)}</div>
            <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium text-slate-800">Send only to parents with outstanding dues</p><p className="text-xs text-slate-500">Skips accounts that are fully paid</p></div><Toggle on={R.onlyOutstanding} onChange={v => setR({ onlyOutstanding: v })} /></div>
              <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium text-slate-800">Stop reminders when full payment is completed</p><p className="text-xs text-slate-500">Automatically removes the student from the reminder list</p></div><Toggle on={R.stopOnPaid} onChange={v => setR({ stopOnPaid: v })} /></div>
            </div>
          </div>
          <div className="mt-5 flex justify-end"><Btn onClick={() => toast("Reminder settings saved")}>Save settings</Btn></div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Message preview" sub="WhatsApp · personalised per parent" action={<Btn size="sm" tone="soft" onClick={() => setEdit(true)}>Edit template</Btn>} />
          {sample ? <>
            <Select className="mb-3" value={(preview ?? sample).x.id} onChange={e => setPrevId(e.target.value)}>{rows.map(r => <option key={r.x.id} value={r.x.id}>{r.x.name} — {r.x.cls}-{r.x.section}</option>)}</Select>
            <WhatsAppBubble time={R.time} text={fillTemplate(tpl, vars(preview ?? sample))} />
          </> : <Empty text="No pending dues" />}
        </Card>
      </div>

      <Card pad={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-3"><CardHeader title="Students with pending dues" sub={`${rows.length} accounts · ${money(rows.reduce((a, r) => a + r.f.balance, 0))} outstanding`} />
          <div className="mb-4 flex flex-wrap items-center gap-2"><SearchBox value={q} onChange={setQ} placeholder="Search student or parent…" className="w-56" /><Select className="!w-40" value={filter} onChange={e => setFilter(e.target.value)}><option value="All">All statuses</option>{["Sent", "Pending", "Failed", "Not notified"].map(x => <option key={x}>{x}</option>)}</Select></div></div>
        <Table head={["Student", "Class", "Parent", "Contact", { label: "Total", right: true }, { label: "Paid", right: true }, { label: "Pending", right: true }, "Due date", "Last reminder", "Status", "Actions"]}>
          {pg.slice.map(r => { const st = statusOf(r); return (
            <Tr key={r.x.id}>
              <Td><span className="flex items-center gap-2 font-medium text-slate-900"><Avatar name={r.x.name} size={26} />{r.x.name}</span></Td>
              <Td className="text-xs">{r.x.cls}-{r.x.section}</Td><Td className="text-xs">{r.p.name}</Td><Td className="whitespace-nowrap text-xs">{r.p.phone}</Td>
              <Td right>{money(r.f.net)}</Td><Td right className="text-emerald-700">{money(r.f.paid)}</Td><Td right className="font-semibold text-red-600">{money(r.f.balance)}</Td>
              <Td className={cx("whitespace-nowrap text-xs", r.f.due < TODAY && "font-medium text-red-600")}>{fmtDate(r.f.due, false)}</Td>
              <Td className="whitespace-nowrap text-xs">{r.log ? fmtDate(r.log.last, false) : "—"}</Td>
              <Td><Badge tone={statusTone(st)}>{st}</Badge></Td>
              <Td><div className="flex gap-0.5">
                <Btn size="sm" tone="ghost" title="View student" icon={<Eye size={14} />} onClick={() => go(`students/${r.x.id}/fees`)} />
                <Btn size="sm" tone="ghost" title="Preview message" icon={<MessageCircle size={14} />} onClick={() => { setPrevId(r.x.id); setPreviewOpen(true); }} />
                <Btn size="sm" tone="soft" icon={<Send size={13} />} onClick={() => { const ok = send(r); toast(ok ? `Reminder delivered to ${r.p.name} (simulated)` : `Delivery to ${r.p.name} failed — will retry`, ok ? "ok" : "err"); }}>Send</Btn>
                <Btn size="sm" tone="ghost" title="Mark as paid" icon={<BadgeCheck size={14} className="text-emerald-600" />} onClick={() => setMarkPaid(r.x.id)} />
              </div></Td>
            </Tr>); })}
        </Table>
        {shown.length === 0 && <Empty text="No matching accounts" />}
        <Pager p={pg} />
      </Card>

      <Modal open={previewOpen && !!preview} onClose={() => setPreviewOpen(false)} title="Message preview" sub={preview ? `To ${preview.p.name} · ${preview.p.phone}` : ""} footer={<><Btn tone="secondary" onClick={() => setPreviewOpen(false)}>Close</Btn>{preview && <Btn icon={<Send size={14} />} onClick={() => { const ok = send(preview as never); toast(ok ? "Reminder delivered (simulated)" : "Delivery failed", ok ? "ok" : "err"); setPreviewOpen(false); }}>Send reminder</Btn>}</>}>
        {preview && <WhatsAppBubble time={R.time} text={fillTemplate(tpl, vars(preview as never))} />}
      </Modal>

      <Modal open={edit} onClose={() => setEdit(false)} wide title="Edit reminder template" sub="Use {{student_name}}, {{class_name}}, {{pending_amount}}, {{due_date}}" footer={<Btn onClick={() => { setEdit(false); toast("Template saved"); }}>Done</Btn>}>
        <div className="grid gap-4 md:grid-cols-2"><Textarea rows={13} value={tpl} onChange={e => up(st => ({ templates: st.templates.map(t => t.id === "TP5" ? { ...t, body: e.target.value } : t) }))} />{sample && <WhatsAppBubble text={fillTemplate(tpl, vars(sample))} />}</div>
      </Modal>

      <Confirm tone="primary" open={!!markPaid} title="Mark as paid?" confirmLabel="Mark as paid" message={<>Record a full payment of <b>{markPaid ? money(fee(markPaid).balance) : ""}</b> for <b>{markPaid ? student(markPaid)?.name : ""}</b>? {R.stopOnPaid && "Reminders will stop automatically."} (Simulation)</>}
        onConfirm={() => { const id = markPaid!; const amt = fee(id).balance; up(st => ({ payments: [{ id: nextId("PAY"), receipt: `RCT-2026-${1600 + st.payments.length}`, studentId: id, amount: amt, date: TODAY, mode: "Cash", note: "Marked as paid (reminders)" }, ...st.payments] })); toast(`${student(id)?.name} marked as paid — reminders stopped`); }} onClose={() => setMarkPaid(null)} />
    </div>
  );
}
