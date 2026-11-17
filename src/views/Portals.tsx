"use client";
import React, { useState } from "react";
import { Bell, CalendarCheck, Wallet, BookOpenCheck, FileText, Megaphone, CreditCard, CalendarDays, Trophy, Clock } from "lucide-react";
import { useStore } from "@/lib/store";
import { Avatar, Badge, Btn, Card, CardHeader, Progress, Select, Tabs, statusTone } from "@/components/ui";
import { DAYS, SLOTS, SUBJECT_NAMES, seedEvents } from "@/lib/data";
import { TODAY, cx, daysBetween, fmtDate, gradeTone, money } from "@/lib/utils";
import { examResult } from "@/lib/academic";
import { RecordPaymentModal, ReceiptModal } from "./Fees";
import { cellFor } from "./AcademicsPanels";
import { Payment } from "@/lib/data";
import { AiAssistant, QuizzesTab, UniversityTab } from "./StudentExtras";

const ANNOUNCEMENTS = [
  { t: "Children’s Day celebrations on 14 Nov", d: "Students may come in colourful clothes. Cultural programme from 10 AM.", when: "Today" },
  { t: "Unit Test 2 begins 17 November", d: "Date sheet has been shared. Kindly ensure regular revision.", when: "Yesterday" },
  { t: "Parent-Teacher Meeting — Grades 9 & 10", d: "Saturday, 22 November, 9:00 AM – 1:00 PM.", when: "2 days ago" },
];

function Header({ name, sub, children }: { name: string; sub: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-brand-800 to-brand-600 p-5 text-white shadow-lg">
      <div className="flex items-center gap-4"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 text-lg font-bold ring-2 ring-white/30">{name.split(" ").map(x => x[0]).slice(0, 2).join("")}</span><div className="flex-1"><p className="text-xs text-white/70">Welcome back</p><h1 className="text-xl font-semibold">{name}</h1><p className="text-sm text-white/80">{sub}</p></div></div>
      {children}
    </div>
  );
}

export function ParentPortal() {
  const { s, up, attPct, fee, toast } = useStore();
  const parent = s.parents.find(p => p.id === s.portalParent) ?? s.parents[0];
  const kids = s.students.filter(x => x.parentId === parent.id);
  const [cid, setCid] = useState<string>(kids[0]?.id ?? "");
  const child = kids.find(k => k.id === cid) ?? kids[0];
  const [pay, setPay] = useState(false);
  const [rc, setRc] = useState<Payment | null>(null);
  if (!child) return <div className="p-8 text-center text-slate-500">No children linked to this parent.</div>;
  const f = fee(child.id);
  const r = examResult(s, "E2", child.id);
  const hw = s.homework.filter(h => h.cls === child.cls && h.section === child.section && h.due >= TODAY).slice(0, 4);
  const pays = s.payments.filter(p => p.studentId === child.id);
  const notes = s.notifications.filter(n => n.parentName === parent.name).slice(0, 4);
  const upcoming = s.exams.filter(e => e.status === "Scheduled" && e.classes.includes(child.cls)).slice(0, 3);

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 pb-12">
      <div className="flex items-center gap-2 rounded-xl bg-white p-2.5 text-xs text-slate-500 shadow-sm"><span>Logged in as</span><Select className="!w-56 !py-1.5 text-xs" value={parent.id} onChange={e => { up(() => ({ portalParent: e.target.value })); setCid(s.students.find(x => x.parentId === e.target.value)?.id ?? ""); }}>{s.parents.map(p => <option key={p.id} value={p.id}>{p.name} ({s.students.filter(x => x.parentId === p.id).length} child{s.students.filter(x => x.parentId === p.id).length > 1 ? "ren" : ""})</option>)}</Select></div>
      {kids.length > 1 && <div className="flex gap-2">{kids.map(k => <button key={k.id} onClick={() => setCid(k.id)} className={cx("flex flex-1 items-center gap-3 rounded-xl border-2 bg-white p-3 text-left transition", child.id === k.id ? "border-brand-600 shadow-md" : "border-transparent opacity-80")}><Avatar name={k.name} size={36} /><div><p className="text-sm font-semibold text-slate-900">{k.name}</p><p className="text-xs text-slate-500">{k.cls}-{k.section}</p></div></button>)}</div>}
      <Header name={child.name} sub={`${child.cls}-${child.section} · Roll ${child.rollNo} · ${child.admNo}`}>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">{[["Attendance", `${attPct(child.id)}%`], ["Midterm", r ? `${r.pct}%` : "—"], ["Fee due", money(f.balance)]].map(([k, v]) => <div key={k} className="rounded-xl bg-white/12 py-2.5"><p className="text-lg font-semibold">{v}</p><p className="text-[11px] text-white/70">{k}</p></div>)}</div>
      </Header>

      {f.balance > 0 && (
        <Card className="border-amber-200 bg-amber-50/60"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700"><Wallet size={19} /></span><div className="flex-1"><p className="text-sm font-semibold text-slate-900">Outstanding fees: {money(f.balance)}</p><p className="text-xs text-slate-600">Due {fmtDate(f.due)}{f.due < TODAY && <span className="font-medium text-red-600"> · overdue</span>}</p></div><Btn icon={<CreditCard size={14} />} onClick={() => setPay(true)}>Pay now</Btn></div></Card>
      )}

      <Card><CardHeader title="Recent examination results" sub="Midterm Examination" action={r && <Badge tone={gradeTone(r.grade)}>Grade {r.grade}</Badge>} />
        {r ? <div className="space-y-3">{r.rows.map(x => <div key={x.code}><div className="mb-1 flex justify-between text-sm"><span className="text-slate-700">{x.name}</span><span className="font-medium">{x.obtained}/{x.max} <Badge tone={gradeTone(x.grade)}>{x.grade}</Badge></span></div><Progress value={x.pct ?? 0} tone={(x.pct ?? 0) < 50 ? "red" : "blue"} /></div>)}</div> : <p className="text-sm text-slate-400">No results published.</p>}
      </Card>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card><CardHeader title="Homework" />
          {hw.length === 0 ? <p className="text-sm text-slate-400">No pending homework 🎉</p> : <ul className="space-y-3">{hw.map(h => <li key={h.id} className="flex gap-3"><span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><BookOpenCheck size={15} /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-800">{h.title}</p><p className="text-xs text-slate-500">{SUBJECT_NAMES[h.subject]} · due {fmtDate(h.due, false)}</p></div></li>)}</ul>}
        </Card>
        <Card><CardHeader title="Upcoming examinations" />
          <ul className="space-y-3">{upcoming.map(e => <li key={e.id} className="flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-50 text-brand-700"><span className="text-[9px] font-semibold uppercase">{new Date(e.startDate).toLocaleString("en", { month: "short" })}</span><span className="text-sm font-bold leading-none">{new Date(e.startDate).getDate()}</span></span><div><p className="text-sm font-medium text-slate-800">{e.name}</p><p className="text-xs text-slate-500">in {daysBetween(TODAY, e.startDate)} days</p></div></li>)}</ul>
        </Card>
      </div>
      <Card><CardHeader title="School announcements" /><ul className="space-y-3">{ANNOUNCEMENTS.map((a, i) => <li key={i} className="flex gap-3"><Megaphone size={16} className="mt-1 shrink-0 text-brand-500" /><div><p className="text-sm font-medium text-slate-800">{a.t}</p><p className="text-xs text-slate-500">{a.d}</p><p className="mt-0.5 text-[10px] text-slate-400">{a.when}</p></div></li>)}</ul></Card>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card><CardHeader title="Payment history" />{pays.length === 0 ? <p className="text-sm text-slate-400">No payments yet.</p> : <ul className="divide-y divide-slate-100">{pays.map(p => <li key={p.id} className="flex items-center justify-between py-2.5"><div><p className="text-sm font-medium text-slate-800">{money(p.amount)}</p><p className="text-xs text-slate-500">{fmtDate(p.date)} · {p.mode}</p></div><button onClick={() => setRc(p)} className="text-xs font-medium text-brand-600 hover:underline">Receipt</button></li>)}</ul>}</Card>
        <Card><CardHeader title="Notifications" /><ul className="space-y-3">{notes.length === 0 ? <p className="text-sm text-slate-400">Nothing new.</p> : notes.map(n => <li key={n.id} className="flex gap-3"><Bell size={15} className="mt-0.5 shrink-0 text-slate-400" /><div><p className="text-sm text-slate-700">{n.type}</p><p className="text-[11px] text-slate-400">{n.channel} · {fmtDate(n.date, false)}</p></div></li>)}</ul></Card>
      </div>
      {pay && <RecordPaymentModal sid={child.id} onClose={() => setPay(false)} onDone={p => { setPay(false); setRc(p); toast("Payment successful (simulated)"); }} />}
      {rc && <ReceiptModal p={rc} onClose={() => setRc(null)} />}
    </div>
  );
}

export function StudentPortal() {
  const { s, up, attPct, teacher } = useStore();
  const st = s.students.find(x => x.id === s.portalStudent) ?? s.students[0];
  const [tab, setTab] = useState("home");
  const r = examResult(s, "E2", st.id);
  const todayIdx = 3; // Thursday
  const hw = s.homework.filter(h => h.cls === st.cls && h.section === st.section);
  const events = seedEvents();

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 pb-12">
      <div className="flex items-center gap-2 rounded-xl bg-white p-2.5 text-xs text-slate-500 shadow-sm"><span>Logged in as</span><Select className="!w-60 !py-1.5 text-xs" value={st.id} onChange={e => up(() => ({ portalStudent: e.target.value }))}>{s.students.map(x => <option key={x.id} value={x.id}>{x.name} — {x.cls}-{x.section}</option>)}</Select></div>
      <Header name={st.name} sub={`${st.cls}-${st.section} · Roll ${st.rollNo} · ${st.admNo}`}>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">{[["Attendance", `${attPct(st.id)}%`], ["Midterm", r ? `${r.pct}%` : "—"], ["Pending homework", String(hw.filter(h => h.due >= TODAY).length)]].map(([k, v]) => <div key={k} className="rounded-xl bg-white/12 py-2.5"><p className="text-lg font-semibold">{v}</p><p className="text-[11px] text-white/70">{k}</p></div>)}</div>
      </Header>
      <Tabs value={tab} onChange={setTab} tabs={[{ id: "home", label: "Home" }, { id: "timetable", label: "Timetable" }, { id: "results", label: "Results" }, { id: "homework", label: "Homework" }, { id: "quizzes", label: "Weekly Quizzes" }, { id: "university", label: "University Tests" }, { id: "calendar", label: "Calendar" }]} />
      {tab === "home" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card><CardHeader title="Today’s classes" sub="Thursday" />
            <ul className="space-y-2">{SLOTS.filter(x => x.type === "period").map(sl => { const c = cellFor(s, st.cls, st.section, todayIdx, sl.n!); return <li key={sl.n} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2"><span className="w-24 text-xs text-slate-400">{sl.time}</span><span className="flex-1 text-sm font-medium text-slate-800">{SUBJECT_NAMES[c.subject] ?? "Free"}</span><span className="text-xs text-slate-500">{teacher(c.teacherId)?.name.split(" ")[0]}</span></li>; })}</ul></Card>
          <div className="space-y-4">
            <Card><CardHeader title="Attendance" /><p className="text-3xl font-semibold text-slate-900">{attPct(st.id)}%</p><div className="mt-2"><Progress value={attPct(st.id)} tone={attPct(st.id) >= 75 ? "green" : "red"} h={8} /></div></Card>
            <Card><CardHeader title="Announcements" /><ul className="space-y-3">{ANNOUNCEMENTS.map((a, i) => <li key={i} className="flex gap-3"><Megaphone size={15} className="mt-1 shrink-0 text-brand-500" /><div><p className="text-sm font-medium text-slate-800">{a.t}</p><p className="text-xs text-slate-500">{a.when}</p></div></li>)}</ul></Card>
          </div>
        </div>
      )}
      {tab === "timetable" && <Card><CardHeader title="Weekly timetable" /><div className="overflow-x-auto"><table className="w-full min-w-[640px] border-separate border-spacing-1 text-xs"><thead><tr><th />{DAYS.map((d, i) => <th key={d} className={cx("rounded p-2 text-[11px] uppercase", i === todayIdx ? "bg-brand-700 text-white" : "bg-slate-50 text-slate-500")}>{d.slice(0, 3)}</th>)}</tr></thead><tbody>{SLOTS.map((sl, i) => sl.type === "break" ? <tr key={i}><td /><td colSpan={6} className="rounded bg-amber-50 p-1 text-center text-[10px] tracking-wider text-amber-700">{sl.label.toUpperCase()}</td></tr> : <tr key={i}><td className="p-1 text-slate-400">P{sl.n}</td>{DAYS.map((_, d) => { const c = cellFor(s, st.cls, st.section, d, sl.n!); return <td key={d} className={cx("rounded-lg p-2", d === todayIdx ? "bg-brand-50" : "bg-slate-50")}><p className="font-semibold text-slate-800">{SUBJECT_NAMES[c.subject]?.split(" ")[0] ?? "Free"}</p></td>; })}</tr>)}</tbody></table></div></Card>}
      {tab === "results" && <Card><CardHeader title="Examination results" sub="Midterm Examination" action={r && <Badge tone={r.pass ? "green" : "red"}>{r.pass ? "Pass" : "Fail"} · {r.pct}%</Badge>} />{r ? <div className="space-y-3">{r.rows.map(x => <div key={x.code}><div className="mb-1 flex justify-between text-sm"><span>{x.name}</span><span className="font-medium">{x.obtained}/{x.max} · {x.grade}</span></div><Progress value={x.pct ?? 0} tone={(x.pct ?? 0) < 50 ? "red" : "blue"} /></div>)}</div> : <p className="text-sm text-slate-400">Not available.</p>}</Card>}
      {tab === "homework" && <Card><CardHeader title="Homework & assignments" />{hw.length === 0 ? <p className="text-sm text-slate-400">Nothing assigned.</p> : <ul className="divide-y divide-slate-100">{hw.map(h => <li key={h.id} className="flex items-start gap-3 py-3"><span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">{h.type === "Assignment" ? <FileText size={16} /> : <BookOpenCheck size={16} />}</span><div className="flex-1"><p className="text-sm font-medium text-slate-800">{h.title}</p><p className="text-xs text-slate-500">{SUBJECT_NAMES[h.subject]} · {teacher(h.teacherId)?.name} · {h.type}</p></div><Badge tone={h.due < TODAY ? "slate" : daysBetween(TODAY, h.due) <= 1 ? "red" : "green"}>{h.due < TODAY ? "Closed" : `Due ${fmtDate(h.due, false)}`}</Badge></li>)}</ul>}</Card>}
      {tab === "quizzes" && <QuizzesTab />}
      {tab === "university" && <UniversityTab />}
      <AiAssistant studentId={st.id} />
      {tab === "calendar" && <Card><CardHeader title="Academic calendar" /><ul className="space-y-3">{events.map((e, i) => <li key={i} className="flex items-center gap-3"><span className="w-16 text-xs font-medium text-slate-500">{fmtDate(e.date, false)}</span><span className="flex-1 text-sm text-slate-800">{e.title}</span><Badge tone={e.kind === "Exam" ? "blue" : e.kind === "Holiday" ? "amber" : "slate"}>{e.kind}</Badge></li>)}</ul></Card>}
    </div>
  );
}
export { CalendarCheck, CalendarDays, Trophy, Clock, statusTone };
