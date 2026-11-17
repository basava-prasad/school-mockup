"use client";
import React from "react";
import { Users, UserSquare2, School, CalendarCheck, Wallet, AlertCircle, ArrowRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useStore } from "@/lib/store";
import { Badge, Card, CardHeader, CHART, Stat, statusTone, Avatar, Btn } from "@/components/ui";
import { ACTIVITIES, DASH, TASKS, seedEvents } from "@/lib/data";
import { fmtDate, money, num } from "@/lib/utils";
import { go, href } from "@/lib/router";
import { attentionList, classAverages } from "@/lib/academic";

const tt = { contentStyle: { borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,.06)" } };

export default function Dashboard() {
  const { s } = useStore();
  const d = DASH;
  const events = seedEvents();
  const classAvg = classAverages(s, "E2").filter(c => ["Grade 6", "Grade 8", "Grade 9", "Grade 10"].includes(c.cls));
  const attention = attentionList(s).length;
  const recent = [...s.admissions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const upcoming = s.exams.filter(e => e.status === "Scheduled").slice(0, 4);
  const pie = [{ name: "Present", value: 94.5 }, { name: "Late", value: 3.2 }, { name: "Absent", value: 2.3 }];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Good morning, {s.school.principal.split(" ")[1]} 👋</h1>
          <p className="mt-0.5 text-sm text-slate-500">Here’s what’s happening at {s.school.name} today — Thursday, 12 November 2026.</p>
        </div>
        <div className="flex gap-2">
          <Btn tone="secondary" onClick={() => go("attendance")}>Mark attendance</Btn>
          <Btn onClick={() => go("communication")}>Send announcement</Btn>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <Stat label="Total Students" value={num(d.totals.students)} icon={<Users size={18} />} trend={{ v: "1.8%", up: true }} sub="vs last year" />
        <Stat label="Total Teachers" value={num(d.totals.teachers)} icon={<UserSquare2 size={18} />} tone="violet" sub="Student:teacher 14.5" />
        <Stat label="Total Classes" value={num(d.totals.classes)} icon={<School size={18} />} tone="blue" sub="15 grades · 32 sections" />
        <Stat label="Today's Attendance" value="94.5%" icon={<CalendarCheck size={18} />} tone="green" trend={{ v: "0.6%", up: true }} sub="vs yesterday" />
        <Stat label="Fee Collection" value={money(d.collectedFees)} icon={<Wallet size={18} />} tone="green" sub="83% of expected" />
        <Stat label="Outstanding Dues" value={money(d.outstanding)} icon={<AlertCircle size={18} />} tone="red" sub="Across 214 students" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Monthly fee collection" sub="Collected vs expected, 2026-27 (₹)" action={<button onClick={() => go("fees")} className="text-xs font-medium text-brand-600 hover:underline">View fee module →</button>} />
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={d.feeMonthly} barGap={4}>
                <CartesianGrid stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={v => `${v / 100000}L`} />
                <Tooltip {...tt} formatter={(v) => money(Number(v))} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="expected" name="Expected" fill={CHART.light} radius={[4, 4, 0, 0]} />
                <Bar dataKey="collected" name="Collected" fill={CHART.navy} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHeader title="Today’s attendance" sub="School-wide, 12 Nov" />
          <div className="relative h-44">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pie} dataKey="value" innerRadius={55} outerRadius={78} paddingAngle={2} stroke="none">
                  {[CHART.navy, CHART.amber, CHART.red].map((c, i) => <Cell key={i} fill={c} />)}
                </Pie>
                <Tooltip {...tt} formatter={(v) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-2xl font-semibold text-slate-900">94.5%</span><span className="text-[11px] text-slate-400">present</span></div>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
            {[["Present", "1,179", CHART.navy], ["Late", "40", CHART.amber], ["Absent", "29", CHART.red]].map(([l, v, c]) => (
              <div key={l} className="rounded-lg bg-slate-50 py-2"><p className="font-semibold text-slate-800">{v}</p><p className="flex items-center justify-center gap-1 text-slate-500"><span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />{l}</p></div>
            ))}
          </div>
          <div className="mt-3 h-24">
            <ResponsiveContainer>
              <AreaChart data={d.attendanceWeek}>
                <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CHART.navy} stopOpacity={0.18} /><stop offset="100%" stopColor={CHART.navy} stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis hide domain={[90, 97]} />
                <Tooltip {...tt} formatter={(v) => `${v}%`} />
                <Area dataKey="rate" stroke={CHART.navy} fill="url(#ag)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Student enrollment" sub="Total students by academic year" />
          <div className="h-56">
            <ResponsiveContainer>
              <AreaChart data={d.enrollment}>
                <defs><linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CHART.blue} stopOpacity={0.25} /><stop offset="100%" stopColor={CHART.blue} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="year" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis domain={[1000, 1300]} tickLine={false} axisLine={false} />
                <Tooltip {...tt} />
                <Area dataKey="students" stroke={CHART.navy} strokeWidth={2} fill="url(#eg)" dot={{ r: 3, fill: CHART.navy }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHeader title="Academic performance" sub="Class average % in Midterm" action={<button onClick={() => go("academics/analytics")} className="text-xs font-medium text-brand-600 hover:underline">Analytics →</button>} />
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={classAvg} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid stroke={CHART.grid} horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="cls" tickLine={false} axisLine={false} width={64} />
                <Tooltip {...tt} formatter={(v) => `${v}%`} />
                <Bar dataKey="avg" name="Average" fill={CHART.navy} radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHeader title="Examination trend" sub="School average %, this year vs last year" />
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart data={d.trend.map(t => ({ ...t, cur: t.cur || null }))}>
                <CartesianGrid stroke={CHART.grid} vertical={false} />
                <XAxis dataKey="exam" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis domain={[55, 80]} tickLine={false} axisLine={false} />
                <Tooltip {...tt} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Line dataKey="prev" name="2025-26" stroke={CHART.light} strokeWidth={2} dot={false} />
                <Line dataKey="cur" name="2026-27" stroke={CHART.navy} strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card pad={false} className="lg:col-span-2">
          <div className="flex items-center justify-between px-5 pt-5"><CardHeader title="Recent admissions" sub="Latest applications received" /><a href={href("admissions")} className="mb-4 text-xs font-medium text-brand-600 hover:underline">View all →</a></div>
          <div className="divide-y divide-slate-100">
            {recent.map(a => (
              <div key={a.id} className="flex items-center gap-3 px-5 py-2.5">
                <Avatar name={a.applicant} />
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-800">{a.applicant}</p><p className="text-xs text-slate-500">Applying for {a.applyingFor} · {a.id}</p></div>
                <span className="hidden text-xs text-slate-400 sm:block">{fmtDate(a.date)}</span>
                <Badge tone={statusTone(a.status)}>{a.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Pending administrative tasks" action={<Badge tone="amber">{TASKS.length} open</Badge>} />
          <ul className="space-y-2.5">
            {TASKS.map((t, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-slate-300" />{t}
              </li>
            ))}
          </ul>
          <button onClick={() => go("academics/analytics")} className="mt-4 flex w-full items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-left text-sm text-red-700 hover:bg-red-100">
            <AlertTriangle size={16} /> {attention} students flagged for academic attention <ArrowRight size={14} className="ml-auto" />
          </button>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Recent activities" />
          <div className="space-y-4">
            {ACTIVITIES.map((a, i) => (
              <div key={i} className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-400" />
                <div><p className="text-[13px] text-slate-700"><span className="font-medium text-slate-900">{a.who}</span> {a.what}</p><p className="text-[11px] text-slate-400">{a.when}</p></div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Upcoming examinations" action={<button onClick={() => go("examinations")} className="text-xs font-medium text-brand-600 hover:underline">All exams →</button>} />
          <div className="space-y-3">
            {upcoming.map(e => (
              <div key={e.id} className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-50 text-brand-700"><span className="text-[10px] font-semibold uppercase">{new Date(e.startDate).toLocaleString("en", { month: "short" })}</span><span className="text-base font-semibold leading-none">{new Date(e.startDate).getDate()}</span></div>
                <div className="min-w-0"><p className="truncate text-sm font-medium text-slate-800">{e.name}</p><p className="text-xs text-slate-500">{fmtDate(e.startDate, false)} – {fmtDate(e.endDate, false)} · {e.classes.length} classes</p></div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Upcoming school events" />
          <div className="space-y-3">
            {events.slice(0, 5).map((e, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-14 shrink-0 text-xs font-medium text-slate-500">{fmtDate(e.date, false)}</div>
                <p className="flex-1 text-sm text-slate-800">{e.title}</p>
                <Badge tone={e.kind === "Exam" ? "blue" : e.kind === "Holiday" ? "amber" : "slate"}>{e.kind}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
