"use client";
import React, { useState } from "react";
import { School, Calendar, Layers, Award, CalendarCheck, Wallet, Bell, ShieldCheck, Plus, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { Badge, Btn, Card, CardHeader, Field, Input, Select, Table, Td, Toggle, Tr } from "@/components/ui";
import { cx } from "@/lib/utils";
import { setGradeScale } from "@/lib/utils";
import { go } from "@/lib/router";

const SECTIONS = [
  { id: "profile", label: "School profile", icon: School }, { id: "year", label: "Academic year", icon: Calendar }, { id: "classes", label: "Classes & sections", icon: Layers },
  { id: "grading", label: "Grading system", icon: Award }, { id: "attendance", label: "Attendance", icon: CalendarCheck }, { id: "fees", label: "Fee configuration", icon: Wallet },
  { id: "notifications", label: "Notification preferences", icon: Bell }, { id: "roles", label: "User roles", icon: ShieldCheck },
];

export default function SettingsPage({ sub }: { sub: string }) {
  const { s, up, toast } = useStore();
  const tab = SECTIONS.some(x => x.id === sub) ? sub : "profile";
  const [sc, setSc] = useState({ ...s.school });
  const set = (p: Partial<typeof sc>) => setSc(v => ({ ...v, ...p }));
  const save = (m = "Settings saved") => { up(st => ({ school: { ...st.school, ...sc } })); toast(m); };

  return (
    <div className="space-y-4">
      <div><h1 className="text-xl font-semibold text-slate-900">Settings</h1><p className="text-sm text-slate-500">Configure the school, academic rules and notifications</p></div>
      <div className="grid gap-5 lg:grid-cols-4">
        <Card pad={false} className="h-fit"><nav className="p-2">{SECTIONS.map(x => <button key={x.id} onClick={() => go(`settings/${x.id}`)} className={cx("flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium", tab === x.id ? "bg-brand-50 text-brand-800" : "text-slate-600 hover:bg-slate-50")}><x.icon size={16} />{x.label}</button>)}</nav></Card>
        <div className="lg:col-span-3">
          {tab === "profile" && (
            <Card><CardHeader title="School profile" sub="Shown on report cards, receipts and parent messages" />
              <div className="mb-5 flex items-center gap-4"><span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-800 text-white"><School size={36} /></span><div><Btn size="sm" tone="secondary" onClick={() => toast("Logo upload is a placeholder in the prototype", "warn")}>Upload logo</Btn><p className="mt-1.5 text-xs text-slate-400">PNG or SVG, at least 256×256</p></div></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="School name" className="sm:col-span-2"><Input value={sc.name} onChange={e => set({ name: e.target.value })} /></Field>
                <Field label="Tagline" className="sm:col-span-2"><Input value={sc.tagline} onChange={e => set({ tagline: e.target.value })} /></Field>
                <Field label="Address" className="sm:col-span-2"><Input value={sc.address} onChange={e => set({ address: e.target.value })} /></Field>
                <Field label="Phone"><Input value={sc.phone} onChange={e => set({ phone: e.target.value })} /></Field><Field label="Email"><Input value={sc.email} onChange={e => set({ email: e.target.value })} /></Field>
                <Field label="Website"><Input value={sc.website} onChange={e => set({ website: e.target.value })} /></Field><Field label="Affiliation no."><Input value={sc.affiliation} onChange={e => set({ affiliation: e.target.value })} /></Field>
                <Field label="Principal"><Input value={sc.principal} onChange={e => set({ principal: e.target.value })} /></Field>
              </div>
              <div className="mt-5 flex justify-end"><Btn onClick={() => save("School profile updated")}>Save changes</Btn></div>
            </Card>
          )}
          {tab === "year" && (
            <Card><CardHeader title="Academic year" />
              <div className="grid gap-4 sm:grid-cols-2"><Field label="Current academic year"><Select value={s.academicYear} onChange={e => { up(() => ({ academicYear: e.target.value })); toast("Academic year updated"); }}>{["2026-27", "2025-26", "2024-25"].map(y => <option key={y}>{y}</option>)}</Select></Field><Field label="Session start"><Input type="date" defaultValue="2026-04-01" /></Field><Field label="Session end"><Input type="date" defaultValue="2027-03-31" /></Field><Field label="Terms"><Select defaultValue="2"><option value="2">Two terms</option><option value="3">Three terms</option></Select></Field></div>
              <p className="mb-2 mt-5 text-xs font-medium text-slate-600">Term schedule</p>
              <Table head={["Term", "Starts", "Ends"]}><Tr><Td>Term 1</Td><Td>1 Apr 2026</Td><Td>30 Sep 2026</Td></Tr><Tr><Td>Term 2</Td><Td>1 Oct 2026</Td><Td>31 Mar 2027</Td></Tr></Table>
              <div className="mt-5 flex justify-end"><Btn onClick={() => toast("Academic year settings saved")}>Save</Btn></div>
            </Card>
          )}
          {tab === "classes" && (
            <Card><CardHeader title="Classes & sections" sub="Manage sections for each class" action={<Btn size="sm" tone="soft" onClick={() => go("academics/classes")}>Open class management</Btn>} />
              <div className="space-y-2">{s.classes.map(c => (
                <div key={c.id} className="flex items-center gap-3 rounded-lg border border-slate-100 px-4 py-2.5"><span className="w-24 text-sm font-medium text-slate-800">{c.name}</span><div className="flex flex-1 flex-wrap gap-1.5">{c.sections.map(x => <span key={x} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">{x}<button onClick={() => { if (c.sections.length > 1) up(st => ({ classes: st.classes.map(y => y.id === c.id ? { ...y, sections: y.sections.filter(z => z !== x) } : y) })); else toast("A class needs at least one section", "err"); }}><X size={11} /></button></span>)}</div>
                  <Btn size="sm" tone="ghost" icon={<Plus size={13} />} onClick={() => { const n = String.fromCharCode(65 + c.sections.length); up(st => ({ classes: st.classes.map(y => y.id === c.id ? { ...y, sections: [...y.sections, n] } : y) })); toast(`Section ${n} added to ${c.name}`); }}>Section</Btn></div>
              ))}</div>
            </Card>
          )}
          {tab === "grading" && (
            <Card><CardHeader title="Grading system" sub="Marks are converted to grades using these bands (applies instantly across marks, report cards and analytics)" />
              <Table head={["Grade", "Minimum percentage", "Description"]}>{s.grading.map((g, i) => <Tr key={g.grade}><Td><Badge tone={g.grade.startsWith("A") ? "green" : g.grade.startsWith("B") ? "blue" : g.grade.startsWith("C") ? "amber" : "red"}>{g.grade}</Badge></Td><Td>{i === s.grading.length - 1 ? <span className="text-slate-400">0</span> : <Input type="number" min={0} max={100} className="!w-24" value={g.min} onChange={e => { const next = s.grading.map((x, j) => j === i ? { ...x, min: Math.max(0, Math.min(100, +e.target.value)) } : x); setGradeScale(next); up(() => ({ grading: next })); }} />}</Td><Td className="text-xs text-slate-500">{["Outstanding", "Excellent", "Very good", "Good", "Satisfactory", "Fair", "Needs improvement", "Fail"][i]}</Td></Tr>)}</Table>
              <div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Passing percentage"><Input type="number" value={sc.passPercent} onChange={e => set({ passPercent: +e.target.value })} /></Field></div>
              <div className="mt-5 flex justify-end"><Btn onClick={() => save("Grading system saved")}>Save</Btn></div>
            </Card>
          )}
          {tab === "attendance" && (
            <Card><CardHeader title="Attendance configuration" />
              <div className="grid gap-4 sm:grid-cols-2"><Field label="Minimum attendance required (%)" hint="Students below this are flagged"><Input type="number" value={sc.minAttendance} onChange={e => set({ minAttendance: +e.target.value })} /></Field><Field label="Mark as late after"><Input type="time" value={sc.lateAfter} onChange={e => set({ lateAfter: e.target.value })} /></Field><Field label="Working days"><Select defaultValue="6"><option value="6">Monday – Saturday</option><option value="5">Monday – Friday</option></Select></Field><Field label="Auto-notify parents of absence"><Select defaultValue="yes"><option value="yes">Yes — after attendance is saved</option><option value="no">No</option></Select></Field></div>
              <div className="mt-5 flex justify-end"><Btn onClick={() => save("Attendance rules saved")}>Save</Btn></div>
            </Card>
          )}
          {tab === "fees" && (
            <Card><CardHeader title="Fee configuration" />
              <div className="grid gap-4 sm:grid-cols-2"><Field label="Currency"><Input value="Indian Rupee (₹)" disabled /></Field><Field label="Late fee per day (₹)"><Input type="number" value={sc.lateFee} onChange={e => set({ lateFee: +e.target.value })} /></Field><Field label="Grace period (days)"><Input type="number" value={sc.graceDays} onChange={e => set({ graceDays: +e.target.value })} /></Field><Field label="Receipt prefix"><Input defaultValue="RCT-2026-" /></Field></div>
              <div className="mt-5 flex justify-end"><Btn onClick={() => save("Fee configuration saved")}>Save</Btn></div>
            </Card>
          )}
          {tab === "notifications" && (
            <Card><CardHeader title="Notification preferences" />
              <div className="divide-y divide-slate-100">{Object.entries(s.school.notif).map(([k, v]) => <div key={k} className="flex items-center justify-between py-3.5"><span className="text-sm text-slate-700">{k}</span><Toggle on={v} onChange={x => { up(st => ({ school: { ...st.school, notif: { ...st.school.notif, [k]: x } } })); toast(`${k}: ${x ? "on" : "off"}`); }} /></div>)}</div>
            </Card>
          )}
          {tab === "roles" && (
            <Card pad={false}><div className="p-5 pb-3"><CardHeader title="User roles & permissions" sub="Visual demonstration — no real authentication in the prototype" /></div>
              <Table head={["Role", "Users", "Students", "Academics", "Fees", "Communication", "Settings"]}>
                {[["Administrator", 3, "Full", "Full", "Full", "Full", "Full"], ["Principal", 1, "Full", "Full", "View", "Full", "View"], ["Teacher", 86, "Class only", "Edit", "—", "Class only", "—"], ["Accountant", 4, "View", "—", "Full", "Fee reminders", "—"], ["Parent", "1,086", "Own child", "View", "Pay / view", "Receive", "—"], ["Student", "1,248", "Own", "View", "—", "Receive", "—"]].map(r => <Tr key={r[0] as string}>{r.map((c, i) => <Td key={i} className={i === 0 ? "font-medium text-slate-900" : ""}>{i > 1 ? <Badge tone={c === "Full" ? "green" : c === "—" ? "slate" : "blue"}>{c}</Badge> : c}</Td>)}</Tr>)}
              </Table>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
