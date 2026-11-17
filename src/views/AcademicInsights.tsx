"use client";
import React, { useMemo, useState } from "react";
import { AlertTriangle, BookOpen, GraduationCap, Layers, Percent, ShieldAlert, Trophy, TrendingDown } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { useStore } from "@/lib/store";
import { Avatar, Badge, Btn, Card, CardHeader, CHART, Progress, Select, Stat, Table, Td, Tr } from "@/components/ui";
import { CORE, DASH, SUBJECT_NAMES } from "@/lib/data";
import { attentionList, classAverages, examResult, subjectAverages } from "@/lib/academic";
import { href } from "@/lib/router";
import { cx } from "@/lib/utils";

const tt = { contentStyle: { borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 } };
const INTERVENTIONS = ["Not started", "Parent informed", "Counselling scheduled", "Remedial classes", "Under monitoring", "Resolved"];

export function AttentionTable({ limit }: { limit?: number }) {
  const { s, up, toast, parentOf, addNotifications } = useStore();
  const list = attentionList(s).slice(0, limit ?? 99);
  return (
    <Card pad={false}>
      <div className="flex items-center justify-between p-5 pb-3">
        <CardHeader title="Students requiring attention" sub="Significant decline between Unit Test 1 and Midterm (≥20 points) or failing performance" action={<Badge tone="red"><AlertTriangle size={11} /> {attentionList(s).length} flagged</Badge>} />
      </div>
      <Table head={["Student", "Class", "Subject", "Previous", "Current", "Change", "Intervention status", ""]}>
        {list.map(a => {
          const st = s.students.find(x => x.id === a.studentId)!;
          const key = `${a.studentId}|${a.code}`;
          const status = s.interventions[key] ?? "Not started";
          return (
            <Tr key={key}>
              <Td><a href={href(`students/${st.id}`)} className="flex items-center gap-2 font-medium text-slate-900 hover:text-brand-700"><Avatar name={st.name} size={26} />{st.name}</a></Td>
              <Td className="text-xs">{st.cls}-{st.section}</Td>
              <Td>{SUBJECT_NAMES[a.code]}</Td>
              <Td>{Math.round(a.prev)}</Td>
              <Td><span className="font-semibold text-red-600">{Math.round(a.cur)}</span></Td>
              <Td><span className="inline-flex items-center gap-1 text-xs font-medium text-red-600"><TrendingDown size={13} /> {Math.round(a.drop)} pts</span></Td>
              <Td>
                <select value={status} onChange={e => { up(x => ({ interventions: { ...x.interventions, [key]: e.target.value } })); toast(`Intervention for ${st.name.split(" ")[0]}: ${e.target.value}`); }} className={cx("rounded-lg border px-2 py-1 text-xs font-medium focus:outline-none", status === "Resolved" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : status === "Not started" ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-800")}>
                  {INTERVENTIONS.map(i => <option key={i}>{i}</option>)}
                </select>
              </Td>
              <Td><Btn size="sm" tone="soft" onClick={() => { const p = parentOf(st.parentId); if (p) { addNotifications([{ parentName: p.name, studentName: st.name, cls: `${st.cls}-${st.section}`, type: "General Announcement", channel: "SMS", date: "2026-11-12", status: "Delivered" }]); up(x => ({ interventions: { ...x.interventions, [key]: status === "Not started" ? "Parent informed" : status } })); toast(`Parent of ${st.name} informed (simulated)`); } }}>Notify parent</Btn></Td>
            </Tr>
          );
        })}
      </Table>
    </Card>
  );
}

export function AcademicOverview() {
  const { s } = useStore();
  const ca = classAverages(s, "E2");
  const sa = subjectAverages(s, "E2");
  const results = s.students.map(x => examResult(s, "E2", x.id)).filter(Boolean) as NonNullable<ReturnType<typeof examResult>>[];
  const passRate = Math.round((results.filter(r => r.pass).length / results.length) * 100);
  const avg = Math.round((results.reduce((a, r) => a + r.pct, 0) / results.length) * 10) / 10;
  const coverage: Record<string, number> = { ENG: 68, HIN: 62, MAT: 71, SCI: 64, SST: 58, CS: 76 };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <Stat label="Total Classes" value={String(s.classes.length)} icon={<Layers size={17} />} sub="Nursery – Grade 12" />
        <Stat label="Total Sections" value={String(s.classes.reduce((a, c) => a + c.sections.length, 0))} icon={<GraduationCap size={17} />} tone="violet" />
        <Stat label="Total Subjects" value={String(s.subjects.length)} icon={<BookOpen size={17} />} sub={`${s.subjects.filter(x => x.type === "Optional").length} optional`} />
        <Stat label="Avg. Midterm Score" value={`${avg}%`} icon={<Percent size={17} />} tone="green" trend={{ v: "2.4%", up: true }} sub="vs UT1" />
        <Stat label="Pass Percentage" value={`${passRate}%`} icon={<Trophy size={17} />} tone="green" />
        <Stat label="Need Attention" value={String(attentionList(s).length)} icon={<ShieldAlert size={17} />} tone="red" sub="students flagged" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Subject-wise performance" sub="Average % in Midterm (sample students)" />
          <div className="h-60"><ResponsiveContainer><BarChart data={sa}><CartesianGrid stroke={CHART.grid} vertical={false} /><XAxis dataKey="code" tickLine={false} axisLine={false} /><YAxis domain={[0, 100]} tickLine={false} axisLine={false} /><Tooltip {...tt} formatter={(v) => `${v}%`} labelFormatter={l => SUBJECT_NAMES[String(l)]} /><Bar dataKey="avg" name="Average" fill={CHART.navy} radius={[4, 4, 0, 0]} barSize={26} /></BarChart></ResponsiveContainer></div>
        </Card>
        <Card>
          <CardHeader title="Class-wise average marks" sub="Midterm Examination" />
          <div className="h-60"><ResponsiveContainer><BarChart data={ca.map(c => ({ ...c, cls: c.cls.replace("Grade ", "G") }))}><CartesianGrid stroke={CHART.grid} vertical={false} /><XAxis dataKey="cls" tickLine={false} axisLine={false} /><YAxis domain={[0, 100]} tickLine={false} axisLine={false} /><Tooltip {...tt} formatter={(v) => `${v}%`} /><Bar dataKey="avg" name="Average" fill={CHART.blue} radius={[4, 4, 0, 0]} barSize={26} /></BarChart></ResponsiveContainer></div>
        </Card>
        <Card>
          <CardHeader title="Examination performance trend" sub="School average %" />
          <div className="h-60"><ResponsiveContainer><LineChart data={DASH.trend.map(t => ({ ...t, cur: t.cur || null }))}><CartesianGrid stroke={CHART.grid} vertical={false} /><XAxis dataKey="exam" tickLine={false} axisLine={false} fontSize={11} /><YAxis domain={[55, 80]} tickLine={false} axisLine={false} /><Tooltip {...tt} /><Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} /><Line dataKey="prev" name="2025-26" stroke={CHART.light} strokeWidth={2} dot={false} /><Line dataKey="cur" name="2026-27" stroke={CHART.navy} strokeWidth={2.5} dot={{ r: 4 }} connectNulls /></LineChart></ResponsiveContainer></div>
        </Card>
      </div>
      <Card>
        <CardHeader title="Academic progress overview" sub="Syllabus coverage vs. term plan (Grade 10)" />
        <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {CORE.map(c => (
            <div key={c}><div className="mb-1 flex justify-between text-sm"><span className="font-medium text-slate-700">{SUBJECT_NAMES[c]}</span><span className="text-slate-500">{coverage[c]}% <span className="text-slate-400">/ target 65%</span></span></div><Progress value={coverage[c]} tone={coverage[c] >= 65 ? "green" : "amber"} /></div>
          ))}
        </div>
      </Card>
      <AttentionTable limit={6} />
    </div>
  );
}

export function AcademicAnalytics() {
  const { s, attPct } = useStore();
  const [examId, setExamId] = useState("E2");
  const [cls, setCls] = useState("All");
  const inScope = s.students.filter(x => cls === "All" || x.cls === cls);
  const rows = inScope.map(x => ({ st: x, r: examResult(s, examId, x.id), r1: examResult(s, "E1", x.id) })).filter(x => x.r);
  const ca = classAverages(s, examId);
  const sa = subjectAverages(s, examId, cls === "All" ? undefined : cls);
  const sa1 = subjectAverages(s, "E1", cls === "All" ? undefined : cls);
  const top = [...rows].sort((a, b) => b.r!.pct - a.r!.pct).slice(0, 10);
  const decl = rows.filter(x => x.r1).map(x => ({ ...x, d: x.r1!.pct - x.r!.pct })).filter(x => x.d > 0).sort((a, b) => b.d - a.d).slice(0, 6);
  const pass = rows.filter(x => x.r!.pass).length;
  const classes = Array.from(new Set(s.students.map(x => x.cls)));
  const scatter = rows.map(x => ({ name: x.st.name, att: attPct(x.st.id), score: x.r!.pct }));
  const cmp = sa.map((x, i) => ({ subject: x.code, "Unit Test 1": sa1[i].avg, Midterm: x.avg }));

  return (
    <div className="space-y-4">
      <Card className="!p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-slate-700">Analyse</span>
          <Select className="!w-56" value={examId} onChange={e => setExamId(e.target.value)}>{s.exams.filter(e => s.marks[e.id] && Object.keys(s.marks[e.id]).length).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</Select>
          <Select className="!w-40" value={cls} onChange={e => setCls(e.target.value)}><option>All</option>{classes.map(c => <option key={c}>{c}</option>)}</Select>
          <span className="ml-auto text-xs text-slate-400">{rows.length} students in scope</span>
        </div>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader title="Class-wise average performance" /><div className="h-64"><ResponsiveContainer><BarChart data={ca.map(c => ({ ...c, cls: c.cls.replace("Grade ", "G") }))}><CartesianGrid stroke={CHART.grid} vertical={false} /><XAxis dataKey="cls" tickLine={false} axisLine={false} /><YAxis domain={[0, 100]} tickLine={false} axisLine={false} /><Tooltip {...tt} formatter={(v) => `${v}%`} /><Bar dataKey="avg" name="Avg %" radius={[4, 4, 0, 0]} barSize={28}>{ca.map((c, i) => <Cell key={i} fill={c.avg < 65 ? CHART.amber : CHART.navy} />)}</Bar></BarChart></ResponsiveContainer></div></Card>
        <Card><CardHeader title="Subject-wise performance" sub="Average % per subject" /><div className="h-64"><ResponsiveContainer><BarChart data={sa} layout="vertical" margin={{ left: 20 }}><CartesianGrid stroke={CHART.grid} horizontal={false} /><XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} /><YAxis type="category" dataKey="subject" tickLine={false} axisLine={false} width={95} /><Tooltip {...tt} formatter={(v) => `${v}%`} /><Bar dataKey="avg" name="Avg %" fill={CHART.blue} radius={[0, 4, 4, 0]} barSize={16} /></BarChart></ResponsiveContainer></div></Card>
        <Card pad={false}>
          <div className="p-5 pb-2"><CardHeader title="Top 10 students" sub="By overall percentage" /></div>
          <ol className="divide-y divide-slate-100">
            {top.map((x, i) => (
              <li key={x.st.id} className="flex items-center gap-3 px-5 py-2"><span className={cx("flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold", i < 3 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500")}>{i + 1}</span><Avatar name={x.st.name} size={26} /><a href={href(`students/${x.st.id}`)} className="flex-1 truncate text-sm font-medium text-slate-800 hover:text-brand-700">{x.st.name}<span className="ml-2 text-xs font-normal text-slate-400">{x.st.cls}-{x.st.section}</span></a><div className="w-24"><Progress value={x.r!.pct} tone="green" /></div><span className="w-12 text-right text-sm font-semibold">{x.r!.pct}%</span></li>
            ))}
          </ol>
        </Card>
        <Card pad={false}>
          <div className="p-5 pb-2"><CardHeader title="Students with declining performance" sub="Overall % change from Unit Test 1" /></div>
          {examId !== "E2" ? <p className="px-5 pb-6 text-sm text-slate-400">Select Midterm Examination to compare against Unit Test 1.</p> : (
            <ul className="divide-y divide-slate-100">
              {decl.map(x => <li key={x.st.id} className="flex items-center gap-3 px-5 py-2.5"><Avatar name={x.st.name} size={26} /><span className="flex-1 truncate text-sm font-medium text-slate-800">{x.st.name}<span className="ml-2 text-xs font-normal text-slate-400">{x.st.cls}-{x.st.section}</span></span><span className="text-xs text-slate-500">{x.r1!.pct}% → {x.r!.pct}%</span><Badge tone="red">▼ {x.d.toFixed(1)}</Badge></li>)}
            </ul>
          )}
        </Card>
        <Card>
          <CardHeader title="Pass / fail percentage" />
          <div className="flex items-center gap-6">
            <div className="h-44 w-44"><ResponsiveContainer><PieChart><Pie data={[{ name: "Pass", value: pass }, { name: "Fail", value: rows.length - pass }]} dataKey="value" innerRadius={48} outerRadius={72} stroke="none"><Cell fill={CHART.navy} /><Cell fill={CHART.red} /></Pie><Tooltip {...tt} /></PieChart></ResponsiveContainer></div>
            <div className="space-y-3 text-sm"><div><p className="text-3xl font-semibold text-slate-900">{rows.length ? Math.round((pass / rows.length) * 100) : 0}%</p><p className="text-slate-500">overall pass rate</p></div><p className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART.navy }} /> Passed: {pass}</p><p className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART.red }} /> Failed: {rows.length - pass}</p></div>
          </div>
        </Card>
        <Card>
          <CardHeader title="Examination comparison" sub="Unit Test 1 vs Midterm, average % by subject" />
          <div className="h-52"><ResponsiveContainer><BarChart data={cmp}><CartesianGrid stroke={CHART.grid} vertical={false} /><XAxis dataKey="subject" tickLine={false} axisLine={false} /><YAxis domain={[0, 100]} tickLine={false} axisLine={false} /><Tooltip {...tt} /><Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} /><Bar dataKey="Unit Test 1" fill={CHART.light} radius={[3, 3, 0, 0]} /><Bar dataKey="Midterm" fill={CHART.navy} radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Attendance versus academic performance" sub="Each dot is a student — higher attendance correlates with better scores" />
          <div className="h-72"><ResponsiveContainer><ScatterChart margin={{ left: 0, right: 10 }}><CartesianGrid stroke={CHART.grid} /><XAxis type="number" dataKey="att" name="Attendance" unit="%" domain={[60, 100]} tickLine={false} /><YAxis type="number" dataKey="score" name="Score" unit="%" domain={[20, 100]} tickLine={false} /><ZAxis range={[60, 60]} /><Tooltip {...tt} cursor={{ strokeDasharray: "3 3" }} formatter={(v, n) => [`${v}%`, n]} labelFormatter={() => ""} /><Scatter data={scatter} fill={CHART.navy} fillOpacity={0.75} /></ScatterChart></ResponsiveContainer></div>
        </Card>
      </div>
      <AttentionTable />
    </div>
  );
}
