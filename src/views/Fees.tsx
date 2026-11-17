"use client";
import React, { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Receipt, Wallet, TrendingUp, AlertCircle, Clock, Download, Printer, Bell, School, Eye } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useStore } from "@/lib/store";
import { Avatar, Badge, Btn, Card, CardHeader, CHART, Check, Confirm, Empty, Field, Input, Modal, Pager, Progress, SearchBox, Select, Stat, Table, Tabs, Td, Tr, statusTone, usePaged } from "@/components/ui";
import { DASH, FeeStructure, Payment, feeTotal } from "@/lib/data";
import { TODAY, cx, daysBetween, downloadCSV, fmtDate, money } from "@/lib/utils";
import { go, href } from "@/lib/router";

const TABS = [
  { id: "overview", label: "Fee Overview" }, { id: "structures", label: "Fee Structures" }, { id: "records", label: "Student Fee Records" },
  { id: "payments", label: "Payment History" }, { id: "dues", label: "Outstanding Dues" }, { id: "reports", label: "Fee Reports" },
];
const tt = { contentStyle: { borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 } };

export default function Fees({ sub }: { sub: string }) {
  const tab = TABS.some(t => t.id === sub) ? sub : "overview";
  const [pay, setPay] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Payment | null>(null);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-xl font-semibold text-slate-900">Fees & Payments</h1><p className="text-sm text-slate-500">Fee structures, collections, dues and receipts for 2026-27</p></div>
        <div className="flex gap-2"><Btn tone="secondary" icon={<Bell size={15} />} onClick={() => go("reminders")}>Automated reminders</Btn><Btn icon={<Plus size={15} />} onClick={() => setPay("")}>Record payment</Btn></div>
      </div>
      <Tabs tabs={TABS} value={tab} onChange={t => go(t === "overview" ? "fees" : `fees/${t}`)} />
      {tab === "overview" && <Overview onPay={setPay} onReceipt={setReceipt} />}
      {tab === "structures" && <Structures />}
      {tab === "records" && <Records onPay={setPay} />}
      {tab === "payments" && <PaymentHistory onReceipt={setReceipt} />}
      {tab === "dues" && <Dues onPay={setPay} />}
      {tab === "reports" && <FeeReports />}
      {pay !== null && <RecordPaymentModal sid={pay} onClose={() => setPay(null)} onDone={p => { setPay(null); setReceipt(p); }} />}
      {receipt && <ReceiptModal p={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}

function Overview({ onPay, onReceipt }: { onPay: (id: string) => void; onReceipt: (p: Payment) => void }) {
  const { s, fee } = useStore();
  const d = DASH;
  const modes = useMemo(() => { const m: Record<string, number> = {}; s.payments.forEach(p => { m[p.mode] = (m[p.mode] ?? 0) + p.amount; }); return Object.entries(m).map(([name, value]) => ({ name, value })); }, [s.payments]);
  const colors = [CHART.navy, CHART.blue, CHART.light, CHART.violet, CHART.slate];
  const dues = s.students.map(x => ({ x, f: fee(x.id) })).filter(r => r.f.balance > 0).sort((a, b) => b.f.balance - a.f.balance).slice(0, 5);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat label="Total Expected Fees" value={money(d.expectedFees)} icon={<Wallet size={17} />} sub="Academic year 2026-27" />
        <Stat label="Total Collected" value={money(d.collectedFees)} icon={<TrendingUp size={17} />} tone="green" sub="82.9% of expected" />
        <Stat label="Outstanding Dues" value={money(d.outstanding)} icon={<AlertCircle size={17} />} tone="amber" sub="214 students" />
        <Stat label="Overdue Payments" value={money(d.overdue)} icon={<Clock size={17} />} tone="red" sub="Past due date" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2"><CardHeader title="Monthly collection" sub="Collected vs expected (₹)" />
          <div className="h-64"><ResponsiveContainer><BarChart data={d.feeMonthly}><CartesianGrid stroke={CHART.grid} vertical={false} /><XAxis dataKey="month" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} tickFormatter={v => `${v / 100000}L`} /><Tooltip {...tt} formatter={(v) => money(Number(v))} /><Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} /><Bar dataKey="expected" name="Expected" fill={CHART.light} radius={[4, 4, 0, 0]} /><Bar dataKey="collected" name="Collected" fill={CHART.navy} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
        <Card><CardHeader title="Payment modes" sub="Sample records" />
          <div className="h-44"><ResponsiveContainer><PieChart><Pie data={modes} dataKey="value" innerRadius={42} outerRadius={70} stroke="none">{modes.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}</Pie><Tooltip {...tt} formatter={(v) => money(Number(v))} /></PieChart></ResponsiveContainer></div>
          <div className="mt-2 space-y-1.5 text-xs">{modes.map((m, i) => <div key={m.name} className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: colors[i % colors.length] }} />{m.name}</span><span className="font-medium">{money(m.value)}</span></div>)}</div>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card pad={false}><div className="flex justify-between p-5 pb-2"><CardHeader title="Recent payments" /><a href={href("fees/payments")} className="text-xs font-medium text-brand-600">View all →</a></div>
          <Table head={["Student", "Date", "Mode", { label: "Amount", right: true }, ""]}>{s.payments.slice(0, 6).map(p => { const st = s.students.find(x => x.id === p.studentId); return <Tr key={p.id}><Td className="font-medium text-slate-800">{st?.name}</Td><Td className="text-xs">{fmtDate(p.date, false)}</Td><Td className="text-xs">{p.mode}</Td><Td right className="font-semibold">{money(p.amount)}</Td><Td><Btn size="sm" tone="ghost" icon={<Receipt size={13} />} onClick={() => onReceipt(p)} /></Td></Tr>; })}</Table></Card>
        <Card pad={false}><div className="flex justify-between p-5 pb-2"><CardHeader title="Highest outstanding balances" /><a href={href("fees/dues")} className="text-xs font-medium text-brand-600">All dues →</a></div>
          <Table head={["Student", "Class", { label: "Balance", right: true }, ""]}>{dues.map(({ x, f }) => <Tr key={x.id}><Td className="font-medium text-slate-800">{x.name}</Td><Td className="text-xs">{x.cls}-{x.section}</Td><Td right className="font-semibold text-red-600">{money(f.balance)}</Td><Td><Btn size="sm" tone="soft" onClick={() => onPay(x.id)}>Collect</Btn></Td></Tr>)}</Table></Card>
      </div>
    </div>
  );
}

function Structures() {
  const { s, up, toast, nextId } = useStore();
  const [edit, setEdit] = useState<FeeStructure | "new" | null>(null);
  const [del, setDel] = useState<FeeStructure | null>(null);
  const [inst, setInst] = useState<FeeStructure | null>(null);
  return (
    <div className="space-y-4">
      <div className="flex justify-between"><p className="text-sm text-slate-500">{s.structures.length} fee structures assigned across {s.classes.length} classes</p><Btn icon={<Plus size={15} />} onClick={() => setEdit("new")}>Create fee structure</Btn></div>
      <div className="grid gap-4 lg:grid-cols-2">
        {s.structures.map(f => (
          <Card key={f.id}>
            <div className="flex items-start justify-between"><div><h3 className="font-semibold text-slate-900">{f.name}</h3><p className="mt-0.5 text-xs text-slate-500">{f.classes.length ? `${f.classes[0]} – ${f.classes[f.classes.length - 1]}` : "No classes assigned"} · {f.installments} installments</p></div><p className="text-xl font-semibold text-brand-800">{money(feeTotal(f))}</p></div>
            <div className="mt-4 space-y-1.5">{f.components.map(c => <div key={c.name} className="flex justify-between text-sm"><span className="text-slate-600">{c.name}</span><span className="font-medium text-slate-800">{money(c.amount)}</span></div>)}</div>
            <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4"><Btn size="sm" tone="soft" onClick={() => setInst(f)}>Installment plan</Btn><Btn size="sm" tone="secondary" icon={<Pencil size={13} />} onClick={() => setEdit(f)}>Edit & assign</Btn><Btn size="sm" tone="ghost" icon={<Trash2 size={13} className="text-red-500" />} onClick={() => setDel(f)} /></div>
          </Card>
        ))}
      </div>
      {edit && <StructureForm f={edit === "new" ? null : edit} onClose={() => setEdit(null)} />}
      {inst && (
        <Modal open onClose={() => setInst(null)} title="Installment plan" sub={inst.name} footer={<Btn tone="secondary" onClick={() => setInst(null)}>Close</Btn>}>
          <Table head={["#", "Due date", { label: "Amount", right: true }]}>{Array.from({ length: inst.installments }, (_, i) => { const dates = inst.installments === 2 ? ["2026-04-10", "2026-10-10"] : inst.installments === 3 ? ["2026-04-10", "2026-08-10", "2026-12-10"] : ["2026-04-10", "2026-07-10", "2026-10-10", "2027-01-10"]; return <Tr key={i}><Td>Installment {i + 1}</Td><Td>{fmtDate(dates[i])}</Td><Td right className="font-semibold">{money(feeTotal(inst) / inst.installments)}</Td></Tr>; })}</Table>
        </Modal>
      )}
      <Confirm open={!!del} title="Delete fee structure?" message={<>Delete <b>{del?.name}</b>? Existing student fee records will not change.</>} onConfirm={() => { up(st => ({ structures: st.structures.filter(x => x.id !== del!.id) })); toast("Fee structure deleted", "warn"); }} onClose={() => setDel(null)} />
    </div>
  );
  function StructureForm({ f: init, onClose }: { f: FeeStructure | null; onClose: () => void }) {
    const [f, setF] = useState<FeeStructure>(init ?? { id: "", name: "", classes: [], installments: 4, components: [{ name: "Tuition", amount: 0 }] });
    const total = feeTotal(f);
    const save = () => {
      if (!f.name.trim() || !f.classes.length || total <= 0) return toast("Name, classes and at least one fee component are required", "err");
      up(st => ({ structures: init ? st.structures.map(x => x.id === init.id ? f : x) : [...st.structures, { ...f, id: nextId("F") }] }));
      toast(init ? "Fee structure updated" : `Fee structure created and assigned to ${f.classes.length} classes`); onClose();
    };
    return (
      <Modal open onClose={onClose} wide title={init ? "Edit fee structure" : "Create fee structure"} footer={<><span className="mr-auto text-sm text-slate-500">Total: <b className="text-slate-900">{money(total)}</b></span><Btn tone="secondary" onClick={onClose}>Cancel</Btn><Btn onClick={save}>Save structure</Btn></>}>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Structure name"><Input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field><Field label="Installments"><Select value={f.installments} onChange={e => setF({ ...f, installments: +e.target.value })}>{[1, 2, 3, 4, 6, 12].map(n => <option key={n} value={n}>{n === 1 ? "Annual (1)" : `${n} installments`}</option>)}</Select></Field></div>
        <p className="mb-2 mt-4 text-xs font-medium text-slate-600">Fee components</p>
        <div className="space-y-2">{f.components.map((c, i) => <div key={i} className="flex gap-2"><Input value={c.name} placeholder="Component" onChange={e => setF({ ...f, components: f.components.map((x, j) => j === i ? { ...x, name: e.target.value } : x) })} /><Input type="number" className="!w-36" value={c.amount} onChange={e => setF({ ...f, components: f.components.map((x, j) => j === i ? { ...x, amount: +e.target.value } : x) })} /><Btn tone="ghost" icon={<Trash2 size={14} className="text-red-500" />} onClick={() => setF({ ...f, components: f.components.filter((_, j) => j !== i) })} /></div>)}</div>
        <Btn tone="soft" size="sm" className="mt-2" icon={<Plus size={13} />} onClick={() => setF({ ...f, components: [...f.components, { name: "", amount: 0 }] })}>Add component</Btn>
        <p className="mb-2 mt-4 text-xs font-medium text-slate-600">Assign to classes</p>
        <div className="flex flex-wrap gap-1.5">{s.classes.map(c => <button key={c.id} onClick={() => setF({ ...f, classes: f.classes.includes(c.name) ? f.classes.filter(x => x !== c.name) : [...f.classes, c.name] })} className={cx("rounded-full border px-2.5 py-1 text-xs", f.classes.includes(c.name) ? "border-brand-600 bg-brand-700 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>{c.name.replace("Grade ", "G")}</button>)}</div>
      </Modal>
    );
  }
}

function Records({ onPay }: { onPay: (id: string) => void }) {
  const { s, fee } = useStore();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [cls, setCls] = useState("All");
  const [only, setOnly] = useState(false);
  const rows = s.students.map(x => ({ x, f: fee(x.id) })).filter(({ x, f }) => (!q || x.name.toLowerCase().includes(q.toLowerCase()) || x.admNo.toLowerCase().includes(q.toLowerCase())) && (status === "All" || f.status === status) && (cls === "All" || x.cls === cls) && (!only || f.balance > 0));
  const pg = usePaged(rows, 10);
  const used = s.classes.filter(c => s.students.some(x => x.cls === c.name));
  return (
    <Card pad={false}>
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
        <SearchBox value={q} onChange={setQ} placeholder="Search student or admission no…" className="w-64" />
        <Select className="!w-36" value={cls} onChange={e => setCls(e.target.value)}><option value="All">All classes</option>{used.map(c => <option key={c.id}>{c.name}</option>)}</Select>
        <Select className="!w-36" value={status} onChange={e => setStatus(e.target.value)}><option value="All">All status</option>{["Paid", "Partial", "Unpaid", "Overdue"].map(x => <option key={x}>{x}</option>)}</Select>
        <Check checked={only} onChange={setOnly} label="Outstanding dues only" />
      </div>
      <Table head={["Student", "Class", { label: "Total", right: true }, { label: "Paid", right: true }, { label: "Balance", right: true }, "Progress", "Due date", "Status", ""]}>
        {pg.slice.map(({ x, f }) => (
          <Tr key={x.id}>
            <Td><a href={href(`students/${x.id}/fees`)} className="flex items-center gap-2 font-medium text-slate-900 hover:text-brand-700"><Avatar name={x.name} size={26} />{x.name}</a></Td>
            <Td className="text-xs">{x.cls}-{x.section}</Td><Td right>{money(f.net)}</Td><Td right className="text-emerald-700">{money(f.paid)}</Td><Td right className={cx("font-semibold", f.balance > 0 && "text-red-600")}>{money(f.balance)}</Td>
            <Td className="w-28"><Progress value={f.net ? (f.paid / f.net) * 100 : 100} tone={f.balance === 0 ? "green" : "blue"} /></Td>
            <Td className="text-xs">{fmtDate(f.due, false)}</Td><Td><Badge tone={statusTone(f.status)}>{f.status}</Badge></Td>
            <Td><Btn size="sm" tone={f.balance ? "soft" : "ghost"} disabled={!f.balance} onClick={() => onPay(x.id)}>Record payment</Btn></Td>
          </Tr>
        ))}
      </Table>
      {rows.length === 0 && <Empty />}
      <Pager p={pg} />
    </Card>
  );
}

function PaymentHistory({ onReceipt }: { onReceipt: (p: Payment) => void }) {
  const { s, toast } = useStore();
  const [q, setQ] = useState("");
  const [mode, setMode] = useState("All");
  const rows = s.payments.filter(p => { const st = s.students.find(x => x.id === p.studentId); return (mode === "All" || p.mode === mode) && (!q || (st?.name + p.receipt).toLowerCase().includes(q.toLowerCase())); });
  const pg = usePaged(rows, 10);
  return (
    <Card pad={false}>
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
        <SearchBox value={q} onChange={setQ} placeholder="Search student or receipt no…" className="w-64" />
        <Select className="!w-40" value={mode} onChange={e => setMode(e.target.value)}><option value="All">All modes</option>{["UPI", "Net Banking", "Cash", "Card", "Cheque"].map(m => <option key={m}>{m}</option>)}</Select>
        <Btn tone="secondary" className="ml-auto" icon={<Download size={14} />} onClick={() => { downloadCSV("payments.csv", [["Receipt", "Student", "Date", "Mode", "Amount"], ...rows.map(p => [p.receipt, s.students.find(x => x.id === p.studentId)?.name ?? "", p.date, p.mode, p.amount])]); toast("payments.csv exported"); }}>Export CSV</Btn>
      </div>
      <Table head={["Receipt", "Student", "Class", "Date", "Mode", "Note", { label: "Amount", right: true }, ""]}>
        {pg.slice.map(p => { const st = s.students.find(x => x.id === p.studentId); return <Tr key={p.id}><Td className="font-mono text-xs">{p.receipt}</Td><Td className="font-medium text-slate-800">{st?.name ?? "—"}</Td><Td className="text-xs">{st ? `${st.cls}-${st.section}` : ""}</Td><Td className="text-xs">{fmtDate(p.date)}</Td><Td><Badge tone="slate">{p.mode}</Badge></Td><Td className="text-xs text-slate-500">{p.note}</Td><Td right className="font-semibold">{money(p.amount)}</Td><Td><Btn size="sm" tone="ghost" icon={<Receipt size={14} />} onClick={() => onReceipt(p)}>Receipt</Btn></Td></Tr>; })}
      </Table>
      {rows.length === 0 && <Empty />}
      <Pager p={pg} />
    </Card>
  );
}

function Dues({ onPay }: { onPay: (id: string) => void }) {
  const { s, fee, parentOf, addNotifications, up, toast } = useStore();
  const [f, setF] = useState("All");
  const rows = s.students.map(x => ({ x, f: fee(x.id) })).filter(r => r.f.balance > 0 && (f === "All" || r.f.status === f)).sort((a, b) => b.f.balance - a.f.balance);
  const pg = usePaged(rows, 10);
  const remind = (id: string) => {
    const x = s.students.find(y => y.id === id)!, p = parentOf(x.parentId)!;
    addNotifications([{ parentName: p.name, studentName: x.name, cls: `${x.cls}-${x.section}`, type: "Fee Reminder", channel: "WhatsApp", date: TODAY, status: "Delivered" }]);
    up(st => ({ reminderLog: { ...st.reminderLog, [id]: { last: TODAY, status: "Delivered" } } }));
    toast(`Reminder sent to ${p.name} via WhatsApp (simulated)`);
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4"><Stat label="Students with dues" value={String(rows.length)} icon={<AlertCircle size={17} />} tone="amber" /><Stat label="Total outstanding (sample)" value={money(rows.reduce((a, r) => a + r.f.balance, 0))} icon={<Wallet size={17} />} tone="red" /><Stat label="Overdue accounts" value={String(rows.filter(r => r.f.status === "Overdue").length)} icon={<Clock size={17} />} tone="red" /></div>
      <Card pad={false}>
        <div className="flex items-center gap-3 border-b border-slate-100 p-4"><span className="text-sm text-slate-600">Show</span>{["All", "Overdue", "Partial", "Unpaid"].map(x => <button key={x} onClick={() => setF(x)} className={cx("rounded-full px-3 py-1 text-xs font-medium", f === x ? "bg-brand-700 text-white" : "bg-slate-100 text-slate-600")}>{x}</button>)}</div>
        <Table head={["Student", "Class", "Parent", { label: "Balance", right: true }, "Due date", "Overdue by", "Status", ""]}>
          {pg.slice.map(({ x, f }) => <Tr key={x.id}><Td className="font-medium text-slate-900">{x.name}</Td><Td className="text-xs">{x.cls}-{x.section}</Td><Td className="text-xs">{parentOf(x.parentId)?.name}</Td><Td right className="font-semibold text-red-600">{money(f.balance)}</Td><Td className="text-xs">{fmtDate(f.due, false)}</Td><Td className="text-xs">{f.due < TODAY ? `${daysBetween(f.due, TODAY)} days` : "—"}</Td><Td><Badge tone={statusTone(f.status)}>{f.status}</Badge></Td><Td><div className="flex gap-1"><Btn size="sm" tone="soft" icon={<Bell size={13} />} onClick={() => remind(x.id)}>Remind</Btn><Btn size="sm" tone="secondary" onClick={() => onPay(x.id)}>Collect</Btn></div></Td></Tr>)}
        </Table>
        {rows.length === 0 && <Empty text="No outstanding dues 🎉" />}
        <Pager p={pg} />
      </Card>
    </div>
  );
}

function FeeReports() {
  const { s, fee, toast } = useStore();
  const byClass = useMemo(() => { const m: Record<string, { paid: number; due: number }> = {}; s.students.forEach(x => { const f = fee(x.id); const k = `${x.cls}`.replace("Grade ", "G"); m[k] ??= { paid: 0, due: 0 }; m[k].paid += f.paid; m[k].due += f.balance; }); return Object.entries(m).map(([cls, v]) => ({ cls, Collected: v.paid, Outstanding: v.due })); }, [s.students, fee]);
  const total = byClass.reduce((a, b) => a + b.Collected + b.Outstanding, 0);
  return (
    <div className="space-y-4">
      <Card><CardHeader title="Collection by class" sub="Collected vs outstanding (sample students)" action={<Btn size="sm" tone="secondary" icon={<Download size={13} />} onClick={() => { downloadCSV("fee-report.csv", [["Class", "Collected", "Outstanding"], ...byClass.map(b => [b.cls, b.Collected, b.Outstanding])]); toast("fee-report.csv exported"); }}>Export CSV</Btn>} />
        <div className="h-72"><ResponsiveContainer><BarChart data={byClass}><CartesianGrid stroke={CHART.grid} vertical={false} /><XAxis dataKey="cls" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} tickFormatter={v => `${v / 100000}L`} /><Tooltip {...tt} formatter={(v) => money(Number(v))} /><Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} /><Bar dataKey="Collected" stackId="a" fill={CHART.navy} /><Bar dataKey="Outstanding" stackId="a" fill={CHART.amber} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
        <p className="mt-2 text-xs text-slate-400">Collection efficiency: {total ? Math.round((byClass.reduce((a, b) => a + b.Collected, 0) / total) * 100) : 0}%</p>
      </Card>
      <Table head={["Class", { label: "Collected", right: true }, { label: "Outstanding", right: true }, { label: "Efficiency", right: true }]}>
        {byClass.map(b => <Tr key={b.cls}><Td className="font-medium">Grade {b.cls.replace("G", "")}</Td><Td right>{money(b.Collected)}</Td><Td right className="text-red-600">{money(b.Outstanding)}</Td><Td right>{Math.round((b.Collected / (b.Collected + b.Outstanding || 1)) * 100)}%</Td></Tr>)}
      </Table>
    </div>
  );
}

// ---------- shared modals ----------
export function RecordPaymentModal({ sid, onClose, onDone }: { sid: string; onClose: () => void; onDone: (p: Payment) => void }) {
  const { s, up, fee, toast, nextId } = useStore();
  const [id, setId] = useState(sid);
  const [mode, setMode] = useState("UPI");
  const [note, setNote] = useState("");
  const f = id ? fee(id) : null;
  const [amount, setAmount] = useState<string>(f ? String(f.balance) : "");
  const debtors = s.students.filter(x => fee(x.id).balance > 0);
  const amt = +amount || 0;
  const pick = (v: string) => { setId(v); setAmount(v ? String(fee(v).balance) : ""); };
  const save = () => {
    if (!id || !f) return toast("Select a student", "err");
    if (amt <= 0) return toast("Enter a valid amount", "err");
    if (amt > f.balance) return toast(`Amount exceeds balance of ${money(f.balance)}`, "err");
    const n = s.payments.length + 1;
    const p: Payment = { id: nextId("PAY"), receipt: `RCT-2026-${1500 + n}`, studentId: id, amount: amt, date: TODAY, mode, note: note || (amt < f.balance ? "Partial payment" : "Final payment") };
    up(st => ({ payments: [p, ...st.payments] }));
    toast(amt < f.balance ? `Partial payment of ${money(amt)} recorded` : `Payment of ${money(amt)} recorded — account settled`);
    onDone(p);
  };
  return (
    <Modal open onClose={onClose} title="Record payment" sub="Simulated — no payment gateway is connected" footer={<><Btn tone="secondary" onClick={onClose}>Cancel</Btn><Btn tone="success" onClick={save}>Record & generate receipt</Btn></>}>
      <div className="space-y-4">
        <Field label="Student"><Select value={id} onChange={e => pick(e.target.value)}><option value="">Select student…</option>{debtors.map(x => <option key={x.id} value={x.id}>{x.name} — {x.cls}-{x.section} (due {money(fee(x.id).balance)})</option>)}</Select></Field>
        {f && <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-3 text-center text-xs"><div><p className="font-semibold text-slate-900">{money(f.net)}</p><p className="text-slate-500">Total</p></div><div><p className="font-semibold text-emerald-700">{money(f.paid)}</p><p className="text-slate-500">Paid</p></div><div><p className="font-semibold text-red-600">{money(f.balance)}</p><p className="text-slate-500">Balance</p></div></div>}
        <div className="grid grid-cols-2 gap-4"><Field label="Amount (₹)" hint="Enter less than the balance for a partial payment"><Input type="number" value={amount} onChange={e => setAmount(e.target.value)} /></Field><Field label="Payment mode"><Select value={mode} onChange={e => setMode(e.target.value)}>{["UPI", "Cash", "Card", "Net Banking", "Cheque"].map(m => <option key={m}>{m}</option>)}</Select></Field></div>
        {f && amt > 0 && amt < f.balance && <p className="rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800">Partial payment — remaining balance will be {money(f.balance - amt)}.</p>}
        <Field label="Note (optional)"><Input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Installment 2" /></Field>
      </div>
    </Modal>
  );
}

export function ReceiptModal({ p, onClose }: { p: Payment; onClose: () => void }) {
  const { s, toast, fee, parentOf } = useStore();
  const st = s.students.find(x => x.id === p.studentId);
  const f = st ? fee(st.id) : null;
  return (
    <Modal open onClose={onClose} title="Fee receipt" footer={<><Btn tone="secondary" onClick={onClose}>Close</Btn><Btn icon={<Printer size={14} />} onClick={() => { toast("Opening print dialog…"); setTimeout(() => window.print(), 200); }}>Print / Save PDF</Btn></>}>
      <div className="print-area rounded-lg border border-slate-200 p-5">
        <div className="flex items-center gap-3 border-b-2 border-brand-800 pb-3"><span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-800 text-white"><School size={22} /></span><div><p className="font-bold uppercase text-brand-900">{s.school.name}</p><p className="text-[11px] text-slate-500">{s.school.address}</p></div></div>
        <div className="my-3 flex justify-between text-sm"><span className="font-semibold">FEE RECEIPT</span><span className="font-mono text-xs">{p.receipt}</span></div>
        <dl className="space-y-1.5 text-sm">{[["Received from", parentOf(st?.parentId ?? "")?.name ?? "—"], ["Student", `${st?.name ?? "—"} (${st?.admNo})`], ["Class", st ? `${st.cls}-${st.section}` : "—"], ["Date", fmtDate(p.date)], ["Payment mode", p.mode], ["Remarks", p.note]].map(([k, v]) => <div key={k} className="flex justify-between"><dt className="text-slate-500">{k}</dt><dd className="font-medium text-slate-900">{v}</dd></div>)}</dl>
        <div className="mt-4 flex items-center justify-between rounded-lg bg-brand-50 px-4 py-3"><span className="text-sm font-medium text-brand-800">Amount received</span><span className="text-xl font-bold text-brand-900">{money(p.amount)}</span></div>
        {f && <p className="mt-2 text-right text-xs text-slate-500">Balance outstanding: {money(f.balance)}</p>}
        <p className="mt-6 text-center text-[10px] text-slate-400">Computer-generated receipt — no signature required</p>
      </div>
    </Modal>
  );
}
export { Eye };
