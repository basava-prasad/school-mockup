"use client";
import React, { useMemo, useState } from "react";
import { Plus, Pencil, ArrowLeft, Phone, Mail, Briefcase } from "lucide-react";
import { useStore } from "@/lib/store";
import { Avatar, Badge, Btn, Card, CardHeader, Empty, Field, Input, Modal, Pager, Progress, SearchBox, Select, Table, Tabs, Td, Tr, statusTone, usePaged } from "@/components/ui";
import { SUBJECT_NAMES, Teacher, schoolDays } from "@/lib/data";
import { cx, fmtDate } from "@/lib/utils";
import { go, href } from "@/lib/router";
import { cellFor } from "./AcademicsPanels";
import { DAYS, SLOTS } from "@/lib/data";

export default function TeachersPage({ id }: { id: string }) {
  return id ? <TeacherProfile id={id} /> : <TeacherDirectory />;
}

function TeacherDirectory() {
  const { s, up, toast, nextId } = useStore();
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("All");
  const [status, setStatus] = useState("All");
  const [edit, setEdit] = useState<Teacher | "new" | null>(null);
  const depts = Array.from(new Set(s.teachers.map(t => t.department)));
  const rows = useMemo(() => s.teachers.filter(t => (dept === "All" || t.department === dept) && (status === "All" || t.status === status) && (!q || (t.name + t.empId).toLowerCase().includes(q.toLowerCase()))), [s.teachers, q, dept, status]);
  const pg = usePaged(rows, 10);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-xl font-semibold text-slate-900">Teacher Directory</h1><p className="text-sm text-slate-500">{s.teachers.length} sample records shown from 86 faculty members</p></div>
        <Btn icon={<Plus size={15} />} onClick={() => setEdit("new")}>Add teacher</Btn>
      </div>
      <Card pad={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <SearchBox value={q} onChange={setQ} placeholder="Search name or employee ID…" className="w-72" />
          <Select className="!w-40" value={dept} onChange={e => setDept(e.target.value)}><option value="All">All departments</option>{depts.map(d => <option key={d}>{d}</option>)}</Select>
          <Select className="!w-36" value={status} onChange={e => setStatus(e.target.value)}><option value="All">Any status</option><option>Active</option><option>On Leave</option><option>Resigned</option></Select>
        </div>
        <Table head={["Teacher", "Employee ID", "Department", "Subjects", "Assigned Classes", "Contact", "Status", ""]}>
          {pg.slice.map(t => (
            <Tr key={t.id} onClick={() => go(`teachers/${t.id}`)}>
              <Td><span className="flex items-center gap-2.5"><Avatar name={t.name} /><span className="font-medium text-slate-900">{t.name}</span></span></Td>
              <Td className="text-xs text-slate-500">{t.empId}</Td>
              <Td>{t.department}</Td>
              <Td><div className="flex flex-wrap gap-1">{t.subjects.map(x => <Badge key={x} tone="blue">{SUBJECT_NAMES[x]}</Badge>)}</div></Td>
              <Td className="text-xs text-slate-500">{t.classes.length ? t.classes.slice(0, 3).map(c => c.replace("Grade ", "G")).join(", ") + (t.classes.length > 3 ? ` +${t.classes.length - 3}` : "") : "—"}</Td>
              <Td className="whitespace-nowrap text-xs">{t.phone}</Td>
              <Td><Badge tone={statusTone(t.status)}>{t.status}</Badge></Td>
              <Td><div onClick={e => e.stopPropagation()}><Btn tone="ghost" size="sm" icon={<Pencil size={14} />} onClick={() => setEdit(t)} /></div></Td>
            </Tr>
          ))}
        </Table>
        {rows.length === 0 && <Empty />}
        <Pager p={pg} />
      </Card>
      {edit && <TeacherForm t={edit === "new" ? null : edit} onClose={() => setEdit(null)} />}
    </div>
  );
  function TeacherForm({ t, onClose }: { t: Teacher | null; onClose: () => void }) {
    const [f, setF] = useState<Teacher>(t ?? { id: "", empId: `EMP${2100 + s.teachers.length}`, name: "", department: "Sciences", subjects: [], classes: [], phone: "+91 ", email: "", status: "Active", joined: "2026-11-12", qualification: "", experience: 0 });
    const tog = (k: "subjects" | "classes", v: string) => setF(p => ({ ...p, [k]: p[k].includes(v) ? p[k].filter(x => x !== v) : [...p[k], v] }));
    const save = () => {
      if (!f.name.trim()) return toast("Teacher name is required", "err");
      up(st => ({ teachers: t ? st.teachers.map(x => x.id === t.id ? f : x) : [...st.teachers, { ...f, id: nextId("T") }] }));
      toast(t ? "Teacher updated" : `${f.name} added to faculty`); onClose();
    };
    const Chip = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => <button type="button" onClick={onClick} className={cx("rounded-full border px-2.5 py-1 text-xs", on ? "border-brand-600 bg-brand-700 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>{children}</button>;
    return (
      <Modal open onClose={onClose} wide title={t ? "Edit teacher" : "Add teacher"} footer={<><Btn tone="secondary" onClick={onClose}>Cancel</Btn><Btn onClick={save}>{t ? "Save changes" : "Add teacher"}</Btn></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name"><Input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Employee ID"><Input value={f.empId} onChange={e => setF({ ...f, empId: e.target.value })} /></Field>
          <Field label="Department"><Select value={f.department} onChange={e => setF({ ...f, department: e.target.value })}>{["Languages", "Mathematics", "Sciences", "Humanities", "Technology", "Sports", "Arts"].map(d => <option key={d}>{d}</option>)}</Select></Field>
          <Field label="Employment status"><Select value={f.status} onChange={e => setF({ ...f, status: e.target.value as Teacher["status"] })}><option>Active</option><option>On Leave</option><option>Resigned</option></Select></Field>
          <Field label="Phone"><Input value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} /></Field>
          <Field label="Email"><Input type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="Qualification"><Input value={f.qualification} onChange={e => setF({ ...f, qualification: e.target.value })} /></Field>
          <Field label="Experience (years)"><Input type="number" value={f.experience} onChange={e => setF({ ...f, experience: +e.target.value })} /></Field>
        </div>
        <div className="mt-4"><p className="mb-2 text-xs font-medium text-slate-600">Subject allocation</p><div className="flex flex-wrap gap-1.5">{s.subjects.map(x => <Chip key={x.code} on={f.subjects.includes(x.code)} onClick={() => tog("subjects", x.code)}>{x.name}</Chip>)}</div></div>
        <div className="mt-4"><p className="mb-2 text-xs font-medium text-slate-600">Class allocation</p><div className="flex flex-wrap gap-1.5">{s.classes.map(c => <Chip key={c.id} on={f.classes.includes(c.name)} onClick={() => tog("classes", c.name)}>{c.name.replace("Grade ", "G")}</Chip>)}</div></div>
      </Modal>
    );
  }
}

function TeacherProfile({ id }: { id: string }) {
  const { s, up, toast, teacher } = useStore();
  const [tab, setTab] = useState("overview");
  const [alloc, setAlloc] = useState(false);
  const t = teacher(id);
  if (!t) return <Card><Empty text="Teacher not found" /></Card>;
  // timetable
  const grid: Record<string, string> = {};
  for (const c of s.classes) { if (!t.classes.includes(c.name)) continue; for (const sc of c.sections) for (let d = 0; d < 6; d++) for (let p = 1; p <= 7; p++) { const cell = cellFor(s, c.name, sc, d, p); if (cell.teacherId === id && !grid[`${d}|${p}`]) grid[`${d}|${p}`] = `${c.name.replace("Grade ", "G")}-${sc}|${cell.subject}`; } }
  const periods = Object.keys(grid).length;
  // attendance (deterministic mock)
  const days = schoolDays(30);
  const att = days.map((d, i) => ({ d, v: (i * 7 + t.id.length * 3) % 23 === 0 ? "L" : (i * 5 + id.charCodeAt(1)) % 29 === 0 ? "A" : "P" }));
  const homeroom = s.classes.flatMap(c => c.sections.filter(x => c.classTeachers[x] === id).map(x => `${c.name}-${x}`));
  const sc = (cls: string) => s.students.filter(x => x.cls === cls).length;

  return (
    <div className="space-y-4">
      <a href={href("teachers")} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"><ArrowLeft size={15} /> Back to directory</a>
      <Card>
        <div className="flex flex-wrap items-center gap-5">
          <Avatar name={t.name} size={72} />
          <div className="flex-1"><div className="flex items-center gap-2"><h1 className="text-xl font-semibold text-slate-900">{t.name}</h1><Badge tone={statusTone(t.status)}>{t.status}</Badge></div>
            <p className="mt-1 text-sm text-slate-500">{t.empId} · {t.department} Department · {t.qualification}</p>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500"><span className="flex items-center gap-1"><Phone size={12} />{t.phone}</span><span className="flex items-center gap-1"><Mail size={12} />{t.email}</span><span className="flex items-center gap-1"><Briefcase size={12} />{t.experience} yrs experience · Joined {fmtDate(t.joined)}</span></div></div>
          <div className="grid grid-cols-3 gap-3 text-center">{[["Periods / week", periods], ["Classes", t.classes.length], ["Class teacher", homeroom.length ? homeroom.join(", ") : "—"]].map(([k, v]) => <div key={k as string} className="rounded-lg bg-slate-50 px-4 py-2.5"><p className="text-base font-semibold text-slate-900">{v}</p><p className="text-[11px] text-slate-500">{k}</p></div>)}</div>
        </div>
      </Card>
      <Tabs value={tab} onChange={setTab} tabs={[{ id: "overview", label: "Subjects & Classes" }, { id: "timetable", label: "Timetable" }, { id: "attendance", label: "Attendance" }]} />
      {tab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card><CardHeader title="Subject allocation" action={<Btn size="sm" tone="soft" onClick={() => setAlloc(true)}>Edit allocation</Btn>} />
            <div className="flex flex-wrap gap-2">{t.subjects.map(x => <Badge key={x} tone="blue">{SUBJECT_NAMES[x]}</Badge>)}</div>
            <div className="mt-5"><div className="mb-1 flex justify-between text-xs text-slate-500"><span>Weekly workload</span><span>{periods} / 36 periods</span></div><Progress value={(periods / 36) * 100} tone={periods > 30 ? "red" : periods > 24 ? "amber" : "green"} h={8} /></div>
          </Card>
          <Card pad={false}><div className="p-5 pb-2"><CardHeader title="Class allocation" /></div>
            <Table head={["Class", "Sections", "Students (sample)"]}>{t.classes.map(c => <Tr key={c}><Td className="font-medium">{c}</Td><Td>{s.classes.find(x => x.name === c)?.sections.join(", ")}</Td><Td>{sc(c) || "—"}</Td></Tr>)}</Table>
          </Card>
        </div>
      )}
      {tab === "timetable" && (
        <Card><CardHeader title="Weekly timetable" sub={`${periods} teaching periods`} />
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] border-separate border-spacing-1 text-xs"><thead><tr><th className="w-24" />{DAYS.map(d => <th key={d} className="rounded bg-slate-50 p-2 text-[11px] uppercase text-slate-500">{d.slice(0, 3)}</th>)}</tr></thead>
            <tbody>{SLOTS.map((sl, i) => sl.type === "break" ? <tr key={i}><td /><td colSpan={6} className="rounded bg-amber-50 p-1 text-center text-[10px] tracking-wider text-amber-700">{sl.label.toUpperCase()}</td></tr> : <tr key={i}><td className="p-1 text-slate-500">{sl.label}</td>{DAYS.map((_, d) => { const v = grid[`${d}|${sl.n}`]; return v ? <td key={d} className="rounded-lg bg-brand-50 p-2 text-brand-800"><p className="font-semibold">{SUBJECT_NAMES[v.split("|")[1]]}</p><p className="opacity-70">{v.split("|")[0]}</p></td> : <td key={d} className="rounded-lg border border-dashed border-slate-200 p-2 text-center text-slate-300">Free</td>; })}</tr>)}</tbody></table></div>
        </Card>
      )}
      {tab === "attendance" && (
        <Card><CardHeader title="Staff attendance" sub="Last 30 working days" />
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-10">{att.map(a => <div key={a.d} className="text-center" title={`${fmtDate(a.d)}: ${a.v}`}><div className={cx("mx-auto h-9 w-9 rounded-lg text-[11px] font-semibold leading-9 text-white", a.v === "P" ? "bg-emerald-500" : a.v === "L" ? "bg-amber-400" : "bg-red-500")}>{new Date(a.d).getDate()}</div></div>)}</div>
          <p className="mt-4 text-sm text-slate-600">Present {att.filter(a => a.v === "P").length} · Late {att.filter(a => a.v === "L").length} · Absent {att.filter(a => a.v === "A").length}</p>
        </Card>
      )}
      <Modal open={alloc} onClose={() => setAlloc(false)} wide title="Edit allocation" sub={t.name} footer={<Btn onClick={() => { setAlloc(false); toast("Allocation saved"); }}>Done</Btn>}>
        <p className="mb-2 text-xs font-medium text-slate-600">Subjects</p>
        <div className="mb-4 flex flex-wrap gap-1.5">{s.subjects.map(x => <button key={x.code} onClick={() => up(st => ({ teachers: st.teachers.map(y => y.id === id ? { ...y, subjects: y.subjects.includes(x.code) ? y.subjects.filter(z => z !== x.code) : [...y.subjects, x.code] } : y) }))} className={cx("rounded-full border px-2.5 py-1 text-xs", t.subjects.includes(x.code) ? "border-brand-600 bg-brand-700 text-white" : "border-slate-200 text-slate-600")}>{x.name}</button>)}</div>
        <p className="mb-2 text-xs font-medium text-slate-600">Classes</p>
        <div className="flex flex-wrap gap-1.5">{s.classes.map(c => <button key={c.id} onClick={() => up(st => ({ teachers: st.teachers.map(y => y.id === id ? { ...y, classes: y.classes.includes(c.name) ? y.classes.filter(z => z !== c.name) : [...y.classes, c.name] } : y) }))} className={cx("rounded-full border px-2.5 py-1 text-xs", t.classes.includes(c.name) ? "border-brand-600 bg-brand-700 text-white" : "border-slate-200 text-slate-600")}>{c.name.replace("Grade ", "G")}</button>)}</div>
      </Modal>
    </div>
  );
}
