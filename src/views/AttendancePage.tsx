"use client";
import React, { useMemo, useState } from "react";
import { CalendarCheck, UserCheck, UserX, Clock, Bell, CheckCheck } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { useStore } from "@/lib/store";
import { Avatar, Badge, Btn, Card, CardHeader, CHART, Empty, Stat, Table, Tabs, Td, Tr } from "@/components/ui";
import { TODAY, fmtDate } from "@/lib/utils";
import { AttendanceMarking } from "./AcademicsPanels";
import { schoolDays } from "@/lib/data";
import { href } from "@/lib/router";

export default function AttendancePage() {
  const [tab, setTab] = useState("dash");
  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-semibold text-slate-900">Attendance</h1><p className="text-sm text-slate-500">Daily attendance dashboard, absentee follow-ups and class registers</p></div>
      <Tabs value={tab} onChange={setTab} tabs={[{ id: "dash", label: "Dashboard" }, { id: "mark", label: "Mark attendance" }]} />
      {tab === "dash" ? <Dash /> : <AttendanceMarking />}
    </div>
  );
}

function Dash() {
  const { s, parentOf, addNotifications, toast } = useStore();
  const today = s.attendance[TODAY] ?? {};
  const vals = Object.entries(today);
  const P = vals.filter(([, v]) => v === "P").length, A = vals.filter(([, v]) => v === "A").length, L = vals.filter(([, v]) => v === "L").length;
  const pct = vals.length ? Math.round(((P + L) / vals.length) * 1000) / 10 : 0;
  const byClass = useMemo(() => {
    const m: Record<string, { p: number; n: number }> = {};
    s.students.forEach(x => { const k = `${x.cls}-${x.section}`; const v = today[x.id]; if (!v) return; m[k] ??= { p: 0, n: 0 }; m[k].n++; if (v !== "A") m[k].p++; });
    return Object.entries(m).map(([k, v]) => ({ cls: k.replace("Grade ", "G"), rate: Math.round((v.p / v.n) * 1000) / 10 })).sort((a, b) => a.rate - b.rate);
  }, [s.students, today]);
  const trend = schoolDays(30).map(d => { const r = Object.values(s.attendance[d] ?? {}); const p = r.filter(v => v !== "A").length; return { d: fmtDate(d, false), rate: r.length ? Math.round((p / r.length) * 1000) / 10 : 0 }; });
  const absent = s.students.filter(x => today[x.id] === "A");
  const notified = (sid: string) => { const st = s.students.find(x => x.id === sid)!; return s.notifications.some(n => n.type === "Attendance Alert" && n.studentName === st.name && n.date === TODAY); };

  const notify = (sid: string) => {
    const st = s.students.find(x => x.id === sid)!, p = parentOf(st.parentId)!;
    addNotifications([{ parentName: p.name, studentName: st.name, cls: `${st.cls}-${st.section}`, type: "Attendance Alert", channel: "SMS", date: TODAY, status: "Delivered" }]);
    toast(`Absence alert sent to ${p.name} (simulated)`);
  };
  const notifyAll = () => {
    const todo = absent.filter(x => !notified(x.id));
    if (!todo.length) return toast("All parents already notified", "warn");
    addNotifications(todo.map(st => ({ parentName: parentOf(st.parentId)!.name, studentName: st.name, cls: `${st.cls}-${st.section}`, type: "Attendance Alert", channel: "SMS", date: TODAY, status: "Delivered" as const })));
    toast(`${todo.length} absence alerts sent (simulated)`);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Overall attendance" value={`${pct}%`} icon={<CalendarCheck size={17} />} tone="blue" sub={fmtDate(TODAY)} />
        <Stat label="Present students" value={String(P)} icon={<UserCheck size={17} />} tone="green" sub={`of ${vals.length} in sample`} />
        <Stat label="Absent students" value={String(A)} icon={<UserX size={17} />} tone="red" />
        <Stat label="Late students" value={String(L)} icon={<Clock size={17} />} tone="amber" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader title="Class-wise attendance" sub="Today, by section" />
          <div className="h-64"><ResponsiveContainer><BarChart data={byClass}><CartesianGrid stroke={CHART.grid} vertical={false} /><XAxis dataKey="cls" tickLine={false} axisLine={false} fontSize={11} /><YAxis domain={[60, 100]} tickLine={false} axisLine={false} /><Tooltip formatter={(v) => `${v}%`} /><Bar dataKey="rate" name="Attendance" radius={[4, 4, 0, 0]} barSize={26}>{byClass.map((c, i) => <Cell key={i} fill={c.rate < 85 ? CHART.amber : CHART.navy} />)}</Bar></BarChart></ResponsiveContainer></div></Card>
        <Card><CardHeader title="Monthly attendance trend" sub="Last 30 school days, sample students" />
          <div className="h-64"><ResponsiveContainer><AreaChart data={trend}><defs><linearGradient id="at" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={CHART.navy} stopOpacity={0.2} /><stop offset="100%" stopColor={CHART.navy} stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke={CHART.grid} vertical={false} /><XAxis dataKey="d" tickLine={false} axisLine={false} fontSize={10} interval={4} /><YAxis domain={[80, 100]} tickLine={false} axisLine={false} /><Tooltip formatter={(v) => `${v}%`} /><Area dataKey="rate" name="Attendance" stroke={CHART.navy} strokeWidth={2} fill="url(#at)" /></AreaChart></ResponsiveContainer></div></Card>
      </div>
      <Card pad={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-3"><CardHeader title="Absent students today" sub="With simulated parent notification status" /><Btn icon={<Bell size={14} />} onClick={notifyAll}>Notify all parents</Btn></div>
        {absent.length === 0 ? <Empty text="No absentees today 🎉" /> : (
          <Table head={["Student", "Class", "Parent", "Contact", "Notification", { label: "Action", right: true }]}>
            {absent.map(x => { const p = parentOf(x.parentId); const done = notified(x.id); return (
              <Tr key={x.id}>
                <Td><a href={href(`students/${x.id}`)} className="flex items-center gap-2 font-medium text-slate-900 hover:text-brand-700"><Avatar name={x.name} size={26} />{x.name}</a></Td>
                <Td>{x.cls}-{x.section}</Td><Td>{p?.name}</Td><Td className="text-xs">{p?.phone}</Td>
                <Td>{done ? <Badge tone="green"><CheckCheck size={11} /> SMS delivered</Badge> : <Badge tone="amber">Not notified</Badge>}</Td>
                <Td right><Btn size="sm" tone={done ? "ghost" : "soft"} disabled={done} onClick={() => notify(x.id)}>{done ? "Sent" : "Send alert"}</Btn></Td>
              </Tr>); })}
          </Table>
        )}
      </Card>
    </div>
  );
}
