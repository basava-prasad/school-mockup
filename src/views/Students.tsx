"use client";
import React, { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, ArrowLeft, Phone, Mail, MapPin, Download } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useStore } from "@/lib/store";
import { Avatar, Badge, Btn, Card, CardHeader, CHART, Confirm, Empty, Field, Input, Modal, Pager, Progress, SearchBox, Select, Table, Tabs, Td, Tr, statusTone, usePaged } from "@/components/ui";
import { Student, SUBJECT_NAMES, CORE, schoolDays } from "@/lib/data";
import { TODAY, cx, downloadCSV, fmtDate, gradeTone, money } from "@/lib/utils";
import { examResult } from "@/lib/academic";
import { go, href } from "@/lib/router";
import { ReportCardPanel } from "./ExamPanels";

export function StudentsPage({ id, tab }: { id: string; tab: string }) {
  return id ? <StudentProfile id={id} tab={tab} /> : <StudentDirectory />;
}

function StudentDirectory() {
  const { s, up, toast, parentOf, nextId } = useStore();
  const [q, setQ] = useState("");
  const [cls, setCls] = useState("All");
  const [sec, setSec] = useState("All");
  const [gender, setGender] = useState("All");
  const [status, setStatus] = useState("All");
  const [edit, setEdit] = useState<Student | "new" | null>(null);
  const [del, setDel] = useState<Student | null>(null);
  const rows = useMemo(() => s.students.filter(x =>
    (cls === "All" || x.cls === cls) && (sec === "All" || x.section === sec) && (gender === "All" || x.gender === gender) && (status === "All" || x.status === status) &&
    (!q || (x.name + x.admNo + (parentOf(x.parentId)?.name ?? "")).toLowerCase().includes(q.toLowerCase()))), [s.students, q, cls, sec, gender, status, parentOf]);
  const pg = usePaged(rows, 10);
  const classesUsed = s.classes.filter(c => s.students.some(x => x.cls === c.name));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-xl font-semibold text-slate-900">Student Directory</h1><p className="text-sm text-slate-500">{s.students.length} sample records shown from the 1,248 enrolled students</p></div>
        <div className="flex gap-2"><Btn tone="secondary" icon={<Download size={15} />} onClick={() => { downloadCSV("students.csv", [["Name", "Admission No", "Class", "Section", "Gender", "Parent", "Contact", "Admission Date", "Status"], ...rows.map(x => [x.name, x.admNo, x.cls, x.section, x.gender, parentOf(x.parentId)?.name ?? "", parentOf(x.parentId)?.phone ?? "", x.admissionDate, x.status])]); toast("students.csv exported"); }}>Export</Btn><Btn icon={<Plus size={15} />} onClick={() => setEdit("new")}>Add student</Btn></div>
      </div>
      <Card pad={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <SearchBox value={q} onChange={v => { setQ(v); pg.setPage(1); }} placeholder="Search by name, admission no. or parent…" className="w-72" />
          <Select className="!w-36" value={cls} onChange={e => { setCls(e.target.value); pg.setPage(1); }}><option value="All">All classes</option>{classesUsed.map(c => <option key={c.id}>{c.name}</option>)}</Select>
          <Select className="!w-32" value={sec} onChange={e => { setSec(e.target.value); pg.setPage(1); }}><option value="All">All sections</option><option>A</option><option>B</option></Select>
          <Select className="!w-32" value={gender} onChange={e => { setGender(e.target.value); pg.setPage(1); }}><option value="All">Any gender</option><option>Male</option><option>Female</option></Select>
          <Select className="!w-36" value={status} onChange={e => { setStatus(e.target.value); pg.setPage(1); }}><option value="All">Any status</option><option>Active</option><option>Inactive</option><option>Transferred</option></Select>
          {(q || cls !== "All" || sec !== "All" || gender !== "All" || status !== "All") && <button className="text-xs text-brand-600 hover:underline" onClick={() => { setQ(""); setCls("All"); setSec("All"); setGender("All"); setStatus("All"); }}>Clear filters</button>}
        </div>
        <Table head={["Student", "Adm. No", "Class", "Gender", "Parent", "Contact", "Admitted", "Status", { label: "", right: true }]}>
          {pg.slice.map(x => {
            const p = parentOf(x.parentId);
            return (
              <Tr key={x.id} onClick={() => go(`students/${x.id}`)}>
                <Td><span className="flex items-center gap-2.5"><Avatar name={x.name} /><span className="font-medium text-slate-900">{x.name}</span></span></Td>
                <Td className="text-xs text-slate-500">{x.admNo}</Td>
                <Td>{x.cls}-{x.section}</Td>
                <Td>{x.gender}</Td>
                <Td>{p?.name}</Td>
                <Td className="whitespace-nowrap text-xs">{p?.phone}</Td>
                <Td className="whitespace-nowrap text-xs">{fmtDate(x.admissionDate)}</Td>
                <Td><Badge tone={statusTone(x.status)}>{x.status}</Badge></Td>
                <Td right><div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}><Btn tone="ghost" size="sm" icon={<Pencil size={14} />} onClick={() => setEdit(x)} /><Btn tone="ghost" size="sm" icon={<Trash2 size={14} className="text-red-500" />} onClick={() => setDel(x)} /></div></Td>
              </Tr>
            );
          })}
        </Table>
        {rows.length === 0 && <Empty text="No students match your filters" />}
        <Pager p={pg} />
      </Card>
      {edit && <StudentForm stu={edit === "new" ? null : edit} onClose={() => setEdit(null)} />}
      <Confirm open={!!del} title="Delete student record?" message={<>This will permanently remove <b>{del?.name}</b> ({del?.admNo}) from the directory. This action cannot be undone.</>} onConfirm={() => { up(st => ({ students: st.students.filter(x => x.id !== del!.id) })); toast(`${del!.name} removed`, "warn"); }} onClose={() => setDel(null)} />
    </div>
  );

  function StudentForm({ stu, onClose }: { stu: Student | null; onClose: () => void }) {
    const p0 = stu ? parentOf(stu.parentId) : undefined;
    const [f, setF] = useState({ name: stu?.name ?? "", gender: stu?.gender ?? "Male", cls: stu?.cls ?? "Grade 10", section: stu?.section ?? "A", dob: stu?.dob ?? "2011-01-01", admissionDate: stu?.admissionDate ?? TODAY, status: stu?.status ?? "Active", parent: p0?.name ?? "", phone: p0?.phone ?? "+91 ", email: p0?.email ?? "", address: stu?.address ?? "" });
    const secs = s.classes.find(c => c.name === f.cls)?.sections ?? ["A"];
    const save = () => {
      if (!f.name.trim() || !f.parent.trim()) return toast("Student name and parent name are required", "err");
      if (stu) {
        up(st => ({
          students: st.students.map(x => x.id === stu.id ? { ...x, name: f.name, gender: f.gender as Student["gender"], cls: f.cls, section: f.section, dob: f.dob, admissionDate: f.admissionDate, status: f.status as Student["status"], address: f.address } : x),
          parents: st.parents.map(p => p.id === stu.parentId ? { ...p, name: f.parent, phone: f.phone, email: f.email } : p),
        }));
        toast("Student updated");
      } else {
        const pid = nextId("P"), sid = nextId("S");
        const cnt = s.students.filter(x => x.cls === f.cls && x.section === f.section).length + 1;
        up(st => ({
          parents: [...st.parents, { id: pid, name: f.parent, relation: "Guardian", phone: f.phone, email: f.email, occupation: "—" }],
          students: [{ id: sid, admNo: `ADM2026${String(900 + st.students.length)}`, name: f.name, gender: f.gender as Student["gender"], cls: f.cls, section: f.section, rollNo: cnt, dob: f.dob, parentId: pid, admissionDate: f.admissionDate, status: f.status as Student["status"], blood: "O+", address: f.address || "—" }, ...st.students],
          feeRecords: [...st.feeRecords, { studentId: sid, total: st.structures.find(x => x.classes.includes(f.cls))?.components.reduce((a, c) => a + c.amount, 0) ?? 80000, discount: 0, dueDate: "2026-12-10", structureId: st.structures.find(x => x.classes.includes(f.cls))?.id ?? "F4" }],
        }));
        toast(`${f.name} added to ${f.cls}-${f.section}`);
      }
      onClose();
    };
    return (
      <Modal open onClose={onClose} wide title={stu ? "Edit student" : "Add student"} sub={stu ? stu.admNo : "A fee record is created automatically from the class fee structure"} footer={<><Btn tone="secondary" onClick={onClose}>Cancel</Btn><Btn onClick={save}>{stu ? "Save changes" : "Add student"}</Btn></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" className="sm:col-span-2"><Input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Gender"><Select value={f.gender} onChange={e => setF({ ...f, gender: e.target.value as "Male" })}><option>Male</option><option>Female</option></Select></Field>
          <Field label="Date of birth"><Input type="date" value={f.dob} onChange={e => setF({ ...f, dob: e.target.value })} /></Field>
          <Field label="Class"><Select value={f.cls} onChange={e => setF({ ...f, cls: e.target.value, section: s.classes.find(c => c.name === e.target.value)?.sections[0] ?? "A" })}>{s.classes.map(c => <option key={c.id}>{c.name}</option>)}</Select></Field>
          <Field label="Section"><Select value={f.section} onChange={e => setF({ ...f, section: e.target.value })}>{secs.map(x => <option key={x}>{x}</option>)}</Select></Field>
          <Field label="Admission date"><Input type="date" value={f.admissionDate} onChange={e => setF({ ...f, admissionDate: e.target.value })} /></Field>
          <Field label="Status"><Select value={f.status} onChange={e => setF({ ...f, status: e.target.value as "Active" })}><option>Active</option><option>Inactive</option><option>Transferred</option></Select></Field>
          <Field label="Parent / guardian name"><Input value={f.parent} onChange={e => setF({ ...f, parent: e.target.value })} /></Field>
          <Field label="Contact number"><Input value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} /></Field>
          <Field label="Parent email" className="sm:col-span-2"><Input type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="Address" className="sm:col-span-2"><Input value={f.address} onChange={e => setF({ ...f, address: e.target.value })} /></Field>
        </div>
      </Modal>
    );
  }
}

const PTABS = [
  { id: "personal", label: "Personal Information" }, { id: "academic", label: "Academic Records" }, { id: "attendance", label: "Attendance" },
  { id: "results", label: "Examination Results" }, { id: "fees", label: "Fee Details" }, { id: "parent", label: "Parent Information" },
];

export function StudentProfile({ id, tab: t }: { id: string; tab: string }) {
  const { s, parentOf, attPct, fee, teacher, toast } = useStore();
  const tab = PTABS.some(x => x.id === t) ? t : "personal";
  const st = s.students.find(x => x.id === id);
  if (!st) return <Card><Empty text="Student not found" /><div className="text-center"><Btn onClick={() => go("students")}>Back to directory</Btn></div></Card>;
  const p = parentOf(st.parentId);
  const f = fee(st.id);
  const cl = s.classes.find(c => c.name === st.cls);
  const siblings = s.students.filter(x => x.parentId === st.parentId && x.id !== st.id);
  return (
    <div className="space-y-4">
      <a href={href("students")} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"><ArrowLeft size={15} /> Back to directory</a>
      <Card>
        <div className="flex flex-wrap items-center gap-5">
          <Avatar name={st.name} size={72} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-semibold text-slate-900">{st.name}</h1><Badge tone={statusTone(st.status)}>{st.status}</Badge></div>
            <p className="mt-1 text-sm text-slate-500">{st.admNo} · {st.cls}-{st.section} · Roll {st.rollNo} · {st.gender}</p>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500"><span className="flex items-center gap-1"><Phone size={12} /> {p?.phone}</span><span className="flex items-center gap-1"><Mail size={12} /> {p?.email}</span><span className="flex items-center gap-1"><MapPin size={12} /> {st.address}</span></div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[["Attendance", `${attPct(st.id)}%`], ["Midterm", `${examResult(s, "E2", st.id)?.pct ?? "—"}${examResult(s, "E2", st.id) ? "%" : ""}`], ["Fee due", money(f.balance)]].map(([k, v]) => <div key={k} className="rounded-lg bg-slate-50 px-4 py-2.5"><p className="text-base font-semibold text-slate-900">{v}</p><p className="text-[11px] text-slate-500">{k}</p></div>)}
          </div>
        </div>
      </Card>
      <Tabs tabs={PTABS} value={tab} onChange={x => go(`students/${id}/${x}`)} />
      {tab === "personal" && (
        <Card><CardHeader title="Personal information" />
          <dl className="grid gap-x-10 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {[["Full name", st.name], ["Admission number", st.admNo], ["Date of birth", fmtDate(st.dob)], ["Gender", st.gender], ["Blood group", st.blood], ["Class & section", `${st.cls} – ${st.section}`], ["Roll number", String(st.rollNo)], ["Admission date", fmtDate(st.admissionDate)], ["Class teacher", teacher(cl?.classTeachers[st.section] ?? "")?.name ?? "—"], ["Address", st.address]].map(([k, v]) => <div key={k}><dt className="text-xs text-slate-400">{k}</dt><dd className="mt-0.5 font-medium text-slate-800">{v}</dd></div>)}
          </dl>
        </Card>
      )}
      {tab === "academic" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card pad={false}><div className="p-5 pb-2"><CardHeader title="Subject-wise performance" sub="Unit Test 1 vs Midterm (%)" /></div>
            <Table head={["Subject", "Unit Test 1", "Midterm", "Trend"]}>
              {CORE.map(c => { const a = examResult(s, "E1", st.id)?.rows.find(r => r.code === c)?.pct, b = examResult(s, "E2", st.id)?.rows.find(r => r.code === c)?.pct; const d = a != null && b != null ? b - a : 0; return <Tr key={c}><Td className="font-medium">{SUBJECT_NAMES[c]}</Td><Td>{a ?? "—"}</Td><Td>{b ?? "—"}</Td><Td><span className={d < -10 ? "font-medium text-red-600" : d < 0 ? "text-amber-600" : "text-emerald-600"}>{d > 0 ? "▲" : d < 0 ? "▼" : "•"} {Math.abs(Math.round(d))}</span></Td></Tr>; })}
            </Table>
          </Card>
          <Card><CardHeader title="Performance chart" /><div className="h-64"><ResponsiveContainer><BarChart data={CORE.map(c => ({ s: c, "Unit Test 1": examResult(s, "E1", st.id)?.rows.find(r => r.code === c)?.pct ?? 0, Midterm: examResult(s, "E2", st.id)?.rows.find(r => r.code === c)?.pct ?? 0 }))}><CartesianGrid stroke={CHART.grid} vertical={false} /><XAxis dataKey="s" tickLine={false} axisLine={false} /><YAxis domain={[0, 100]} tickLine={false} axisLine={false} /><Tooltip /><Bar dataKey="Unit Test 1" fill={CHART.light} radius={[3, 3, 0, 0]} /><Bar dataKey="Midterm" fill={CHART.navy} radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
        </div>
      )}
      {tab === "attendance" && <StudentAttendance sid={st.id} />}
      {tab === "results" && <ReportCardPanel lockStudent={st.id} />}
      {tab === "fees" && <StudentFees sid={st.id} />}
      {tab === "parent" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card><CardHeader title="Parent / guardian" />
            <div className="flex items-center gap-4"><Avatar name={p?.name ?? "P"} size={52} /><div><p className="font-semibold text-slate-900">{p?.name}</p><p className="text-sm text-slate-500">{p?.relation} · {p?.occupation}</p></div></div>
            <dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><dt className="text-slate-500">Mobile</dt><dd className="font-medium">{p?.phone}</dd></div><div className="flex justify-between"><dt className="text-slate-500">Email</dt><dd className="font-medium">{p?.email}</dd></div><div className="flex justify-between"><dt className="text-slate-500">WhatsApp</dt><dd><Badge tone="green">Opted in</Badge></dd></div></dl>
            <div className="mt-5 flex gap-2"><Btn size="sm" onClick={() => go("communication")}>Send message</Btn><Btn size="sm" tone="secondary" onClick={() => toast(`Calling ${p?.phone} (simulated)`)}>Call parent</Btn></div>
          </Card>
          <Card><CardHeader title="Siblings in this school" />
            {siblings.length === 0 ? <p className="text-sm text-slate-400">No other children registered under this parent.</p> : siblings.map(x => <a key={x.id} href={href(`students/${x.id}`)} className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-50"><Avatar name={x.name} /><div><p className="text-sm font-medium text-slate-800">{x.name}</p><p className="text-xs text-slate-500">{x.cls}-{x.section} · {x.admNo}</p></div></a>)}
          </Card>
        </div>
      )}
    </div>
  );
}

function StudentAttendance({ sid }: { sid: string }) {
  const { s, attPct } = useStore();
  const days = schoolDays(30);
  const counts = { P: 0, A: 0, L: 0 };
  days.forEach(d => { const v = s.attendance[d]?.[sid]; if (v) counts[v]++; });
  const col = { P: "bg-emerald-500", A: "bg-red-500", L: "bg-amber-400" };
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card><CardHeader title="Attendance summary" sub="Last 30 school days" />
        <p className="text-4xl font-semibold text-slate-900">{attPct(sid)}%</p>
        <div className="mt-3"><Progress value={attPct(sid)} tone={attPct(sid) >= s.school.minAttendance ? "green" : "red"} h={8} /></div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">{[["Present", counts.P, "text-emerald-600"], ["Late", counts.L, "text-amber-600"], ["Absent", counts.A, "text-red-600"]].map(([l, v, c]) => <div key={l as string} className="rounded-lg bg-slate-50 py-2"><p className={cx("text-lg font-semibold", c as string)}>{v}</p><p className="text-slate-500">{l}</p></div>)}</div>
        {attPct(sid) < s.school.minAttendance && <p className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-700">Below the minimum requirement of {s.school.minAttendance}%.</p>}
      </Card>
      <Card className="lg:col-span-2"><CardHeader title="Attendance calendar" sub="Green = present · Amber = late · Red = absent" />
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-10">{days.map(d => { const v = s.attendance[d]?.[sid]; return <div key={d} title={`${fmtDate(d)}: ${v === "P" ? "Present" : v === "A" ? "Absent" : "Late"}`} className="text-center"><div className={cx("mx-auto h-9 w-9 rounded-lg text-[11px] font-semibold leading-9 text-white", v ? col[v] : "bg-slate-200")}>{new Date(d).getDate()}</div><p className="mt-0.5 text-[10px] text-slate-400">{new Date(d).toLocaleString("en", { month: "short" })}</p></div>; })}</div>
      </Card>
    </div>
  );
}

function StudentFees({ sid }: { sid: string }) {
  const { s, fee } = useStore();
  const f = fee(sid);
  const pays = s.payments.filter(p => p.studentId === sid);
  const st = s.structures.find(x => x.id === s.feeRecords.find(r => r.studentId === sid)?.structureId);
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card><CardHeader title="Fee summary" action={<Badge tone={statusTone(f.status)}>{f.status}</Badge>} />
        <dl className="space-y-3 text-sm">{[["Total fees", money(f.total)], ["Discount", f.discount ? `− ${money(f.discount)}` : "—"], ["Paid", money(f.paid)], ["Balance", money(f.balance)], ["Next due date", fmtDate(f.due)]].map(([k, v]) => <div key={k} className="flex justify-between"><dt className="text-slate-500">{k}</dt><dd className="font-semibold text-slate-900">{v}</dd></div>)}</dl>
        <div className="mt-4"><Progress value={f.net ? (f.paid / f.net) * 100 : 100} tone="green" h={8} /></div>
        <Btn className="mt-4 w-full" tone="soft" onClick={() => go("fees/records")}>Open in Fee Management</Btn>
      </Card>
      <Card pad={false} className="lg:col-span-2"><div className="p-5 pb-2"><CardHeader title="Payment history" sub={st?.name} /></div>
        {pays.length === 0 ? <Empty text="No payments recorded yet" /> : <Table head={["Receipt", "Date", "Mode", "Note", { label: "Amount", right: true }]}>{pays.map(p => <Tr key={p.id}><Td className="font-mono text-xs">{p.receipt}</Td><Td>{fmtDate(p.date)}</Td><Td>{p.mode}</Td><Td className="text-xs text-slate-500">{p.note}</Td><Td right className="font-semibold">{money(p.amount)}</Td></Tr>)}</Table>}
      </Card>
    </div>
  );
}
export { gradeTone };
