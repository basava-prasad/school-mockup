"use client";
import React, { useEffect, useRef, useState } from "react";
import { Sparkles, Send, X, CheckCircle2, XCircle, Clock, GraduationCap, Trophy, Timer, ArrowLeft } from "lucide-react";
import { useStore } from "@/lib/store";
import { Badge, Btn, Card, CardHeader, Progress } from "@/components/ui";
import { SUBJECT_NAMES } from "@/lib/data";
import { TODAY, cx, fmtDate, daysBetween } from "@/lib/utils";
import { examResult } from "@/lib/academic";

type Q = { q: string; opts: string[]; a: number };
type Quiz = { id: string; week: string; subject: string; title: string; due: string; mins: number; qs: Q[] };

const QUIZZES: Quiz[] = [
  { id: "Q1", week: "Week 46", subject: "MAT", title: "Quadratic Equations", due: "2026-11-15", mins: 10, qs: [
    { q: "The roots of x² − 5x + 6 = 0 are:", opts: ["2 and 3", "−2 and −3", "1 and 6", "−1 and 6"], a: 0 },
    { q: "The discriminant of ax² + bx + c = 0 is:", opts: ["b² + 4ac", "b² − 4ac", "4ac − b", "a² − 4bc"], a: 1 },
    { q: "If the discriminant is zero, the roots are:", opts: ["Imaginary", "Real and distinct", "Real and equal", "Undefined"], a: 2 },
    { q: "Sum of roots of 2x² − 8x + 3 = 0 is:", opts: ["4", "−4", "3/2", "8"], a: 0 },
  ] },
  { id: "Q2", week: "Week 46", subject: "SCI", title: "Electricity Basics", due: "2026-11-16", mins: 8, qs: [
    { q: "SI unit of electric current is:", opts: ["Volt", "Ampere", "Ohm", "Watt"], a: 1 },
    { q: "Ohm's law relates:", opts: ["V, I and R", "P, V and t", "F, m and a", "Q, I and t only"], a: 0 },
    { q: "Resistance of a wire increases with:", opts: ["Decrease in length", "Increase in length", "Increase in area", "Lower temperature"], a: 1 },
  ] },
  { id: "Q3", week: "Week 45", subject: "ENG", title: "Grammar: Tenses & Voice", due: "2026-11-09", mins: 8, qs: [
    { q: "Choose the passive: “She wrote a letter.”", opts: ["A letter is written by her", "A letter was written by her", "A letter has written her", "She was written a letter"], a: 1 },
    { q: "“I have lived here since 2015” is in the:", opts: ["Simple past", "Present perfect", "Past perfect", "Future perfect"], a: 1 },
    { q: "Pick the correct sentence:", opts: ["He don't know", "He doesn't knows", "He doesn't know", "He not know"], a: 2 },
  ] },
  { id: "Q4", week: "Week 45", subject: "SST", title: "Resources & Development", due: "2026-11-08", mins: 6, qs: [
    { q: "Black soil is best suited for:", opts: ["Rice", "Cotton", "Tea", "Jute"], a: 1 },
    { q: "Which is a renewable resource?", opts: ["Coal", "Petroleum", "Solar energy", "Natural gas"], a: 2 },
  ] },
];

type Uni = { id: string; name: string; body: string; date: string; mode: string; subjects: string; status: "Open" | "Registered" | "Completed"; score?: string };
const UNI_TESTS: Uni[] = [
  { id: "U1", name: "IISc Bangalore — Young Scientist Aptitude Test", body: "Indian Institute of Science", date: "2026-12-12", mode: "Online · 90 min", subjects: "Physics, Chemistry, Maths", status: "Open" },
  { id: "U2", name: "IIT Madras — Foundation Mathematics Olympiad", body: "IIT Madras Outreach", date: "2026-11-28", mode: "Centre-based · 2 hrs", subjects: "Mathematics", status: "Registered" },
  { id: "U3", name: "Bangalore University — Career Aptitude Screening", body: "Bangalore University", date: "2026-12-20", mode: "Online · 60 min", subjects: "Logical reasoning, English", status: "Open" },
  { id: "U4", name: "Azim Premji University — Scholarship Test", body: "Azim Premji University", date: "2026-10-05", mode: "Online · 75 min", subjects: "Maths, English, GK", status: "Completed", score: "78 / 100 · Rank 42" },
];

export function QuizzesTab() {
  const { s, toast } = useStore();
  const [done, setDone] = useState<Record<string, { score: number; total: number }>>({ Q3: { score: 2, total: 3 }, Q4: { score: 2, total: 2 } });
  const [active, setActive] = useState<Quiz | null>(null);
  const [ans, setAns] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);

  if (active) {
    const score = active.qs.filter((q, i) => ans[i] === q.a).length;
    return (
      <Card>
        <button onClick={() => { setActive(null); setSubmitted(false); }} className="mb-3 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"><ArrowLeft size={14} /> Back to quizzes</button>
        <CardHeader title={active.title} sub={`${SUBJECT_NAMES[active.subject]} · ${active.week} · ${active.qs.length} questions`} action={<Badge tone="blue"><Timer size={11} /> {active.mins} min</Badge>} />
        <div className="space-y-5">
          {active.qs.map((q, qi) => (
            <div key={qi}>
              <p className="mb-2 text-sm font-medium text-slate-800">{qi + 1}. {q.q}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {q.opts.map((o, oi) => {
                  const sel = ans[qi] === oi;
                  const state = submitted ? (oi === q.a ? "right" : sel ? "wrong" : "") : sel ? "sel" : "";
                  return <button key={oi} disabled={submitted} onClick={() => setAns(a => { const n = [...a]; n[qi] = oi; return n; })}
                    className={cx("flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition", state === "sel" && "border-brand-600 bg-brand-50 text-brand-800", state === "right" && "border-emerald-400 bg-emerald-50 text-emerald-800", state === "wrong" && "border-red-300 bg-red-50 text-red-700", !state && "border-slate-200 hover:bg-slate-50")}>
                    {state === "right" && <CheckCircle2 size={15} />}{state === "wrong" && <XCircle size={15} />}{o}</button>;
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
          {submitted ? <p className="text-sm font-semibold text-slate-900">Score: {score} / {active.qs.length} <span className="ml-2 font-normal text-slate-500">{score === active.qs.length ? "Perfect! 🎉" : "Review the highlighted answers."}</span></p> : <p className="text-xs text-slate-400">{ans.filter(x => x !== undefined).length} of {active.qs.length} answered</p>}
          {!submitted && <Btn disabled={ans.filter(x => x !== undefined).length < active.qs.length} onClick={() => { setSubmitted(true); setDone(d => ({ ...d, [active.id]: { score, total: active.qs.length } })); toast(`Quiz submitted — ${score}/${active.qs.length}`); }}>Submit quiz</Btn>}
        </div>
      </Card>
    );
  }
  const avg = Object.values(done).length ? Math.round((Object.values(done).reduce((a, d) => a + d.score / d.total, 0) / Object.values(done).length) * 100) : 0;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3 text-center">{[["Pending", QUIZZES.filter(q => !done[q.id]).length], ["Completed", Object.keys(done).length], ["Average", `${avg}%`]].map(([k, v]) => <Card key={k as string} className="!p-3"><p className="text-xl font-semibold text-slate-900">{v}</p><p className="text-xs text-slate-500">{k}</p></Card>)}</div>
      <Card><CardHeader title="Weekly quizzes" sub="New quizzes are published every Monday by subject teachers" />
        <ul className="divide-y divide-slate-100">{QUIZZES.map(q => { const d = done[q.id]; return (
          <li key={q.id} className="flex flex-wrap items-center gap-3 py-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-700">{q.subject}</span>
            <div className="min-w-0 flex-1"><p className="text-sm font-medium text-slate-800">{q.title}</p><p className="text-xs text-slate-500">{q.week} · {q.qs.length} questions · {q.mins} min · due {fmtDate(q.due, false)}</p></div>
            {d ? <Badge tone="green">{d.score}/{d.total}</Badge> : <Badge tone={daysBetween(TODAY, q.due) <= 3 ? "amber" : "slate"}>Due in {daysBetween(TODAY, q.due)}d</Badge>}
            <Btn size="sm" tone={d ? "secondary" : "primary"} onClick={() => { setActive(q); setAns([]); setSubmitted(false); }}>{d ? "Retake" : "Start quiz"}</Btn>
          </li>); })}</ul>
      </Card>
    </div>
  );
}

export function UniversityTab() {
  const { toast } = useStore();
  const [tests, setTests] = useState(UNI_TESTS);
  return (
    <div className="space-y-4">
      <Card><CardHeader title="University tests" sub="External aptitude, olympiad and scholarship tests conducted by partner universities" />
        <div className="space-y-3">{tests.map(t => (
          <div key={t.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><GraduationCap size={20} /></span>
            <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-900">{t.name}</p><p className="text-xs text-slate-500">{t.body} · {t.subjects}</p><p className="mt-1 flex items-center gap-3 text-xs text-slate-500"><span className="flex items-center gap-1"><Clock size={12} />{fmtDate(t.date)}</span><span>{t.mode}</span></p></div>
            {t.status === "Completed" ? <div className="text-right"><Badge tone="green"><Trophy size={11} /> Completed</Badge><p className="mt-1 text-xs font-medium text-slate-700">{t.score}</p></div>
              : t.status === "Registered" ? <div className="text-right"><Badge tone="blue">Registered</Badge><p className="mt-1 text-[11px] text-slate-400">Admit card available 3 days prior</p></div>
              : <Btn size="sm" onClick={() => { setTests(a => a.map(x => x.id === t.id ? { ...x, status: "Registered" } : x)); toast(`Registered for ${t.body} test (simulated)`); }}>Register</Btn>}
          </div>))}</div>
      </Card>
    </div>
  );
}

// ---------------- AI assistant (scripted, front-end only) ----------------
type Msg = { from: "ai" | "me"; text: string };
export function AiAssistant({ studentId }: { studentId: string }) {
  const { s, attPct, teacher } = useStore();
  const st = s.students.find(x => x.id === studentId)!;
  const first = st.name.split(" ")[0];
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { setMsgs([{ from: "ai", text: `Hi ${first}! I'm your school assistant. I can help with homework, your results, attendance, timetable, quizzes and study tips. What would you like to know?` }]); }, [studentId, first]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, typing, open]);

  const answer = (q: string): string => {
    const t = q.toLowerCase();
    const r = examResult(s, "E2", st.id);
    const hw = s.homework.filter(h => h.cls === st.cls && h.section === st.section && h.due >= TODAY);
    if (/homework|assignment|due/.test(t)) return hw.length ? `You have ${hw.length} pending item(s):\n` + hw.map(h => `• ${h.title} (${SUBJECT_NAMES[h.subject]}) — due ${fmtDate(h.due, false)}`).join("\n") : "You're all caught up — no pending homework! 🎉";
    if (/attend|absent|present/.test(t)) { const p = attPct(st.id); return `Your attendance is ${p}%. ${p >= s.school.minAttendance ? "That's above the school minimum of " + s.school.minAttendance + "%. Keep it up!" : "That's below the required " + s.school.minAttendance + "% — please try to attend regularly."}`; }
    if (/result|mark|score|grade|percent|exam/.test(t)) {
      if (!r) return "Your results aren't published yet.";
      const weak = [...r.rows].sort((a, b) => (a.pct ?? 0) - (b.pct ?? 0))[0], best = [...r.rows].sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0))[0];
      return `In the Midterm you scored ${r.total}/${r.max} (${r.pct}%, grade ${r.grade}). Strongest: ${best.name} (${best.pct}%). Needs work: ${weak.name} (${weak.pct}%). Want a study plan for ${weak.name}?`;
    }
    if (/study plan|plan|improve|weak|revis|tips?/.test(t)) {
      const weak = r ? [...r.rows].sort((a, b) => (a.pct ?? 0) - (b.pct ?? 0))[0].name : "your weakest subject";
      return `Here's a 5-day plan for ${weak}:\n1. Mon — revise key concepts (30 min)\n2. Tue — solve 10 textbook problems\n3. Wed — attempt last week's quiz again\n4. Thu — ask your teacher about doubts\n5. Fri — timed practice test (45 min)\nStudy in short 25-minute blocks with 5-minute breaks.`;
    }
    if (/timetable|schedule|period|class today/.test(t)) return "Open the Timetable tab to see your full week. Thursday starts with English at 8:30 AM — I can't edit the timetable, but your class teacher can.";
    if (/quiz/.test(t)) return "Two quizzes are due this week: Quadratic Equations (Maths) and Electricity Basics (Science). Open the Quizzes tab to start — they take about 10 minutes each.";
    if (/universit|olympiad|scholar|aptitude/.test(t)) return "Open the University Tests tab to see upcoming tests. The IIT Madras Maths Olympiad on 28 Nov already has you registered. The IISc Young Scientist test is open for registration.";
    if (/teacher/.test(t)) return `Your class teacher is ${teacher(s.classes.find(c => c.name === st.cls)?.classTeachers[st.section] ?? "")?.name ?? "not assigned yet"}. You can reach them through the school diary or during the Parent-Teacher Meeting on 22 Nov.`;
    if (/hello|hi\b|hey/.test(t)) return `Hello ${first}! Ask me about homework, results, attendance, quizzes or study tips.`;
    return "I'm a prototype assistant, so I only know about homework, results, attendance, timetable, quizzes, university tests and study tips. Try one of those!";
  };
  const send = (raw?: string) => {
    const q = (raw ?? text).trim();
    if (!q || typing) return;
    setMsgs(m => [...m, { from: "me", text: q }]); setText(""); setTyping(true);
    setTimeout(() => { setMsgs(m => [...m, { from: "ai", text: answer(q) }]); setTyping(false); }, 900);
  };

  return (
    <>
      {!open && <button onClick={() => setOpen(true)} className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-brand-700 px-4 py-3 text-sm font-medium text-white shadow-xl hover:bg-brand-800"><Sparkles size={16} /> Ask AI</button>}
      {open && (
        <div className="pop fixed bottom-5 right-5 z-40 flex h-[34rem] max-h-[85vh] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center gap-3 bg-brand-800 px-4 py-3 text-white"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15"><Sparkles size={16} /></span><div className="flex-1 leading-tight"><p className="text-sm font-semibold">School AI Assistant</p><p className="text-[10px] text-white/70">Demo · simulated replies</p></div><button onClick={() => setOpen(false)}><X size={18} /></button></div>
          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
            {msgs.map((m, i) => <div key={i} className={cx("flex", m.from === "me" && "justify-end")}><p className={cx("max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed", m.from === "me" ? "rounded-br-sm bg-brand-700 text-white" : "rounded-bl-sm bg-white text-slate-700 shadow-sm")}>{m.text}</p></div>)}
            {typing && <div className="flex"><p className="rounded-2xl rounded-bl-sm bg-white px-4 py-2.5 shadow-sm"><span className="inline-flex gap-1">{[0, 1, 2].map(i => <span key={i} className="h-1.5 w-1.5 animate-pulse rounded-full bg-slate-400" style={{ animationDelay: `${i * 150}ms` }} />)}</span></p></div>}
            <div ref={end} />
          </div>
          <div className="flex flex-wrap gap-1.5 border-t border-slate-100 bg-white px-3 pt-2">{["My homework", "My results", "Study plan", "Attendance"].map(c => <button key={c} onClick={() => send(c)} className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] text-slate-600 hover:bg-slate-50">{c}</button>)}</div>
          <form onSubmit={e => { e.preventDefault(); send(); }} className="flex gap-2 bg-white p-3"><input value={text} onChange={e => setText(e.target.value)} placeholder="Ask me anything…" className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" /><button className="rounded-lg bg-brand-700 p-2.5 text-white hover:bg-brand-800"><Send size={15} /></button></form>
        </div>
      )}
    </>
  );
}
