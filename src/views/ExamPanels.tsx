"use client";
import React, { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, CalendarRange, Download, Printer, Send, School } from "lucide-react";
import { useStore } from "@/lib/store";
import { Badge, Btn, Card, CardHeader, Confirm, Empty, Field, Input, Modal, Pills, Select, Stat, Table, Tabs, Td, Textarea, Tr, statusTone } from "@/components/ui";
import { CORE, Exam, SUBJECT_NAMES, gradeNum } from "@/lib/data";
import { addDays as addDaysSafe, cx, fmtDate, gradeOf, gradeTone, money } from "@/lib/utils";
import { defaultRemark, examResult, pctOf } from "@/lib/academic";
import { href } from "@/lib/router";

export const EXAM_TYPES = ["Unit Test 1", "Unit Test 2", "Midterm", "Half-Yearly", "Pre-Final", "Annual Examination"];

// ======================= EXAMS =======================
export function ExamsPanel() {
  const { s, up, toast, nextId } = useStore();
  const [edit, setEdit] = useState<Exam | "new" | null>(null);
  const [del, setDel] = useState<Exam | null>(null);
  const [sched, setSched] = useState<Exam | null>(null);
  const [filter, setFilter] = useState("All");
  const rows = s.exams.filter(e => filter === "All" || e.status === filter);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total Examinations" value={String(s.exams.length)} icon={<CalendarRange size={17} />} />
        <Stat label="Completed" value={String(s.exams.filter(e => e.status === "Completed").length)} tone="green" icon={<CalendarRange size={17} />} />
        <Stat label="Ongoing" value={String(s.exams.filter(e => e.status === "Ongoing").length)} tone="amber" icon={<CalendarRange size={17} />} />
        <Stat label="Scheduled" value={String(s.exams.filter(e => e.status === "Scheduled").length)} tone="violet" icon={<CalendarRange size={17} />} />
      </div>
      <Card pad={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <CardHeader title="Examination list" sub="Academic year 2026-27" />
          <div className="mb-4 flex gap-2"><Pills tabs={["All", "Completed", "Ongoing", "Scheduled"].map(x => ({ id: x, label: x }))} value={filter} onChange={setFilter} /><Btn icon={<Plus size={15} />} onClick={() => setEdit("new")}>Create examination</Btn></div>
        </div>
        <Table head={["Examination", "Type", "Classes", "Schedule", "Max / Pass", "Status", { label: "Actions", right: true }]}>
          {rows.map(e => (
            <Tr key={e.id}>
              <Td className="font-medium text-slate-900">{e.name}</Td>
              <Td className="text-xs text-slate-500">{e.type}</Td>
              <Td className="text-xs">{e.classes.length} classes<span className="block text-slate-400">{e.subjects.length} subjects</span></Td>
              <Td className="whitespace-nowrap text-xs">{fmtDate(e.startDate, false)} – {fmtDate(e.endDate)}</Td>
              <Td>{e.maxMarks} / {e.passMarks}</Td>
              <Td><Badge tone={statusTone(e.status)}>{e.status}</Badge></Td>
              <Td right><div className="flex justify-end gap-1"><Btn tone="ghost" size="sm" onClick={() => setSched(e)}>Schedule</Btn><Btn tone="ghost" size="sm" icon={<Pencil size={14} />} onClick={() => setEdit(e)} /><Btn tone="ghost" size="sm" icon={<Trash2 size={14} className="text-red-500" />} onClick={() => setDel(e)} /></div></Td>
            </Tr>
          ))}
        </Table>
        {rows.length === 0 && <Empty />}
      </Card>
      {edit && <ExamForm exam={edit === "new" ? null : edit} onClose={() => setEdit(null)} />}
      {sched && <Schedule exam={sched} onClose={() => setSched(null)} />}
      <Confirm open={!!del} title="Delete examination?" message={<>Delete <b>{del?.name}</b>? Any marks entered for it will no longer be shown.</>} onConfirm={() => { up(st => ({ exams: st.exams.filter(e => e.id !== del!.id) })); toast("Examination deleted", "warn"); }} onClose={() => setDel(null)} />
    </div>
  );
  function ExamForm({ exam, onClose }: { exam: Exam | null; onClose: () => void }) {
    const [f, setF] = useState<Exam>(exam ?? { id: "", name: "", type: "Unit Test 2", classes: [], subjects: CORE, startDate: "2026-12-01", endDate: "2026-12-05", maxMarks: 100, passMarks: 33, status: "Scheduled" });
    const tog = (k: "classes" | "subjects", v: string) => setF(p => ({ ...p, [k]: p[k].includes(v) ? p[k].filter(x => x !== v) : [...p[k], v] }));
    const save = () => {
      if (!f.name.trim() || !f.classes.length || !f.subjects.length) return toast("Name, at least one class and one subject are required", "err");
      if (f.passMarks > f.maxMarks) return toast("Passing marks cannot exceed maximum marks", "err");
      up(st => ({ exams: exam ? st.exams.map(e => e.id === exam.id ? f : e) : [...st.exams, { ...f, id: nextId("E") }] }));
      toast(exam ? "Examination updated" : "Examination created"); onClose();
    };
    return (
      <Modal open onClose={onClose} wide title={exam ? "Edit examination" : "Create examination"} footer={<><Btn tone="secondary" onClick={onClose}>Cancel</Btn><Btn onClick={save}>{exam ? "Save changes" : "Create examination"}</Btn></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Examination type"><Select value={f.type} onChange={e => setF({ ...f, type: e.target.value, name: f.name && !EXAM_TYPES.includes(f.name) ? f.name : e.target.value })}>{EXAM_TYPES.map(t => <option key={t}>{t}</option>)}</Select></Field>
          <Field label="Examination name"><Input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="e.g. Unit Test 2 – Nov 2026" /></Field>
          <Field label="Start date"><Input type="date" value={f.startDate} onChange={e => setF({ ...f, startDate: e.target.value })} /></Field>
          <Field label="End date"><Input type="date" value={f.endDate} min={f.startDate} onChange={e => setF({ ...f, endDate: e.target.value })} /></Field>
          <Field label="Maximum marks"><Input type="number" value={f.maxMarks} onChange={e => setF({ ...f, maxMarks: +e.target.value })} /></Field>
          <Field label="Passing marks"><Input type="number" value={f.passMarks} onChange={e => setF({ ...f, passMarks: +e.target.value })} /></Field>
          <Field label="Status"><Select value={f.status} onChange={e => setF({ ...f, status: e.target.value as Exam["status"] })}><option>Scheduled</option><option>Ongoing</option><option>Completed</option></Select></Field>
        </div>
        <div className="mt-4">
          <p className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-600">Classes <button className="text-[11px] text-brand-600" onClick={() => setF(p => ({ ...p, classes: s.classes.map(c => c.name) }))}>Select all</button><button className="text-[11px] text-slate-400" onClick={() => setF(p => ({ ...p, classes: [] }))}>Clear</button></p>
          <div className="flex flex-wrap gap-1.5">{s.classes.map(c => <Chip key={c.id} on={f.classes.includes(c.name)} onClick={() => tog("classes", c.name)}>{c.name.replace("Grade ", "G")}</Chip>)}</div>
        </div>
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-slate-600">Subjects</p>
          <div className="flex flex-wrap gap-1.5">{s.subjects.map(x => <Chip key={x.code} on={f.subjects.includes(x.code)} onClick={() => tog("subjects", x.code)}>{x.name}</Chip>)}</div>
        </div>
      </Modal>
    );
  }
}
const Chip = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button onClick={onClick} className={cx("rounded-full border px-2.5 py-1 text-xs", on ? "border-brand-600 bg-brand-700 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>{children}</button>
);

function Schedule({ exam, onClose }: { exam: Exam; onClose: () => void }) {
  const dates: string[] = [];
  let d = exam.startDate, guard = 0;
  while (d <= exam.endDate && guard++ < 40) { if (new Date(d + "T00:00:00").getDay() !== 0) dates.push(d); d = addDaysSafe(d, 1); }
  return (
    <Modal open onClose={onClose} title={`${exam.name} — Date sheet`} sub={`Reporting time 08:30 AM · Duration ${exam.maxMarks > 50 ? "3 hours" : "1.5 hours"}`} footer={<Btn tone="secondary" onClick={onClose}>Close</Btn>}>
      <Table head={["Date", "Day", "Subject", "Time"]}>
        {exam.subjects.map((code, i) => { const dt = dates[i % Math.max(dates.length, 1)] ?? exam.startDate; return (
          <Tr key={code}><Td>{fmtDate(dt)}</Td><Td>{new Date(dt + "T00:00:00").toLocaleDateString("en", { weekday: "long" })}</Td><Td className="font-medium text-slate-800">{SUBJECT_NAMES[code]}</Td><Td>09:00 – {exam.maxMarks > 50 ? "12:00" : "10:30"}</Td></Tr>
        ); })}
      </Table>
      <p className="mt-3 text-xs text-slate-400">Applicable to: {exam.classes.join(", ")}</p>
    </Modal>
  );
}

// ======================= MARKS =======================
export function MarksPanel() {
  const { s, up, toast } = useStore();
  const [examId, setExamId] = useState("E2");
  const [cls, setCls] = useState("Grade 10");
  const [sec, setSec] = useState("A");
  const [subj, setSubj] = useState("MAT");
  const [mode, setMode] = useState("entry");
  const exam = s.exams.find(e => e.id === examId);
  const studs = s.students.filter(x => x.cls === cls && x.section === sec);
  const secs = s.classes.find(c => c.name === cls)?.sections ?? ["A"];
  const setMark = (sid: string, code: string, raw: string) => {
    if (!exam) return;
    const v = raw === "" ? null : Math.max(0, Math.min(exam.maxMarks, Math.round(+raw)));
    up(st => ({ marks: { ...st.marks, [examId]: { ...(st.marks[examId] ?? {}), [sid]: { ...(st.marks[examId]?.[sid] ?? {}), [code]: v } } } }));
  };
  const vals = studs.map(x => s.marks[examId]?.[x.id]?.[subj]).filter((v): v is number => typeof v === "number");
  const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  const passN = vals.filter(v => exam && v >= exam.passMarks).length;

  return (
    <Card pad={false}>
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
        <Select className="!w-56" value={examId} onChange={e => setExamId(e.target.value)}>{s.exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</Select>
        <Select className="!w-36" value={cls} onChange={e => { setCls(e.target.value); setSec(s.classes.find(c => c.name === e.target.value)?.sections[0] ?? "A"); }}>{s.classes.map(c => <option key={c.id}>{c.name}</option>)}</Select>
        <Select className="!w-28" value={sec} onChange={e => setSec(e.target.value)}>{secs.map(x => <option key={x} value={x}>Sec {x}</option>)}</Select>
        {mode === "entry" && <Select className="!w-44" value={subj} onChange={e => setSubj(e.target.value)}>{(exam?.subjects ?? CORE).map(c => <option key={c} value={c}>{SUBJECT_NAMES[c]}</option>)}</Select>}
        <div className="ml-auto flex gap-2"><Pills tabs={[{ id: "entry", label: "Subject entry" }, { id: "all", label: "Consolidated" }]} value={mode} onChange={setMode} />{mode === "entry" && <Btn onClick={() => toast(`Marks saved for ${SUBJECT_NAMES[subj]} · ${cls}-${sec}`)}>Save marks</Btn>}</div>
      </div>
      {exam && mode === "entry" && studs.length > 0 && (
        <div className="grid grid-cols-2 gap-px border-b border-slate-100 bg-slate-100 text-center text-xs sm:grid-cols-4">
          {[["Max marks", exam.maxMarks], ["Pass marks", exam.passMarks], ["Class average", vals.length ? avg.toFixed(1) : "—"], ["Pass rate", vals.length ? `${Math.round((passN / vals.length) * 100)}%` : "—"]].map(([l, v]) => <div key={l as string} className="bg-white py-2.5"><p className="text-base font-semibold text-slate-900">{v}</p><p className="text-slate-500">{l}</p></div>)}
        </div>
      )}
      {!exam || studs.length === 0 ? <Empty text="No students in this class/section in the demo data. Try Grade 10-A." /> : mode === "entry" ? (
        <Table head={["Student Name", "Admission No.", "Subject", "Max Marks", "Obtained Marks", "Grade", "Result"]}>
          {studs.map(x => {
            const v = s.marks[examId]?.[x.id]?.[subj];
            const has = typeof v === "number";
            const pct = has ? pctOf(v, exam.maxMarks) : 0;
            const g = has ? gradeOf(pct) : "—";
            return (
              <Tr key={x.id}>
                <Td className="font-medium text-slate-800"><a href={href(`students/${x.id}`)} className="hover:text-brand-700">{x.name}</a></Td>
                <Td className="text-xs text-slate-500">{x.admNo}</Td>
                <Td>{SUBJECT_NAMES[subj]}</Td>
                <Td>{exam.maxMarks}</Td>
                <Td><input type="number" min={0} max={exam.maxMarks} value={has ? v : ""} onChange={e => setMark(x.id, subj, e.target.value)} placeholder="—" className={cx("w-20 rounded-lg border px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100", has && v < exam.passMarks ? "border-red-300 bg-red-50/50" : "border-slate-200")} /></Td>
                <Td>{has ? <Badge tone={gradeTone(g)}>{g} · {pct}%</Badge> : "—"}</Td>
                <Td>{has ? <Badge tone={v >= exam.passMarks ? "green" : "red"}>{v >= exam.passMarks ? "Pass" : "Fail"}</Badge> : <span className="text-slate-300">Pending</span>}</Td>
              </Tr>
            );
          })}
        </Table>
      ) : (
        <Table head={["Student", ...exam.subjects.map(c => c), { label: "Total", right: true }, { label: "%", right: true }, "Grade", "Result"]}>
          {studs.map(x => {
            const r = examResult(s, examId, x.id);
            return (
              <Tr key={x.id}>
                <Td className="font-medium text-slate-800">{x.name}</Td>
                {exam.subjects.map(c => { const v = s.marks[examId]?.[x.id]?.[c]; return <Td key={c} className={typeof v === "number" && v < exam.passMarks ? "font-medium text-red-600" : ""}>{typeof v === "number" ? v : "—"}</Td>; })}
                <Td right className="font-semibold">{r ? `${r.total}/${r.max}` : "—"}</Td><Td right>{r ? `${r.pct}%` : "—"}</Td>
                <Td>{r ? <Badge tone={gradeTone(r.grade)}>{r.grade}</Badge> : "—"}</Td>
                <Td>{r ? <Badge tone={r.pass ? "green" : "red"}>{r.pass ? "Pass" : "Fail"}</Badge> : "—"}</Td>
              </Tr>
            );
          })}
        </Table>
      )}
    </Card>
  );
}

// ======================= REPORT CARDS =======================
export function ReportCardPanel({ lockStudent }: { lockStudent?: string }) {
  const { s, up, toast, attPct, parentOf, teacher, addNotifications } = useStore();
  const [examId, setExamId] = useState("E2");
  const [cls, setCls] = useState("Grade 10");
  const [sec, setSec] = useState("A");
  const [sid, setSid] = useState(lockStudent ?? "S1001");
  const [pdf, setPdf] = useState(false);
  const stud = s.students.find(x => x.id === sid);
  const studs = s.students.filter(x => x.cls === cls && x.section === sec);
  const exam = s.exams.find(e => e.id === examId);
  const r = examResult(s, examId, sid);
  const cl = s.classes.find(c => c.name === stud?.cls);
  const remark = s.remarks[`${examId}|${sid}`] ?? (r && stud ? defaultRemark(r.pct, stud.name) : "");
  const secs = s.classes.find(c => c.name === cls)?.sections ?? ["A"];
  const parent = stud ? parentOf(stud.parentId) : undefined;

  const printIt = () => { setPdf(false); toast("Preparing PDF… choose “Save as PDF” in the print dialog"); setTimeout(() => window.print(), 250); };

  return (
    <div className="space-y-4">
      {!lockStudent && (
        <Card className="no-print !p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select className="!w-56" value={examId} onChange={e => setExamId(e.target.value)}>{s.exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</Select>
            <Select className="!w-36" value={cls} onChange={e => { const c = e.target.value; setCls(c); const sc = s.classes.find(x => x.name === c)?.sections[0] ?? "A"; setSec(sc); const f = s.students.find(x => x.cls === c && x.section === sc); if (f) setSid(f.id); }}>{s.classes.map(c => <option key={c.id}>{c.name}</option>)}</Select>
            <Select className="!w-28" value={sec} onChange={e => { setSec(e.target.value); const f = s.students.find(x => x.cls === cls && x.section === e.target.value); if (f) setSid(f.id); }}>{secs.map(x => <option key={x}>{x}</option>)}</Select>
            <Select className="!w-52" value={sid} onChange={e => setSid(e.target.value)}>{studs.length === 0 && <option>No students</option>}{studs.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</Select>
            <div className="ml-auto flex gap-2">
              <Btn tone="secondary" icon={<Send size={14} />} onClick={() => { if (stud && parent) { addNotifications([{ parentName: parent.name, studentName: stud.name, cls: `${stud.cls}-${stud.section}`, type: "Result Announcement", channel: "In-app", date: "2026-11-12", status: "Delivered" }]); toast(`Report card shared with ${parent.name} (simulated)`); } }}>Share with parent</Btn>
              <Btn icon={<Download size={14} />} onClick={() => setPdf(true)}>Download PDF</Btn>
            </div>
          </div>
        </Card>
      )}
      {lockStudent && <div className="no-print flex justify-end"><Btn icon={<Download size={14} />} onClick={() => setPdf(true)}>Download PDF</Btn></div>}

      {!r || !stud || !exam ? (
        <Card><Empty text={exam && exam.status !== "Completed" ? `${exam.name} has not been conducted yet — no marks available.` : "No marks available for this student and examination."} /></Card>
      ) : (
        <div className="print-area mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-4 border-b-2 border-brand-800 pb-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-brand-800 text-white"><School size={30} /></span>
            <div className="flex-1 text-center">
              <h2 className="text-xl font-bold uppercase tracking-wide text-brand-900">{s.school.name}</h2>
              <p className="text-xs text-slate-500">{s.school.address}</p>
              <p className="text-xs text-slate-500">Affiliation: {s.school.affiliation} · {s.school.phone}</p>
            </div>
            <div className="hidden h-16 w-16 sm:block" />
          </div>
          <div className="my-4 text-center"><p className="inline-block rounded-full bg-brand-50 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-brand-800">Report Card · {exam.name} · {s.academicYear}</p></div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 rounded-lg bg-slate-50 p-4 text-sm">
            {[["Student", stud.name], ["Admission No.", stud.admNo], ["Class & Section", `${stud.cls} – ${stud.section}`], ["Roll No.", String(stud.rollNo)], ["Date of Birth", fmtDate(stud.dob)], ["Parent / Guardian", parent?.name ?? "—"]].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2"><span className="text-slate-500">{k}</span><span className="font-medium text-slate-900">{v}</span></div>
            ))}
          </div>
          <table className="mt-5 w-full text-sm">
            <thead><tr className="bg-brand-800 text-left text-xs uppercase tracking-wide text-white"><th className="px-3 py-2">Subject</th><th className="px-3 py-2 text-right">Max</th><th className="px-3 py-2 text-right">Obtained</th><th className="px-3 py-2 text-right">%</th><th className="px-3 py-2 text-center">Grade</th><th className="px-3 py-2 text-center">Result</th></tr></thead>
            <tbody>
              {r.rows.map(x => (
                <tr key={x.code} className="border-b border-slate-100"><td className="px-3 py-2 font-medium">{x.name}</td><td className="px-3 py-2 text-right">{x.max}</td><td className="px-3 py-2 text-right font-semibold">{x.obtained ?? "—"}</td><td className="px-3 py-2 text-right">{x.pct ?? "—"}</td><td className="px-3 py-2 text-center font-semibold">{x.grade}</td><td className={cx("px-3 py-2 text-center text-xs font-semibold", x.pass ? "text-emerald-600" : "text-red-600")}>{x.pass === null ? "—" : x.pass ? "PASS" : "FAIL"}</td></tr>
              ))}
              <tr className="bg-slate-50 font-semibold"><td className="px-3 py-2">Total</td><td className="px-3 py-2 text-right">{r.max}</td><td className="px-3 py-2 text-right">{r.total}</td><td className="px-3 py-2 text-right">{r.pct}%</td><td className="px-3 py-2 text-center">{r.grade}</td><td className={cx("px-3 py-2 text-center", r.pass ? "text-emerald-600" : "text-red-600")}>{r.pass ? "PASS" : "FAIL"}</td></tr>
            </tbody>
          </table>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            {[["Percentage", `${r.pct}%`], ["Overall Grade", r.grade], ["Attendance", `${attPct(stud.id)}%`]].map(([k, v]) => <div key={k} className="rounded-lg border border-slate-200 py-3"><p className="text-xl font-bold text-brand-800">{v}</p><p className="text-[11px] uppercase tracking-wide text-slate-500">{k}</p></div>)}
          </div>
          <div className="mt-5">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Class teacher’s remarks</p>
            <Textarea className="no-print" rows={3} value={remark} onChange={e => { const v = e.target.value; up(st => ({ remarks: { ...st.remarks, [`${examId}|${sid}`]: v } })); }} />
            <p className="hidden rounded-lg border border-slate-200 p-3 text-sm print:block">{remark}</p>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-6 text-center text-xs text-slate-500">
            {[teacher(cl?.classTeachers[stud.section] ?? "")?.name ?? "Class Teacher", "Parent’s Signature", s.school.principal].map((n, i) => (
              <div key={i}><div className="mb-1 h-10 border-b border-slate-400" /><p className="font-medium text-slate-700">{i === 1 ? "" : n}</p><p>{i === 0 ? "Class Teacher" : i === 1 ? "Parent’s Signature" : "Principal"}</p></div>
            ))}
          </div>
          <p className="mt-6 text-center text-[10px] text-slate-400">Grading: A1 ≥91 · A2 ≥81 · B1 ≥71 · B2 ≥61 · C1 ≥51 · C2 ≥41 · D ≥33 · E &lt;33 — Computer generated report card · Issued {fmtDate("2026-11-12")}</p>
        </div>
      )}

      <Modal open={pdf} onClose={() => setPdf(false)} title="Download report card (PDF)" sub="Prototype simulation — generated client-side" footer={<><Btn tone="secondary" onClick={() => setPdf(false)}>Cancel</Btn><Btn icon={<Printer size={14} />} onClick={printIt}>Generate PDF</Btn></>}>
        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex h-20 w-16 items-center justify-center rounded bg-white shadow ring-1 ring-slate-200"><School className="text-brand-700" /></div>
          <div className="text-sm"><p className="font-medium text-slate-900">ReportCard_{stud?.name.replace(" ", "_")}_{exam?.name.replace(/ /g, "_")}.pdf</p><p className="text-xs text-slate-500">A4 · 1 page · ~86 KB</p></div>
        </div>
        <p className="mt-3 text-xs text-slate-500">This opens your browser’s print dialog, where you can choose “Save as PDF”.</p>
      </Modal>
    </div>
  );
}

// ======================= PAGE =======================
export function ExaminationsPage({ sub }: { sub: string }) {
  const tab = sub || "exams";
  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-semibold text-slate-900">Examinations</h1><p className="text-sm text-slate-500">Schedule examinations, record marks and publish report cards</p></div>
      <Tabs value={tab} onChange={t => { window.location.hash = `/examinations/${t}`; }} tabs={[{ id: "exams", label: "Examinations" }, { id: "marks", label: "Marks entry" }, { id: "report-cards", label: "Report cards" }]} />
      {tab === "marks" ? <MarksPanel /> : tab === "report-cards" ? <ReportCardPanel /> : <ExamsPanel />}
    </div>
  );
}
export { Stat, money, gradeNum };
