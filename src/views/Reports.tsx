"use client";
import React, { useMemo, useState } from "react";
import { Users, CalendarCheck, GraduationCap, FileText, Wallet, AlertCircle, UserSquare2, UserPlus, Download, Printer, ChevronRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { Btn, Card, Field, Input, Modal, Select, Table, Td, Tr } from "@/components/ui";
import { CORE, SUBJECT_NAMES, schoolDays } from "@/lib/data";
import { TODAY, cx, downloadCSV, fmtDate, money } from "@/lib/utils";
import { examResult } from "@/lib/academic";

type Rep = { id: string; name: string; desc: string; icon: React.ReactNode };
const REPORTS: Rep[] = [
  { id: "strength", name: "Student strength report", desc: "Class and section-wise enrolment with gender split", icon: <Users size={18} /> },
  { id: "attendance", name: "Attendance report", desc: "Attendance percentage by class for the selected period", icon: <CalendarCheck size={18} /> },
  { id: "academic", name: "Academic performance report", desc: "Average marks and grade distribution by class", icon: <GraduationCap size={18} /> },
  { id: "exam", name: "Examination results report", desc: "Student-wise results for a completed examination", icon: <FileText size={18} /> },
  { id: "fee", name: "Fee collection report", desc: "Payments received in the selected date range", icon: <Wallet size={18} /> },
  { id: "dues", name: "Outstanding dues report", desc: "Students with pending fee balances", icon: <AlertCircle size={18} /> },
  { id: "workload", name: "Teacher workload report", desc: "Subjects, classes and weekly periods per teacher", icon: <UserSquare2 size={18} /> },
  { id: "admission", name: "Admission report", desc: "Applications received and their decisions", icon: <UserPlus size={18} /> },
];

export default function Reports() {
  const { s, fee, attPct, parentOf, toast } = useStore();
  const [active, setActive] = useState("strength");
  const [cls, setCls] = useState("All");
  const [from, setFrom] = useState("2026-04-01");
  const [to, setTo] = useState(TODAY);
  const [print, setPrint] = useState(false);
  const rep = REPORTS.find(r => r.id === active)!;
  const used = s.classes.filter(c => s.students.some(x => x.cls === c.name));

  const data = useMemo<{ head: string[]; rows: (string | number)[][] }>(() => {
    const st = s.students.filter(x => cls === "All" || x.cls === cls);
    switch (active) {
      case "strength": {
        const m = new Map<string, { b: number; g: number }>(); st.forEach(x => { const k = `${x.cls}-${x.section}`; const v = m.get(k) ?? { b: 0, g: 0 }; x.gender === "Male" ? v.b++ : v.g++; m.set(k, v); });
        return { head: ["Class-Section", "Boys", "Girls", "Total"], rows: [...m].map(([k, v]) => [k, v.b, v.g, v.b + v.g]) };
      }
      case "attendance": return { head: ["Student", "Class", "Attendance %", "Status"], rows: st.map(x => [x.name, `${x.cls}-${x.section}`, attPct(x.id) + "%", attPct(x.id) < s.school.minAttendance ? "Below minimum" : "OK"]).sort((a, b) => parseFloat(String(a[2])) - parseFloat(String(b[2]))) };
      case "academic": {
        const m = new Map<string, number[]>(); st.forEach(x => { const r = examResult(s, "E2", x.id); if (r) m.set(x.cls, [...(m.get(x.cls) ?? []), r.pct]); });
        return { head: ["Class", "Students", "Average %", "Highest %", "Lowest %"], rows: [...m].map(([k, v]) => [k, v.length, (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1), Math.max(...v), Math.min(...v)]) };
      }
      case "exam": return { head: ["Student", "Class", ...CORE.map(c => SUBJECT_NAMES[c]), "Total", "%", "Result"], rows: st.map(x => { const r = examResult(s, "E2", x.id); return r ? [x.name, `${x.cls}-${x.section}`, ...r.rows.map(y => y.obtained ?? "—"), `${r.total}/${r.max}`, r.pct, r.pass ? "Pass" : "Fail"] : null; }).filter((x): x is (string | number)[] => !!x) };
      case "fee": return { head: ["Receipt", "Student", "Class", "Date", "Mode", "Amount"], rows: s.payments.filter(p => p.date >= from && p.date <= to).map(p => { const x = s.students.find(y => y.id === p.studentId); return [p.receipt, x?.name ?? "—", x ? `${x.cls}-${x.section}` : "", fmtDate(p.date), p.mode, money(p.amount)]; }).filter(r => cls === "All" || String(r[2]).startsWith(cls)) };
      case "dues": return { head: ["Student", "Class", "Parent", "Contact", "Due date", "Balance"], rows: st.map(x => ({ x, f: fee(x.id) })).filter(r => r.f.balance > 0).sort((a, b) => b.f.balance - a.f.balance).map(({ x, f }) => [x.name, `${x.cls}-${x.section}`, parentOf(x.parentId)?.name ?? "", parentOf(x.parentId)?.phone ?? "", fmtDate(f.due), money(f.balance)]) };
      case "workload": return { head: ["Teacher", "Department", "Subjects", "Classes", "Est. periods/week"], rows: s.teachers.map(t => [t.name, t.department, t.subjects.map(c => SUBJECT_NAMES[c]).join(", "), t.classes.length, Math.min(34, t.classes.length * t.subjects.length * 3 + 4)]) };
      default: return { head: ["ID", "Applicant", "Applying for", "Applied on", "Status"], rows: s.admissions.filter(a => a.date >= from && a.date <= to).map(a => [a.id, a.applicant, a.applyingFor, fmtDate(a.date), a.status]) };
    }
  }, [active, cls, from, to, s, fee, attPct, parentOf]);

  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-semibold text-slate-900">Reports & Analytics</h1><p className="text-sm text-slate-500">Generate, preview, print and export operational reports</p></div>
      <div className="grid gap-5 lg:grid-cols-4">
        <Card pad={false} className="h-fit lg:col-span-1">
          <div className="divide-y divide-slate-100">
            {REPORTS.map(r => (
              <button key={r.id} onClick={() => setActive(r.id)} className={cx("flex w-full items-center gap-3 px-4 py-3 text-left transition first:rounded-t-xl last:rounded-b-xl", active === r.id ? "bg-brand-50" : "hover:bg-slate-50")}>
                <span className={cx("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", active === r.id ? "bg-brand-700 text-white" : "bg-slate-100 text-slate-500")}>{r.icon}</span>
                <span className="flex-1 text-sm font-medium text-slate-800">{r.name}</span><ChevronRight size={14} className="text-slate-300" />
              </button>
            ))}
          </div>
        </Card>
        <div className="space-y-4 lg:col-span-3">
          <Card>
            <div className="flex flex-wrap items-end gap-3">
              <div className="mr-auto"><h3 className="font-semibold text-slate-900">{rep.name}</h3><p className="text-xs text-slate-500">{rep.desc}</p></div>
              <Field label="From"><Input type="date" className="!w-40" value={from} onChange={e => setFrom(e.target.value)} /></Field>
              <Field label="To"><Input type="date" className="!w-40" value={to} max={TODAY} onChange={e => setTo(e.target.value)} /></Field>
              <Field label="Class"><Select className="!w-36" value={cls} onChange={e => setCls(e.target.value)}><option value="All">All classes</option>{used.map(c => <option key={c.id}>{c.name}</option>)}</Select></Field>
            </div>
            <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4"><Btn icon={<Download size={14} />} onClick={() => { downloadCSV(`${active}-report.csv`, [data.head, ...data.rows]); toast(`${active}-report.csv exported`); }}>Export CSV</Btn><Btn tone="secondary" icon={<Printer size={14} />} onClick={() => setPrint(true)}>Print preview</Btn></div>
          </Card>
          <Card pad={false}>
            <div className="flex justify-between p-4 pb-2 text-xs text-slate-500"><span>{data.rows.length} rows</span><span>{fmtDate(from)} – {fmtDate(to)}</span></div>
            <Table head={data.head}>{data.rows.slice(0, 25).map((r, i) => <Tr key={i}>{r.map((c, j) => <Td key={j} className={j === 0 ? "font-medium text-slate-800" : ""}>{c}</Td>)}</Tr>)}</Table>
            {data.rows.length > 25 && <p className="border-t border-slate-100 p-3 text-center text-xs text-slate-400">Showing first 25 rows — export CSV for the complete data</p>}
            {data.rows.length === 0 && <p className="p-8 text-center text-sm text-slate-400">No data for the selected filters</p>}
          </Card>
        </div>
      </div>
      <Modal open={print} onClose={() => setPrint(false)} wide="xl" title="Print preview" footer={<><Btn tone="secondary" onClick={() => setPrint(false)}>Close</Btn><Btn icon={<Printer size={14} />} onClick={() => window.print()}>Print</Btn></>}>
        <div className="print-area bg-white p-4">
          <div className="mb-4 border-b-2 border-brand-800 pb-3"><p className="text-lg font-bold uppercase text-brand-900">{s.school.name}</p><p className="text-sm font-semibold text-slate-700">{rep.name}</p><p className="text-xs text-slate-500">Period {fmtDate(from)} – {fmtDate(to)} · Class: {cls} · Generated {fmtDate(TODAY)}</p></div>
          <Table head={data.head}>{data.rows.slice(0, 40).map((r, i) => <Tr key={i}>{r.map((c, j) => <Td key={j}>{c}</Td>)}</Tr>)}</Table>
        </div>
      </Modal>
    </div>
  );
}
export { schoolDays };
