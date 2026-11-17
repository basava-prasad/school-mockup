"use client";
import React, { useState } from "react";
import { Plus, Trash2, BookOpenCheck, Clock, CheckCircle2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { Badge, Btn, Card, Confirm, Empty, Field, Input, Modal, Pills, Select, Stat, Table, Td, Textarea, Tr } from "@/components/ui";
import { Homework as HW, SUBJECT_NAMES } from "@/lib/data";
import { TODAY, daysBetween, fmtDate } from "@/lib/utils";

export default function Homework() {
  const { s, up, toast, nextId, teacher } = useStore();
  const [f, setF] = useState("All");
  const [cls, setCls] = useState("All");
  const [add, setAdd] = useState(false);
  const [del, setDel] = useState<HW | null>(null);
  const rows = s.homework.filter(h => (f === "All" || h.type === f) && (cls === "All" || `${h.cls}-${h.section}` === cls)).sort((a, b) => b.assigned.localeCompare(a.assigned));
  const keys = Array.from(new Set(s.homework.map(h => `${h.cls}-${h.section}`)));
  const status = (h: HW) => { const d = daysBetween(TODAY, h.due); return d < 0 ? { l: "Closed", t: "slate" } : d === 0 ? { l: "Due today", t: "red" } : d <= 2 ? { l: `Due in ${d}d`, t: "amber" } : { l: `Due in ${d}d`, t: "green" }; };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-xl font-semibold text-slate-900">Homework & Assignments</h1><p className="text-sm text-slate-500">Teachers publish work here; students and parents see it in their portals</p></div><Btn icon={<Plus size={15} />} onClick={() => setAdd(true)}>Assign homework</Btn></div>
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Active" value={String(s.homework.filter(h => h.due >= TODAY).length)} icon={<BookOpenCheck size={17} />} />
        <Stat label="Due within 2 days" value={String(s.homework.filter(h => { const d = daysBetween(TODAY, h.due); return d >= 0 && d <= 2; }).length)} tone="amber" icon={<Clock size={17} />} />
        <Stat label="Closed" value={String(s.homework.filter(h => h.due < TODAY).length)} tone="green" icon={<CheckCircle2 size={17} />} />
      </div>
      <Card pad={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <Pills tabs={["All", "Homework", "Assignment"].map(x => ({ id: x, label: x }))} value={f} onChange={setF} />
          <Select className="!w-40" value={cls} onChange={e => setCls(e.target.value)}><option value="All">All classes</option>{keys.map(k => <option key={k}>{k}</option>)}</Select>
        </div>
        <Table head={["Title", "Class", "Subject", "Type", "Teacher", "Assigned", "Due", "Status", ""]}>
          {rows.map(h => { const st = status(h); return (
            <Tr key={h.id}><Td className="max-w-xs font-medium text-slate-900">{h.title}</Td><Td>{h.cls}-{h.section}</Td><Td>{SUBJECT_NAMES[h.subject]}</Td><Td><Badge tone={h.type === "Assignment" ? "violet" : "blue"}>{h.type}</Badge></Td><Td className="text-xs">{teacher(h.teacherId)?.name}</Td><Td className="text-xs">{fmtDate(h.assigned, false)}</Td><Td className="text-xs">{fmtDate(h.due, false)}</Td><Td><Badge tone={st.t}>{st.l}</Badge></Td><Td><Btn tone="ghost" size="sm" icon={<Trash2 size={14} className="text-red-500" />} onClick={() => setDel(h)} /></Td></Tr>
          ); })}
        </Table>
        {rows.length === 0 && <Empty />}
      </Card>
      {add && <AddHW onClose={() => setAdd(false)} />}
      <Confirm open={!!del} title="Delete homework?" message={<>Remove “{del?.title}”?</>} onConfirm={() => { up(st => ({ homework: st.homework.filter(h => h.id !== del!.id) })); toast("Homework removed", "warn"); }} onClose={() => setDel(null)} />
    </div>
  );
  function AddHW({ onClose }: { onClose: () => void }) {
    const [h, setH] = useState({ cls: "Grade 10", section: "A", subject: "MAT", title: "", due: "2026-11-16", type: "Homework" as HW["type"], description: "" });
    const secs = s.classes.find(c => c.name === h.cls)?.sections ?? ["A"];
    return (
      <Modal open onClose={onClose} wide title="Assign homework" footer={<><Btn tone="secondary" onClick={onClose}>Cancel</Btn><Btn onClick={() => {
        if (!h.title.trim()) return toast("Please enter a title", "err");
        up(st => ({ homework: [{ id: nextId("HW"), ...h, assigned: TODAY, teacherId: s.subjects.find(x => x.code === h.subject)?.teacherId ?? "T1" }, ...st.homework] }));
        toast("Homework published to students & parents"); onClose();
      }}>Publish</Btn></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Class"><Select value={h.cls} onChange={e => setH({ ...h, cls: e.target.value, section: "A" })}>{s.classes.map(c => <option key={c.id}>{c.name}</option>)}</Select></Field>
          <Field label="Section"><Select value={h.section} onChange={e => setH({ ...h, section: e.target.value })}>{secs.map(x => <option key={x}>{x}</option>)}</Select></Field>
          <Field label="Subject"><Select value={h.subject} onChange={e => setH({ ...h, subject: e.target.value })}>{s.subjects.map(x => <option key={x.code} value={x.code}>{x.name}</option>)}</Select></Field>
          <Field label="Type"><Select value={h.type} onChange={e => setH({ ...h, type: e.target.value as HW["type"] })}><option>Homework</option><option>Assignment</option></Select></Field>
          <Field label="Title" className="sm:col-span-2"><Input value={h.title} onChange={e => setH({ ...h, title: e.target.value })} /></Field>
          <Field label="Due date"><Input type="date" value={h.due} min={TODAY} onChange={e => setH({ ...h, due: e.target.value })} /></Field>
          <Field label="Instructions" className="sm:col-span-2"><Textarea rows={3} value={h.description} onChange={e => setH({ ...h, description: e.target.value })} /></Field>
        </div>
      </Modal>
    );
  }
}
