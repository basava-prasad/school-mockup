"use client";
import React, { useMemo, useState } from "react";
import { Users, Send, CheckCheck, AlertTriangle, Clock, MessageCircle, Smartphone, Mail, Bell, Pencil, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useStore } from "@/lib/store";
import { Avatar, Badge, Btn, Card, CardHeader, CHART, Check, Empty, Field, Input, Modal, Pager, SearchBox, Select, Stat, Table, Tabs, Td, Textarea, Tr, statusTone, usePaged } from "@/components/ui";
import { Template } from "@/lib/data";
import { TODAY, cx, fmtDate, num } from "@/lib/utils";
import { go } from "@/lib/router";
import { WhatsAppBubble, fillTemplate } from "./Reminders";

const TABS = [{ id: "dashboard", label: "Dashboard" }, { id: "compose", label: "Bulk Messaging" }, { id: "templates", label: "Templates" }, { id: "history", label: "Notification History" }];
const CH_ICON: Record<string, React.ReactNode> = { WhatsApp: <MessageCircle size={14} />, SMS: <Smartphone size={14} />, Email: <Mail size={14} />, "In-app": <Bell size={14} /> };
const TYPES = ["General Announcement", "Holiday Notification", "Examination Reminder", "Attendance Alert", "Fee Reminder", "Parent-Teacher Meeting", "Result Announcement"];

export default function Communication({ sub }: { sub: string }) {
  const tab = TABS.some(t => t.id === sub) ? sub : "dashboard";
  const [tpl, setTpl] = useState<Template | null>(null);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-xl font-semibold text-slate-900">Parent Communication Center</h1><p className="text-sm text-slate-500">Reach every parent on WhatsApp, SMS, email and the parent app — messages are simulated in this prototype</p></div>
        <div className="flex gap-2"><Btn tone="secondary" icon={<Bell size={15} />} onClick={() => go("reminders")}>Automated fee reminders</Btn><Btn icon={<Send size={15} />} onClick={() => go("communication/compose")}>New message</Btn></div>
      </div>
      <Tabs tabs={TABS} value={tab} onChange={t => go(t === "dashboard" ? "communication" : `communication/${t}`)} />
      {tab === "dashboard" && <Dash />}
      {tab === "compose" && <Compose initial={tpl} />}
      {tab === "templates" && <Templates onUse={t => { setTpl(t); go("communication/compose"); }} />}
      {tab === "history" && <History />}
    </div>
  );
}

function Dash() {
  const { s } = useStore();
  const n = s.notifications;
  const delivered = n.filter(x => x.status === "Delivered" || x.status === "Read").length;
  const failed = n.filter(x => x.status === "Failed").length;
  const pending = n.filter(x => x.status === "Pending").length;
  const byCh = ["WhatsApp", "SMS", "Email", "In-app"].map(c => ({ c, v: n.filter(x => x.channel === c).length }));
  const byType = TYPES.map(t => ({ t: t.replace(" Notification", "").replace(" Announcement", ""), v: n.filter(x => x.type === t).length }));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <Stat label="Total parents" value={num(1086)} icon={<Users size={17} />} sub={`${s.parents.length} in sample`} />
        <Stat label="Messages sent" value={num(n.length + 4318)} icon={<Send size={17} />} tone="violet" sub="This academic year" />
        <Stat label="Delivered" value={`${Math.round((delivered / n.length) * 100)}%`} icon={<CheckCheck size={17} />} tone="green" sub={`${delivered} of ${n.length} recent`} />
        <Stat label="Failed" value={String(failed)} icon={<AlertTriangle size={17} />} tone="red" sub="Retry from history" />
        <Stat label="Pending" value={String(pending)} icon={<Clock size={17} />} tone="amber" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card><CardHeader title="Messages by channel" />
          <div className="h-52"><ResponsiveContainer><PieChart><Pie data={byCh} dataKey="v" nameKey="c" innerRadius={48} outerRadius={78} stroke="none">{[CHART.navy, CHART.blue, CHART.light, CHART.violet].map((c, i) => <Cell key={i} fill={c} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">{byCh.map((c, i) => <span key={c.c} className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: [CHART.navy, CHART.blue, CHART.light, CHART.violet][i] }} />{c.c} <b className="ml-auto">{c.v}</b></span>)}</div>
        </Card>
        <Card className="lg:col-span-2"><CardHeader title="Messages by type" />
          <div className="h-64"><ResponsiveContainer><BarChart data={byType} layout="vertical" margin={{ left: 30 }}><CartesianGrid stroke={CHART.grid} horizontal={false} /><XAxis type="number" tickLine={false} axisLine={false} /><YAxis type="category" dataKey="t" tickLine={false} axisLine={false} width={130} /><Tooltip /><Bar dataKey="v" name="Messages" fill={CHART.navy} radius={[0, 4, 4, 0]} barSize={16} /></BarChart></ResponsiveContainer></div>
        </Card>
      </div>
      <Card pad={false}><div className="flex items-center justify-between p-5 pb-2"><CardHeader title="Recent messages" /><a href="#/communication/history" className="text-xs font-medium text-brand-600">View history →</a></div>
        <Table head={["Parent", "Student", "Type", "Channel", "Date", "Status"]}>{n.slice(0, 6).map(x => <Tr key={x.id}><Td className="font-medium text-slate-800">{x.parentName}</Td><Td>{x.studentName}</Td><Td className="text-xs">{x.type}</Td><Td><span className="flex items-center gap-1.5 text-xs">{CH_ICON[x.channel]}{x.channel}</span></Td><Td className="text-xs">{fmtDate(x.date, false)}</Td><Td><Badge tone={statusTone(x.status)}>{x.status}</Badge></Td></Tr>)}</Table></Card>
    </div>
  );
}

function Compose({ initial }: { initial: Template | null }) {
  const { s, toast, addNotifications, parentOf } = useStore();
  const [rt, setRt] = useState("all");
  const [cls, setCls] = useState("Grade 10");
  const [sec, setSec] = useState("A");
  const [picked, setPicked] = useState<string[]>([]);
  const [qs, setQs] = useState("");
  const [channels, setChannels] = useState<string[]>(initial ? [initial.channel === "In-app" ? "In-app" : initial.channel] : ["WhatsApp"]);
  const [type, setType] = useState(initial?.name ?? "General Announcement");
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [body, setBody] = useState(initial?.body ?? "Dear Parent,\n\n\n\nRegards,\nSchool Administration");
  const [confirm, setConfirm] = useState(false);
  const [phase, setPhase] = useState<"idle" | "sending" | "done">("idle");
  const [prog, setProg] = useState(0);
  const [prevCh, setPrevCh] = useState("");

  const recipients = useMemo(() => {
    const active = s.students.filter(x => x.status === "Active");
    let list = active;
    if (rt === "class") list = active.filter(x => x.cls === cls);
    if (rt === "section") list = active.filter(x => x.cls === cls && x.section === sec);
    if (rt === "selected") list = active.filter(x => picked.includes(x.id));
    if (rt === "dues") list = active.filter(x => { const f = s.feeRecords.find(r => r.studentId === x.id); const paid = s.payments.filter(p => p.studentId === x.id).reduce((a, p) => a + p.amount, 0); return f && f.total - f.discount - paid > 0; });
    const seen = new Set<string>();
    return list.filter(x => (seen.has(x.parentId) ? false : (seen.add(x.parentId), true)));
  }, [rt, cls, sec, picked, s.students, s.feeRecords, s.payments]);

  const first = recipients[0];
  const vars = (x: typeof first): Record<string, string> => x ? { student_name: x.name, class_name: `${x.cls}-${x.section}`, parent_name: parentOf(x.parentId)?.name ?? "Parent", date: "Mon, 16 Nov 2026", time: "10:00 AM", exam_name: "Unit Test 2", occasion: "Diwali", message: "…", pending_amount: "—", due_date: "—" } : {} as Record<string, string>;
  const rendered = fillTemplate(body, vars(first));
  const pc = prevCh || channels[0] || "WhatsApp";
  const openTpl = (id: string) => { const t = s.templates.find(x => x.id === id); if (t) { setType(t.name); setSubject(t.subject); setBody(t.body); setChannels([t.channel]); } };

  const doSend = async () => {
    setPhase("sending"); setProg(0);
    for (let i = 1; i <= 10; i++) { setProg(i * 10); await new Promise(r => setTimeout(r, 160)); }
    const rows = recipients.flatMap((x, i) => channels.map(ch => ({ parentName: parentOf(x.parentId)?.name ?? "—", studentName: x.name, cls: `${x.cls}-${x.section}`, type, channel: ch, date: TODAY, status: (i * 7 + ch.length) % 23 === 0 ? "Failed" as const : "Delivered" as const, subject })));
    addNotifications(rows);
    setPhase("done");
    toast(`${rows.length} messages processed — added to notification history`);
  };
  const reset = () => { setConfirm(false); setPhase("idle"); setProg(0); };

  const canSend = recipients.length > 0 && channels.length > 0 && body.trim().length > 10;
  const used = s.classes.filter(c => s.students.some(x => x.cls === c.name));

  return (
    <div className="grid gap-5 xl:grid-cols-5">
      <div className="space-y-4 xl:col-span-3">
        <Card>
          <CardHeader title="1 · Choose recipients" action={<Badge tone="blue"><Users size={11} /> {recipients.length} parent{recipients.length === 1 ? "" : "s"}</Badge>} />
          <div className="grid gap-2 sm:grid-cols-3">
            {[["all", "All parents"], ["class", "Specific class"], ["section", "Specific section"], ["selected", "Selected students"], ["dues", "Parents with pending dues"]].map(([k, l]) => (
              <button key={k} onClick={() => setRt(k)} className={cx("rounded-lg border px-3 py-2.5 text-left text-sm transition", rt === k ? "border-brand-600 bg-brand-50 font-medium text-brand-800 ring-1 ring-brand-600" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>{l}</button>
            ))}
          </div>
          {(rt === "class" || rt === "section") && (
            <div className="mt-3 flex gap-3"><Select className="!w-40" value={cls} onChange={e => { setCls(e.target.value); setSec(s.classes.find(c => c.name === e.target.value)?.sections[0] ?? "A"); }}>{used.map(c => <option key={c.id}>{c.name}</option>)}</Select>{rt === "section" && <Select className="!w-32" value={sec} onChange={e => setSec(e.target.value)}>{(s.classes.find(c => c.name === cls)?.sections ?? ["A"]).map(x => <option key={x}>{x}</option>)}</Select>}</div>
          )}
          {rt === "selected" && (
            <div className="mt-3 rounded-lg border border-slate-200"><div className="border-b border-slate-100 p-2"><SearchBox value={qs} onChange={setQs} placeholder="Search students…" /></div>
              <div className="max-h-44 overflow-y-auto p-2">{s.students.filter(x => x.name.toLowerCase().includes(qs.toLowerCase())).map(x => <div key={x.id} className="px-2 py-1"><Check checked={picked.includes(x.id)} onChange={v => setPicked(v ? [...picked, x.id] : picked.filter(i => i !== x.id))} label={<span>{x.name} <span className="text-xs text-slate-400">· {x.cls}-{x.section}</span></span>} /></div>)}</div></div>
          )}
          {rt === "all" && <p className="mt-3 text-xs text-slate-500">Includes every active family in the sample dataset (one message per parent, even with multiple children).</p>}
        </Card>

        <Card>
          <CardHeader title="2 · Channels" />
          <div className="flex flex-wrap gap-2">{["WhatsApp", "SMS", "Email", "In-app"].map(c => { const on = channels.includes(c); return <button key={c} onClick={() => setChannels(on ? channels.filter(x => x !== c) : [...channels, c])} className={cx("flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm transition", on ? "border-brand-600 bg-brand-700 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>{CH_ICON[c]}{c === "In-app" ? "In-app notification" : c}</button>; })}</div>
        </Card>

        <Card>
          <CardHeader title="3 · Compose message" action={<Select className="!w-52" value="" onChange={e => e.target.value && openTpl(e.target.value)}><option value="">Load a template…</option>{s.templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</Select>} />
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Message type"><Select value={type} onChange={e => setType(e.target.value)}>{TYPES.map(t => <option key={t}>{t}</option>)}</Select></Field><Field label="Subject"><Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Children's Day holiday" /></Field></div>
          <Field className="mt-4" label="Message" hint="Placeholders: {{student_name}}, {{class_name}}, {{parent_name}}, {{date}}"><Textarea rows={8} value={body} onChange={e => setBody(e.target.value)} /></Field>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400"><span>{body.length} characters</span>·<span>≈ {Math.ceil(body.length / 160)} SMS segment(s)</span></div>
          <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
            <Btn tone="secondary" onClick={() => toast("Test message sent to your registered number (simulated)")} disabled={!canSend}>Send test</Btn>
            <Btn icon={<Send size={15} />} onClick={() => setConfirm(true)} disabled={!canSend}>Send to {recipients.length} parent{recipients.length === 1 ? "" : "s"}</Btn>
          </div>
        </Card>
      </div>

      <div className="xl:col-span-2">
        <div className="sticky top-4 space-y-3">
          <Card>
            <CardHeader title="Live preview" sub={first ? `Personalised for ${parentOf(first.parentId)?.name} (${first.name})` : "Select recipients to preview"} />
            <div className="mb-3 flex gap-1 rounded-lg bg-slate-100 p-1">{(channels.length ? channels : ["WhatsApp"]).map(c => <button key={c} onClick={() => setPrevCh(c)} className={cx("flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium", pc === c ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}>{CH_ICON[c]}{c}</button>)}</div>
            {pc === "WhatsApp" && <WhatsAppBubble text={rendered} />}
            {pc === "SMS" && <div className="rounded-2xl bg-slate-100 p-4"><p className="mb-2 text-center text-[10px] text-slate-400">SCHOOL · Today</p><div className="max-w-[90%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-white px-3.5 py-2.5 text-[13px] shadow-sm">{rendered}</div></div>}
            {pc === "Email" && <div className="overflow-hidden rounded-xl border border-slate-200 text-sm"><div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-xs text-slate-500"><p>From: <b className="text-slate-700">{s.school.name}</b></p><p>Subject: <b className="text-slate-700">{subject || "(no subject)"}</b></p></div><div className="whitespace-pre-wrap p-4 text-[13px] text-slate-700">{rendered}</div></div>}
            {pc === "In-app" && <div className="rounded-2xl bg-slate-100 p-4"><div className="rounded-xl bg-white p-3.5 shadow-sm"><div className="mb-1.5 flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-700 text-[10px] font-bold text-white">S</span><span className="text-[11px] font-medium text-slate-500">{s.school.name} · now</span></div><p className="text-sm font-semibold text-slate-900">{subject || type}</p><p className="mt-0.5 line-clamp-4 whitespace-pre-wrap text-[13px] text-slate-600">{rendered}</p></div></div>}
          </Card>
        </div>
      </div>

      <Modal open={confirm} onClose={() => phase !== "sending" && reset()} title={phase === "done" ? "Messages sent" : "Confirm sending"} footer={phase === "idle" ? <><Btn tone="secondary" onClick={reset}>Cancel</Btn><Btn icon={<Send size={14} />} onClick={doSend}>Confirm & send</Btn></> : phase === "done" ? <><Btn tone="secondary" onClick={() => { reset(); go("communication/history"); }}>View history</Btn><Btn onClick={reset}>Done</Btn></> : undefined}>
        {phase === "idle" && <div className="space-y-3 text-sm"><p className="text-slate-600">You are about to send <b>“{subject || type}”</b> to:</p><div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-lg bg-slate-50 py-3"><p className="text-xl font-semibold">{recipients.length}</p><p className="text-xs text-slate-500">Parents</p></div><div className="rounded-lg bg-slate-50 py-3"><p className="text-xl font-semibold">{channels.length}</p><p className="text-xs text-slate-500">Channels</p></div><div className="rounded-lg bg-slate-50 py-3"><p className="text-xl font-semibold">{recipients.length * channels.length}</p><p className="text-xs text-slate-500">Messages</p></div></div><p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Prototype mode: no real WhatsApp, SMS or email will be sent.</p></div>}
        {phase === "sending" && <div className="py-6 text-center"><Loader2 className="mx-auto animate-spin text-brand-700" size={32} /><p className="mt-3 text-sm font-medium text-slate-800">Sending messages…</p><div className="mx-auto mt-3 h-2 max-w-xs overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${prog}%` }} /></div></div>}
        {phase === "done" && <div className="py-4 text-center"><CheckCircle2 className="mx-auto text-emerald-500" size={44} /><p className="mt-3 text-base font-semibold text-slate-900">Delivered to {recipients.length} parents</p><p className="mt-1 text-sm text-slate-500">Delivery receipts have been added to the Notification History.</p></div>}
      </Modal>
    </div>
  );
}

function Templates({ onUse }: { onUse: (t: Template) => void }) {
  const { s, up, toast } = useStore();
  const [edit, setEdit] = useState<Template | null>(null);
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {s.templates.map(t => (
        <Card key={t.id} className="flex flex-col">
          <div className="mb-2 flex items-start justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><FileText size={17} /></span><Badge tone="slate">{t.channel}</Badge></div>
          <h3 className="font-semibold text-slate-900">{t.name}</h3>
          <p className="mt-1 line-clamp-4 flex-1 whitespace-pre-wrap text-xs leading-relaxed text-slate-500">{t.body}</p>
          <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3"><Btn size="sm" tone="soft" onClick={() => onUse(t)}>Use template</Btn><Btn size="sm" tone="secondary" icon={<Pencil size={13} />} onClick={() => setEdit(t)}>Edit & preview</Btn></div>
        </Card>
      ))}
      {edit && <TemplateEditor t={edit} onClose={() => setEdit(null)} />}
    </div>
  );
  function TemplateEditor({ t, onClose }: { t: Template; onClose: () => void }) {
    const [f, setF] = useState(t);
    return (
      <Modal open onClose={onClose} wide="xl" title={`Edit template — ${t.name}`} footer={<><Btn tone="secondary" onClick={onClose}>Cancel</Btn><Btn onClick={() => { up(st => ({ templates: st.templates.map(x => x.id === t.id ? f : x) })); toast("Template saved"); onClose(); }}>Save template</Btn></>}>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-3"><Field label="Name"><Input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field><div className="grid grid-cols-2 gap-3"><Field label="Default channel"><Select value={f.channel} onChange={e => setF({ ...f, channel: e.target.value })}>{["WhatsApp", "SMS", "Email", "In-app"].map(c => <option key={c}>{c}</option>)}</Select></Field><Field label="Subject"><Input value={f.subject} onChange={e => setF({ ...f, subject: e.target.value })} /></Field></div><Field label="Body" hint="Use {{placeholders}} for personalisation"><Textarea rows={10} value={f.body} onChange={e => setF({ ...f, body: e.target.value })} /></Field></div>
          <div><p className="mb-2 text-xs font-medium text-slate-600">Preview</p><WhatsAppBubble text={fillTemplate(f.body, { student_name: "Aarav Sharma", class_name: "Grade 10-A", pending_amount: "34,250", due_date: "20 Nov 2026", date: "17 Nov 2026", time: "10:00 AM", exam_name: "Unit Test 2", occasion: "Children's Day", message: "Annual Day rehearsals begin next week." })} /></div>
        </div>
      </Modal>
    );
  }
}

function History() {
  const { s } = useStore();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [cls, setCls] = useState("All");
  const [type, setType] = useState("All");
  const [ch, setCh] = useState("All");
  const classes = Array.from(new Set(s.notifications.map(n => n.cls))).sort();
  const rows = s.notifications.filter(n => (status === "All" || n.status === status) && (cls === "All" || n.cls === cls) && (type === "All" || n.type === type) && (ch === "All" || n.channel === ch) && (!q || (n.parentName + n.studentName).toLowerCase().includes(q.toLowerCase())));
  const pg = usePaged(rows, 12);
  return (
    <Card pad={false}>
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
        <SearchBox value={q} onChange={setQ} placeholder="Search parent or student…" className="w-60" />
        <Select className="!w-36" value={status} onChange={e => setStatus(e.target.value)}><option value="All">All statuses</option>{["Delivered", "Read", "Pending", "Failed"].map(x => <option key={x}>{x}</option>)}</Select>
        <Select className="!w-36" value={cls} onChange={e => setCls(e.target.value)}><option value="All">All classes</option>{classes.map(x => <option key={x}>{x}</option>)}</Select>
        <Select className="!w-48" value={type} onChange={e => setType(e.target.value)}><option value="All">All message types</option>{TYPES.map(x => <option key={x}>{x}</option>)}</Select>
        <Select className="!w-36" value={ch} onChange={e => setCh(e.target.value)}><option value="All">All channels</option>{["WhatsApp", "SMS", "Email", "In-app"].map(x => <option key={x}>{x}</option>)}</Select>
        <span className="ml-auto text-xs text-slate-400">{rows.length} records</span>
      </div>
      <Table head={["Parent", "Student", "Class", "Message type", "Channel", "Date", "Delivery status"]}>
        {pg.slice.map(n => <Tr key={n.id}><Td><span className="flex items-center gap-2 font-medium text-slate-800"><Avatar name={n.parentName} size={24} />{n.parentName}</span></Td><Td>{n.studentName}</Td><Td className="text-xs">{n.cls}</Td><Td className="text-xs">{n.type}</Td><Td><span className="flex items-center gap-1.5 text-xs">{CH_ICON[n.channel]}{n.channel}</span></Td><Td className="whitespace-nowrap text-xs">{fmtDate(n.date)}</Td><Td><Badge tone={statusTone(n.status)}>{n.status}</Badge></Td></Tr>)}
      </Table>
      {rows.length === 0 && <Empty />}
      <Pager p={pg} />
    </Card>
  );
}
