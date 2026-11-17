"use client";
import React, { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Eye, Check as CheckIcon, Users, CalendarCheck, Bell } from "lucide-react";
import { useStore, State } from "@/lib/store";
import { Avatar, Badge, Btn, Card, CardHeader, Check, Confirm, Empty, Field, Input, Modal, Pills, Progress, SearchBox, Select, Table, Td, Tr, statusTone } from "@/components/ui";
import { ClassRec, DAYS, SLOTS, SUBJECT_NAMES, Subject, defaultCell, gradeNum, schoolDays } from "@/lib/data";
import { TODAY, cx, fmtDate, weekday } from "@/lib/utils";
import { go } from "@/lib/router";
export { ExaminationsPage } from "./ExamPanels";

// ======================= CLASSES =======================
export function ClassesPanel() {
  const { s, up, toast, nextId, teacher } = useStore();
  const [edit, setEdit] = useState<ClassRec | "new" | null>(null);
  const [del, setDel] = useState<ClassRec | null>(null);
  const [view, setView] = useState<ClassRec | null>(null);
  const [q, setQ] = useState("");
  const rows = s.classes.filter(c => c.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <Card pad={false}>
      <div className="flex flex-wrap items-center justify-between gap-3 p-5">
        <CardHeader title="Classes" sub={`${s.classes.length} classes · ${s.classes.reduce((a, c) => a + c.sections.length, 0)} sections`} />
        <div className="mb-4 flex gap-2"><SearchBox value={q} onChange={setQ} placeholder="Search class…" className="w-52" /><Btn icon={<Plus size={15} />} onClick={() => setEdit("new")}>Add class</Btn></div>
      </div>
      <Table head={["Class", "Sections", "Students", "Class Teachers", "Room", { label: "Actions", right: true }]}>
        {rows.map(c => {
          const count = s.students.filter(x => x.cls === c.name).length;
          return (
            <Tr key={c.id}>
              <Td className="font-medium text-slate-900">{c.name}</Td>
              <Td><div className="flex gap-1">{c.sections.map(x => <Badge key={x} tone="blue">{x}</Badge>)}</div></Td>
              <Td>{count ? count : <span className="text-slate-400">—</span>}{count > 0 && <span className="ml-1 text-xs text-slate-400">(sample)</span>}</Td>
              <Td className="text-xs text-slate-500">{c.sections.slice(0, 2).map(x => `${x}: ${teacher(c.classTeachers[x])?.name ?? "Unassigned"}`).join(" · ")}{c.sections.length > 2 && ` +${c.sections.length - 2}`}</Td>
              <Td>{c.room}</Td>
              <Td right>
                <div className="flex justify-end gap-1">
                  <Btn tone="ghost" size="sm" icon={<Eye size={14} />} onClick={() => setView(c)}>View</Btn>
                  <Btn tone="ghost" size="sm" icon={<Pencil size={14} />} onClick={() => setEdit(c)}>Edit</Btn>
                  <Btn tone="ghost" size="sm" icon={<Trash2 size={14} className="text-red-500" />} onClick={() => setDel(c)} />
                </div>
              </Td>
            </Tr>
          );
        })}
      </Table>
      {rows.length === 0 && <Empty />}
      {edit && <ClassForm cls={edit === "new" ? null : edit} onClose={() => setEdit(null)} />}
      {view && <ClassDetail id={view.id} onClose={() => setView(null)} />}
      <Confirm open={!!del} title="Delete class?" message={<>This removes <b>{del?.name}</b> and its sections from the class list. {del && s.students.some(x => x.cls === del.name) && <span className="text-red-600">Students currently assigned to this class will keep their records but show an unknown class.</span>}</>}
        onConfirm={() => { up(st => ({ classes: st.classes.filter(c => c.id !== del!.id) })); toast(`${del!.name} deleted`, "warn"); }} onClose={() => setDel(null)} />
    </Card>
  );
  function ClassForm({ cls, onClose }: { cls: ClassRec | null; onClose: () => void }) {
    const [name, setName] = useState(cls?.name ?? "");
    const [secs, setSecs] = useState((cls?.sections ?? ["A"]).join(", "));
    const [room, setRoom] = useState(cls?.room ?? "");
    const save = () => {
      const sections = secs.split(",").map(x => x.trim().toUpperCase()).filter(Boolean);
      if (!name.trim() || !sections.length) return toast("Enter a class name and at least one section", "err");
      if (cls) { up(st => ({ classes: st.classes.map(c => c.id === cls.id ? { ...c, name: name.trim(), sections, room, classTeachers: Object.fromEntries(sections.map(x => [x, c.classTeachers[x] ?? ""])) } : c) })); toast("Class updated"); }
      else { up(st => ({ classes: [...st.classes, { id: nextId("c"), name: name.trim(), order: st.classes.length, sections, room, classTeachers: {} }] })); toast(`${name} added`); }
      onClose();
    };
    return (
      <Modal open onClose={onClose} title={cls ? "Edit class" : "Add class"} footer={<><Btn tone="secondary" onClick={onClose}>Cancel</Btn><Btn onClick={save}>{cls ? "Save changes" : "Add class"}</Btn></>}>
        <div className="space-y-4">
          <Field label="Class name"><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Grade 7" /></Field>
          <Field label="Sections" hint="Comma-separated, e.g. A, B, C"><Input value={secs} onChange={e => setSecs(e.target.value)} /></Field>
          <Field label="Classroom / block"><Input value={room} onChange={e => setRoom(e.target.value)} placeholder="e.g. 214" /></Field>
        </div>
      </Modal>
    );
  }
}

function ClassDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const { s, up, toast, teacher } = useStore();
  const c = s.classes.find(x => x.id === id)!;
  const [sec, setSec] = useState(c.sections[0]);
  const studs = s.students.filter(x => x.cls === c.name && x.section === sec);
  return (
    <Modal open onClose={onClose} wide title={c.name} sub={`${c.sections.length} sections · Room ${c.room}`} footer={<Btn tone="secondary" onClick={onClose}>Close</Btn>}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Pills tabs={c.sections.map(x => ({ id: x, label: `Section ${x}` }))} value={sec} onChange={setSec} />
        <div className="flex items-center gap-2"><span className="text-xs text-slate-500">Class teacher</span>
          <Select className="!w-52" value={c.classTeachers[sec] ?? ""} onChange={e => { up(st => ({ classes: st.classes.map(x => x.id === id ? { ...x, classTeachers: { ...x.classTeachers, [sec]: e.target.value } } : x) })); toast(`Class teacher assigned to ${c.name}-${sec}`); }}>
            <option value="">Unassigned</option>
            {s.teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
        </div>
      </div>
      <p className="mb-2 text-xs text-slate-500">{studs.length} students · Class teacher: <b className="text-slate-700">{teacher(c.classTeachers[sec])?.name ?? "—"}</b></p>
      {studs.length === 0 ? <Empty text="No students recorded for this section in the demo data" /> : (
        <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200">
          <Table head={["Roll", "Student", "Admission No", "Gender"]}>
            {studs.map(x => <Tr key={x.id} onClick={() => go(`students/${x.id}`)}><Td>{x.rollNo}</Td><Td><span className="flex items-center gap-2"><Avatar name={x.name} size={24} />{x.name}</span></Td><Td>{x.admNo}</Td><Td>{x.gender}</Td></Tr>)}
          </Table>
        </div>
      )}
    </Modal>
  );
}

// ======================= SUBJECTS =======================
export function SubjectsPanel() {
  const { s, up, toast, teacher } = useStore();
  const [edit, setEdit] = useState<Subject | "new" | null>(null);
  const [del, setDel] = useState<Subject | null>(null);
  const [q, setQ] = useState("");
  const rows = s.subjects.filter(x => (x.name + x.code).toLowerCase().includes(q.toLowerCase()));
  const range = (cl: string[]) => (cl.length ? `${cl[0]} – ${cl[cl.length - 1]} (${cl.length} classes)` : "—");
  return (
    <Card pad={false}>
      <div className="flex flex-wrap items-center justify-between gap-3 p-5">
        <CardHeader title="Subjects" sub={`${s.subjects.length} subjects · ${s.subjects.filter(x => x.type === "Optional").length} optional`} />
        <div className="mb-4 flex gap-2"><SearchBox value={q} onChange={setQ} placeholder="Search subject…" className="w-52" /><Btn icon={<Plus size={15} />} onClick={() => setEdit("new")}>Add subject</Btn></div>
      </div>
      <Table head={["Code", "Subject", "Type", "Assigned Teacher", "Class Allocation", { label: "Actions", right: true }]}>
        {rows.map(x => (
          <Tr key={x.code}>
            <Td><span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">{x.code}</span></Td>
            <Td className="font-medium text-slate-900">{x.name}</Td>
            <Td><Badge tone={x.type === "Compulsory" ? "blue" : "violet"}>{x.type}</Badge></Td>
            <Td>{teacher(x.teacherId)?.name ?? <span className="text-slate-400">Unassigned</span>}</Td>
            <Td className="text-xs text-slate-500">{range(x.classes)}</Td>
            <Td right><div className="flex justify-end gap-1"><Btn tone="ghost" size="sm" icon={<Pencil size={14} />} onClick={() => setEdit(x)}>Edit</Btn><Btn tone="ghost" size="sm" icon={<Trash2 size={14} className="text-red-500" />} onClick={() => setDel(x)} /></div></Td>
          </Tr>
        ))}
      </Table>
      {edit && <SubjectForm sub={edit === "new" ? null : edit} onClose={() => setEdit(null)} />}
      <Confirm open={!!del} title="Delete subject?" message={<>Remove <b>{del?.name}</b> ({del?.code}) from the curriculum?</>} onConfirm={() => { up(st => ({ subjects: st.subjects.filter(x => x.code !== del!.code) })); toast("Subject deleted", "warn"); }} onClose={() => setDel(null)} />
    </Card>
  );
  function SubjectForm({ sub, onClose }: { sub: Subject | null; onClose: () => void }) {
    const [f, setF] = useState<Subject>(sub ?? { code: "", name: "", type: "Compulsory", teacherId: "", classes: [] });
    const toggle = (c: string) => setF(p => ({ ...p, classes: p.classes.includes(c) ? p.classes.filter(x => x !== c) : [...p.classes, c] }));
    const group = (a: number, b: number) => s.classes.map(c => c.name).filter(n => gradeNum(n) >= a && gradeNum(n) <= b);
    const save = () => {
      if (!f.code.trim() || !f.name.trim()) return toast("Subject code and name are required", "err");
      if (!sub && s.subjects.some(x => x.code === f.code.toUpperCase())) return toast("Subject code already exists", "err");
      const rec = { ...f, code: f.code.toUpperCase() };
      up(st => ({ subjects: sub ? st.subjects.map(x => x.code === sub.code ? rec : x) : [...st.subjects, rec] }));
      toast(sub ? "Subject updated" : "Subject added"); onClose();
    };
    return (
      <Modal open onClose={onClose} wide title={sub ? "Edit subject" : "Add subject"} footer={<><Btn tone="secondary" onClick={onClose}>Cancel</Btn><Btn onClick={save}>Save subject</Btn></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Subject code"><Input disabled={!!sub} value={f.code} onChange={e => setF({ ...f, code: e.target.value })} placeholder="e.g. GEO" /></Field>
          <Field label="Subject name"><Input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Type"><Select value={f.type} onChange={e => setF({ ...f, type: e.target.value as Subject["type"] })}><option>Compulsory</option><option>Optional</option></Select></Field>
          <Field label="Assigned teacher"><Select value={f.teacherId} onChange={e => setF({ ...f, teacherId: e.target.value })}><option value="">Select teacher…</option>{s.teachers.map(t => <option key={t.id} value={t.id}>{t.name} — {t.department}</option>)}</Select></Field>
        </div>
        <div className="mt-4">
          <div className="mb-2 flex flex-wrap items-center gap-2"><span className="text-xs font-medium text-slate-600">Class allocation</span>
            {[["Pre-primary", -3, -1], ["1–5", 1, 5], ["6–8", 6, 8], ["9–10", 9, 10], ["11–12", 11, 12]].map(([l, a, b]) => <button key={l as string} onClick={() => setF(p => ({ ...p, classes: Array.from(new Set([...p.classes, ...group(a as number, b as number)])) }))} className="rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700 hover:bg-brand-100">+ {l}</button>)}
            <button onClick={() => setF(p => ({ ...p, classes: [] }))} className="text-[11px] text-slate-400 hover:text-red-500">Clear</button></div>
          <div className="flex flex-wrap gap-1.5">{s.classes.map(c => <button key={c.id} onClick={() => toggle(c.name)} className={cx("rounded-full border px-2.5 py-1 text-xs", f.classes.includes(c.name) ? "border-brand-600 bg-brand-700 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>{c.name.replace("Grade ", "G")}</button>)}</div>
        </div>
      </Modal>
    );
  }
}

// ======================= TIMETABLE =======================
const SUBJ_COLORS: Record<string, string> = {
  ENG: "bg-blue-50 text-blue-800 border-blue-100", MAT: "bg-indigo-50 text-indigo-800 border-indigo-100", SCI: "bg-emerald-50 text-emerald-800 border-emerald-100",
  HIN: "bg-amber-50 text-amber-800 border-amber-100", SST: "bg-rose-50 text-rose-800 border-rose-100", CS: "bg-violet-50 text-violet-800 border-violet-100",
  PE: "bg-orange-50 text-orange-800 border-orange-100", ART: "bg-pink-50 text-pink-800 border-pink-100", SAN: "bg-teal-50 text-teal-800 border-teal-100",
};
export function cellFor(s: State, cls: string, sec: string, day: number, period: number) {
  const c = s.classes.find(x => x.name === cls);
  const secIdx = Math.max(0, c?.sections.indexOf(sec) ?? 0);
  return s.ttOverrides[`${cls}|${sec}|${day}|${period}`] ?? defaultCell(s.teachers, cls, secIdx, day, period);
}

export function TimetablePanel({ teacherMode = false }: { teacherMode?: boolean }) {
  const { s, up, toast, teacher } = useStore();
  const [cls, setCls] = useState("Grade 10");
  const [sec, setSec] = useState("A");
  const [tid, setTid] = useState("T1");
  const [ed, setEd] = useState<{ day: number; period: number } | null>(null);
  const cur = s.classes.find(c => c.name === cls);
  const secs = cur?.sections ?? ["A"];

  const teacherGrid = useMemo(() => {
    if (!teacherMode) return null;
    const t = teacher(tid);
    const g: Record<string, string> = {};
    if (!t) return g;
    for (const c of s.classes) {
      if (!t.classes.includes(c.name)) continue;
      for (const sc of c.sections) for (let d = 0; d < 6; d++) for (let p = 1; p <= 7; p++) {
        const cell = cellFor(s, c.name, sc, d, p);
        const k = `${d}|${p}`;
        if (cell.teacherId === tid && !g[k]) g[k] = `${c.name}|${sc}|${cell.subject}`;
      }
    }
    return g;
  }, [teacherMode, tid, s, teacher]);

  return (
    <Card pad={false}>
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
        {teacherMode ? (
          <Select className="!w-64" value={tid} onChange={e => setTid(e.target.value)}>{s.teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.subjects.map(x => SUBJECT_NAMES[x]).join(", ")})</option>)}</Select>
        ) : (
          <>
            <Select className="!w-40" value={cls} onChange={e => { setCls(e.target.value); setSec(s.classes.find(c => c.name === e.target.value)?.sections[0] ?? "A"); }}>{s.classes.map(c => <option key={c.id}>{c.name}</option>)}</Select>
            <Select className="!w-32" value={sec} onChange={e => setSec(e.target.value)}>{secs.map(x => <option key={x} value={x}>Section {x}</option>)}</Select>
          </>
        )}
        <p className="text-sm text-slate-500">{teacherMode ? "Weekly teaching schedule" : `Class teacher: ${teacher(cur?.classTeachers[sec] ?? "")?.name ?? "—"} · Click any period to edit`}</p>
        <Btn tone="secondary" size="sm" className="ml-auto" onClick={() => window.print()}>Print</Btn>
      </div>
      <div className="print-area overflow-x-auto p-4">
        <table className="w-full min-w-[820px] border-separate border-spacing-1.5 text-xs">
          <thead><tr><th className="w-28 p-2 text-left text-[11px] font-semibold uppercase text-slate-400">Time</th>{DAYS.map(d => <th key={d} className="rounded-md bg-slate-50 p-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">{d}</th>)}</tr></thead>
          <tbody>
            {SLOTS.map((sl, i) => sl.type === "break" ? (
              <tr key={i}><td className="p-2 text-slate-400">{sl.time}</td><td colSpan={6} className="rounded-md bg-amber-50/70 p-1.5 text-center text-[11px] font-medium tracking-wider text-amber-700">☕ {sl.label.toUpperCase()}</td></tr>
            ) : (
              <tr key={i}>
                <td className="p-2"><p className="font-medium text-slate-700">{sl.label}</p><p className="text-[11px] text-slate-400">{sl.time}</p></td>
                {DAYS.map((_, d) => {
                  if (teacherMode) {
                    const v = teacherGrid?.[`${d}|${sl.n}`];
                    if (!v) return <td key={d} className="rounded-lg border border-dashed border-slate-200 p-2 text-center text-slate-300">Free</td>;
                    const [c, sc, sub] = v.split("|");
                    return <td key={d} className={cx("rounded-lg border p-2", SUBJ_COLORS[sub] ?? "bg-slate-50")}><p className="font-semibold">{SUBJECT_NAMES[sub]}</p><p className="opacity-70">{c.replace("Grade ", "Grade ")}-{sc}</p></td>;
                  }
                  const cell = cellFor(s, cls, sec, d, sl.n!);
                  return (
                    <td key={d} onClick={() => setEd({ day: d, period: sl.n! })} className={cx("cursor-pointer rounded-lg border p-2 transition hover:shadow-md", SUBJ_COLORS[cell.subject] ?? "border-dashed border-slate-200 bg-white text-slate-300")}>
                      {cell.subject ? <><p className="font-semibold">{SUBJECT_NAMES[cell.subject] ?? cell.subject}</p><p className="truncate opacity-70">{teacher(cell.teacherId)?.name ?? "—"}</p></> : <p className="text-center">Free</p>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {ed && !teacherMode && (() => {
        const cell = cellFor(s, cls, sec, ed.day, ed.period);
        return <CellEditor key={`${ed.day}${ed.period}`} title={`${DAYS[ed.day]} · Period ${ed.period} · ${cls}-${sec}`} init={cell} onClose={() => setEd(null)}
          onSave={(v) => { up(st => ({ ttOverrides: { ...st.ttOverrides, [`${cls}|${sec}|${ed.day}|${ed.period}`]: v } })); toast("Timetable entry updated"); setEd(null); }} />;
      })()}
    </Card>
  );
}
function CellEditor({ title, init, onSave, onClose }: { title: string; init: { subject: string; teacherId: string }; onSave: (v: { subject: string; teacherId: string }) => void; onClose: () => void }) {
  const { s } = useStore();
  const [sub, setSub] = useState(init.subject);
  const [tid, setTid] = useState(init.teacherId);
  const cands = s.teachers.filter(t => !sub || t.subjects.includes(sub));
  return (
    <Modal open onClose={onClose} title="Edit timetable entry" sub={title} footer={<><Btn tone="ghost" onClick={() => onSave({ subject: "", teacherId: "" })}>Clear period</Btn><Btn tone="secondary" onClick={onClose}>Cancel</Btn><Btn onClick={() => onSave({ subject: sub, teacherId: tid })}>Save</Btn></>}>
      <div className="space-y-4">
        <Field label="Subject"><Select value={sub} onChange={e => { setSub(e.target.value); setTid(s.teachers.find(t => t.subjects.includes(e.target.value))?.id ?? ""); }}><option value="">Free period</option>{s.subjects.map(x => <option key={x.code} value={x.code}>{x.name}</option>)}</Select></Field>
        <Field label="Teacher" hint="Showing teachers qualified for the selected subject"><Select value={tid} onChange={e => setTid(e.target.value)}><option value="">—</option>{cands.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></Field>
      </div>
    </Modal>
  );
}

export function TimetablePage() {
  const [m, setM] = useState<"class" | "teacher">("class");
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><div><h1 className="text-xl font-semibold text-slate-900">Timetable</h1><p className="text-sm text-slate-500">Monday – Saturday · 7 periods plus two breaks</p></div>
        <Pills tabs={[{ id: "class", label: "Class timetable" }, { id: "teacher", label: "Teacher timetable" }]} value={m} onChange={v => setM(v as "class" | "teacher")} /></div>
      <TimetablePanel key={m} teacherMode={m === "teacher"} />
    </div>
  );
}

// ======================= ATTENDANCE MARKING =======================
export function AttendanceMarking() {
  const { s, up, toast, attPct } = useStore();
  const [cls, setCls] = useState("Grade 10");
  const [sec, setSec] = useState("A");
  const [date, setDate] = useState(TODAY);
  const secs = s.classes.find(c => c.name === cls)?.sections ?? ["A"];
  const studs = s.students.filter(x => x.cls === cls && x.section === sec);
  const day = s.attendance[date] ?? {};
  const set = (id: string, v: "P" | "A" | "L") => up(st => ({ attendance: { ...st.attendance, [date]: { ...(st.attendance[date] ?? {}), [id]: v } } }));
  const all = () => { up(st => ({ attendance: { ...st.attendance, [date]: { ...(st.attendance[date] ?? {}), ...Object.fromEntries(studs.map(x => [x.id, "P" as const])) } } })); toast(`All ${studs.length} students marked present`); };
  const counts = { P: 0, A: 0, L: 0, none: 0 };
  studs.forEach(x => { const v = day[x.id]; if (v) counts[v]++; else counts.none++; });
  const pct = studs.length ? Math.round(((counts.P + counts.L) / studs.length) * 1000) / 10 : 0;
  const hist = schoolDays(10).reverse().map(d => {
    const rec = s.attendance[d] ?? {};
    const c = { P: 0, A: 0, L: 0 };
    studs.forEach(x => { if (rec[x.id]) c[rec[x.id]]++; });
    const n = c.P + c.A + c.L;
    return { d, ...c, pct: n ? Math.round(((c.P + c.L) / n) * 1000) / 10 : 0, n };
  });
  const absentees = studs.filter(x => day[x.id] === "A");

  const save = () => {
    toast(`Attendance saved for ${cls}-${sec} · ${fmtDate(date)}`);
    if (absentees.length) toast(`${absentees.length} parent notification${absentees.length > 1 ? "s" : ""} queued (simulated)`, "warn");
  };

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Card pad={false} className="xl:col-span-2">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <Select className="!w-36" value={cls} onChange={e => { setCls(e.target.value); setSec(s.classes.find(c => c.name === e.target.value)?.sections[0] ?? "A"); }}>{s.classes.map(c => <option key={c.id}>{c.name}</option>)}</Select>
          <Select className="!w-32" value={sec} onChange={e => setSec(e.target.value)}>{secs.map(x => <option key={x} value={x}>Section {x}</option>)}</Select>
          <Input type="date" className="!w-40" value={date} max={TODAY} onChange={e => e.target.value && setDate(e.target.value)} />
          <div className="ml-auto flex gap-2"><Btn tone="secondary" icon={<CheckIcon size={15} />} onClick={all} disabled={!studs.length}>Mark all present</Btn><Btn onClick={save} disabled={!studs.length}>Save attendance</Btn></div>
        </div>
        {weekday(date) === 0 && <p className="bg-amber-50 px-4 py-2 text-xs text-amber-700">Sunday is a non-working day. You can still mark attendance for the prototype demo.</p>}
        {studs.length === 0 ? <Empty text={`No students recorded in ${cls}-${sec} in the demo data. Try Grade 10-A, 10-B, 9-A or 8-A.`} /> : (
          <Table head={["Roll", "Student", "Adm. No", "30-day %", { label: "Status", right: true }]}>
            {studs.map(x => {
              const v = day[x.id];
              return (
                <Tr key={x.id}>
                  <Td>{x.rollNo}</Td>
                  <Td><span className="flex items-center gap-2 font-medium text-slate-800"><Avatar name={x.name} size={26} />{x.name}</span></Td>
                  <Td className="text-xs text-slate-500">{x.admNo}</Td>
                  <Td><span className={attPct(x.id) < s.school.minAttendance ? "font-medium text-red-600" : ""}>{attPct(x.id)}%</span></Td>
                  <Td right>
                    <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
                      {([["P", "Present", "bg-emerald-600"], ["L", "Late", "bg-amber-500"], ["A", "Absent", "bg-red-600"]] as const).map(([k, l, c]) => (
                        <button key={k} onClick={() => set(x.id, k)} className={cx("rounded-md px-3 py-1.5 transition", v === k ? `${c} text-white shadow-sm` : "text-slate-500 hover:text-slate-800")}>{l}</button>
                      ))}
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </Table>
        )}
      </Card>
      <div className="space-y-4">
        <Card>
          <CardHeader title="Daily summary" sub={`${cls}-${sec} · ${fmtDate(date)}`} />
          <div className="mb-3 flex items-end justify-between"><span className="text-3xl font-semibold text-slate-900">{pct}%</span><span className="text-xs text-slate-500">attendance today</span></div>
          <Progress value={pct} tone={pct >= 90 ? "green" : pct >= 75 ? "amber" : "red"} h={8} />
          <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
            {[["Present", counts.P, "text-emerald-600"], ["Late", counts.L, "text-amber-600"], ["Absent", counts.A, "text-red-600"], ["Not marked", counts.none, "text-slate-500"]].map(([l, v, c]) => <div key={l as string} className="rounded-lg bg-slate-50 py-2.5"><p className={cx("text-lg font-semibold", c as string)}>{v}</p><p className="text-slate-500">{l}</p></div>)}
          </div>
          {absentees.length > 0 && <div className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-700"><p className="mb-1 flex items-center gap-1.5 font-medium"><Bell size={13} /> Parents to be notified</p>{absentees.map(a => a.name).join(", ")}</div>}
        </Card>
        <Card pad={false}>
          <div className="p-5 pb-3"><CardHeader title="Attendance history" sub="Last 10 school days" /></div>
          <Table head={["Date", "P", "A", "L", "%"]}>
            {hist.map(h => <Tr key={h.d}><Td className="text-xs">{fmtDate(h.d, false)}</Td><Td>{h.P}</Td><Td>{h.A}</Td><Td>{h.L}</Td><Td><span className={h.pct < 90 && h.n ? "text-amber-600" : ""}>{h.n ? `${h.pct}%` : "—"}</span></Td></Tr>)}
          </Table>
        </Card>
      </div>
    </div>
  );
}

export { Users, CalendarCheck, statusTone, SearchBox };
