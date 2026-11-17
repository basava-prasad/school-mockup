"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutDashboard, GraduationCap, Users, UserSquare2, CalendarCheck, FileText, CalendarDays, BookOpenCheck, Wallet, MessageSquare,
  UserPlus, BarChart3, Settings as SettingsIcon, Bell, Search, ChevronDown, PanelLeftClose, PanelLeftOpen, Menu, X, ChevronRight,
  RotateCcw, LogOut, School, Repeat, UserCircle2, Baby,
} from "lucide-react";
import { StoreProvider, useStore } from "@/lib/store";
import { useRoute, go, href } from "@/lib/router";
import { cx, fmtDate } from "@/lib/utils";
import { Avatar, Toasts } from "./ui";
import Dashboard from "@/views/Dashboard";
import Academics from "@/views/Academics";
import { StudentsPage } from "@/views/Students";
import TeachersPage from "@/views/Teachers";
import AttendancePage from "@/views/AttendancePage";
import { ExaminationsPage, TimetablePage } from "@/views/AcademicsPanels";
import Homework from "@/views/Homework";
import Fees from "@/views/Fees";
import Reminders from "@/views/Reminders";
import Communication from "@/views/Communication";
import Admissions from "@/views/Admissions";
import Reports from "@/views/Reports";
import SettingsPage from "@/views/Settings";
import { ParentPortal, StudentPortal } from "@/views/Portals";

type NavItem = { id: string; label: string; icon: React.ReactNode; children?: { id: string; label: string; path: string }[] };
const NAV: NavItem[] = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard size={18} /> },
  {
    id: "academics", label: "Academics", icon: <GraduationCap size={18} />,
    children: [
      { id: "overview", label: "Academic Overview", path: "academics" }, { id: "classes", label: "Classes", path: "academics/classes" },
      { id: "subjects", label: "Subjects", path: "academics/subjects" }, { id: "timetable", label: "Timetable", path: "academics/timetable" },
      { id: "attendance", label: "Attendance Marking", path: "academics/attendance" }, { id: "exams", label: "Examinations", path: "academics/exams" },
      { id: "marks", label: "Marks Entry", path: "academics/marks" }, { id: "report-cards", label: "Report Cards", path: "academics/report-cards" },
      { id: "analytics", label: "Academic Analytics", path: "academics/analytics" },
    ],
  },
  { id: "students", label: "Students", icon: <Users size={18} /> },
  { id: "teachers", label: "Teachers", icon: <UserSquare2 size={18} /> },
  { id: "attendance", label: "Attendance", icon: <CalendarCheck size={18} /> },
  { id: "examinations", label: "Examinations", icon: <FileText size={18} /> },
  { id: "timetable", label: "Timetable", icon: <CalendarDays size={18} /> },
  { id: "homework", label: "Homework", icon: <BookOpenCheck size={18} /> },
  {
    id: "fees", label: "Fees & Payments", icon: <Wallet size={18} />,
    children: [{ id: "fees", label: "Fee Management", path: "fees" }, { id: "reminders", label: "Automated Fee Reminders", path: "reminders" }],
  },
  { id: "communication", label: "Parent Communication", icon: <MessageSquare size={18} /> },
  { id: "admissions", label: "Admissions", icon: <UserPlus size={18} /> },
  { id: "reports", label: "Reports & Analytics", icon: <BarChart3 size={18} /> },
  { id: "settings", label: "Settings", icon: <SettingsIcon size={18} /> },
];
const TITLES: Record<string, string> = {
  overview: "Overview", academics: "Academics", students: "Students", teachers: "Teachers", attendance: "Attendance", examinations: "Examinations",
  timetable: "Timetable", homework: "Homework", fees: "Fees & Payments", reminders: "Automated Fee Reminders", communication: "Parent Communication",
  admissions: "Admissions", reports: "Reports & Analytics", settings: "Settings",
};
const SUBTITLES: Record<string, string> = {
  overview: "", classes: "Class Management", subjects: "Subject Management", timetable: "Timetable", attendance: "Attendance", exams: "Examinations",
  marks: "Marks Entry", "report-cards": "Report Cards", analytics: "Academic Analytics",
};
const parentOfPage = (page: string) => (page === "reminders" ? "fees" : page);

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}

function Shell() {
  const { s, toasts } = useStore();
  const route = useRoute();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({ academics: true, fees: true });

  useEffect(() => {
    const p = parentOfPage(route.page);
    setOpen(o => ({ ...o, [p]: true }));
    setMobileOpen(false);
  }, [route.page]);

  if (s.role !== "admin") return <><PortalFrame /><Toasts toasts={toasts} /></>;

  const isActive = (id: string) => parentOfPage(route.page) === id;
  const title = TITLES[route.page] ?? "Overview";
  const crumbs = ["Home", title, ...(route.page === "academics" && route.sub ? [SUBTITLES[route.sub]] : []), ...(route.page === "students" && route.sub ? ["Student Profile"] : []), ...(route.page === "teachers" && route.sub ? ["Teacher Profile"] : [])];

  const sidebar = (
    <aside className={cx("flex h-full flex-col bg-brand-900 text-slate-300 transition-all duration-200", collapsed ? "w-[72px]" : "w-64")}>
      <div className={cx("flex h-16 shrink-0 items-center gap-3 border-b border-white/10", collapsed ? "justify-center px-0" : "px-5")}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20"><School size={19} className="text-white" /></span>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight text-white">{s.school.name}</p>
            <p className="truncate text-[11px] text-slate-400">SchoolSphere ERP</p>
          </div>
        )}
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {NAV.map(item => {
          const active = isActive(item.id);
          const expanded = item.children && open[item.id] && !collapsed;
          const target = item.children ? item.children[0].path : item.id;
          return (
            <div key={item.id}>
              <a
                href={href(target)}
                title={collapsed ? item.label : undefined}
                onClick={e => { if (item.children && active) { e.preventDefault(); setOpen(o => ({ ...o, [item.id]: !o[item.id] })); } }}
                className={cx("group flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors", collapsed && "justify-center px-0", active ? "bg-white/12 text-white" : "hover:bg-white/6 hover:text-white")}
              >
                <span className={active ? "text-white" : "text-slate-400 group-hover:text-white"}>{item.icon}</span>
                {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                {!collapsed && item.children && <ChevronDown size={14} className={cx("transition-transform", expanded && "rotate-180")} />}
              </a>
              {expanded && (
                <div className="mb-1 ml-[22px] mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
                  {item.children!.map(c => {
                    const pathPage = c.path.split("/")[0], pathSub = c.path.split("/")[1] ?? "";
                    const act = route.page === pathPage && (item.id !== "academics" || (route.sub || "") === pathSub);
                    return (
                      <a key={c.path} href={href(c.path)} className={cx("block rounded-md px-2.5 py-1.5 text-[12.5px] transition-colors", act ? "bg-white/10 font-medium text-white" : "text-slate-400 hover:text-white")}>
                        {c.label}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div className="shrink-0 border-t border-white/10 p-3">
        <button onClick={() => setCollapsed(c => !c)} className={cx("hidden w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-slate-400 hover:bg-white/6 hover:text-white lg:flex", collapsed && "justify-center px-0")}>
          {collapsed ? <PanelLeftOpen size={18} /> : <><PanelLeftClose size={18} /> Collapse sidebar</>}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden lg:block">{sidebar}</div>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileOpen(false)} />
          <div className="relative h-full w-64">{sidebar}</div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title={title} crumbs={crumbs} onMenu={() => setMobileOpen(true)} />
        <main id="main-scroll" className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1440px] p-4 sm:p-6">
            <Page route={route} />
          </div>
        </main>
      </div>
      <Toasts toasts={toasts} />
    </div>
  );
}

function Page({ route }: { route: { page: string; sub: string; param: string } }) {
  switch (route.page) {
    case "academics": return <Academics sub={route.sub} />;
    case "students": return <StudentsPage id={route.sub} tab={route.param} />;
    case "teachers": return <TeachersPage id={route.sub} />;
    case "attendance": return <AttendancePage />;
    case "examinations": return <ExaminationsPage sub={route.sub} />;
    case "timetable": return <TimetablePage />;
    case "homework": return <Homework />;
    case "fees": return <Fees sub={route.sub} />;
    case "reminders": return <Reminders />;
    case "communication": return <Communication sub={route.sub} />;
    case "admissions": return <Admissions />;
    case "reports": return <Reports />;
    case "settings": return <SettingsPage sub={route.sub} />;
    default: return <Dashboard />;
  }
}

function useOutside(ref: React.RefObject<HTMLElement | null>, fn: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) fn(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  });
}

function TopBar({ title, crumbs, onMenu }: { title: string; crumbs: string[]; onMenu: () => void }) {
  const { s, up, reset, toast } = useStore();
  const [q, setQ] = useState("");
  const [sOpen, setSOpen] = useState(false);
  const [nOpen, setNOpen] = useState(false);
  const [pOpen, setPOpen] = useState(false);
  const [unread, setUnread] = useState(4);
  const sref = useRef<HTMLDivElement>(null), nref = useRef<HTMLDivElement>(null), pref = useRef<HTMLDivElement>(null);
  useOutside(sref, () => setSOpen(false)); useOutside(nref, () => setNOpen(false)); useOutside(pref, () => setPOpen(false));

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    const st = s.students.filter(x => x.name.toLowerCase().includes(t) || x.admNo.toLowerCase().includes(t)).slice(0, 5).map(x => ({ k: "Student", label: x.name, sub: `${x.cls}-${x.section} · ${x.admNo}`, path: `students/${x.id}` }));
    const te = s.teachers.filter(x => x.name.toLowerCase().includes(t) || x.empId.toLowerCase().includes(t)).slice(0, 3).map(x => ({ k: "Teacher", label: x.name, sub: `${x.department} · ${x.empId}`, path: `teachers/${x.id}` }));
    const pg = Object.entries(TITLES).filter(([, v]) => v.toLowerCase().includes(t)).slice(0, 3).map(([id, v]) => ({ k: "Page", label: v, sub: "Go to module", path: id }));
    return [...pg, ...st, ...te];
  }, [q, s.students, s.teachers]);

  const notes = [
    { t: "Fee reminders sent to 17 parents", d: "Monday 10:00 AM", tone: "bg-brand-500" },
    { t: "3 admission applications awaiting review", d: "Today", tone: "bg-amber-500" },
    { t: "Aarav Sharma flagged: Mathematics decline", d: "Today", tone: "bg-red-500" },
    { t: "Unit Test 2 schedule published", d: "Yesterday", tone: "bg-emerald-500" },
    { t: "Mohammed Irfan leave request", d: "2 days ago", tone: "bg-slate-400" },
  ];

  return (
    <header className="z-20 shrink-0 border-b border-slate-200 bg-white">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button onClick={onMenu} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"><Menu size={20} /></button>
        <div className="min-w-0">
          <nav className="hidden items-center gap-1 text-[11px] text-slate-400 sm:flex">
            {crumbs.map((c, i) => (<React.Fragment key={i}>{i > 0 && <ChevronRight size={11} />}<span className={i === crumbs.length - 1 ? "text-slate-500" : ""}>{c}</span></React.Fragment>))}
          </nav>
          <h2 className="truncate text-[17px] font-semibold leading-tight text-slate-900">{title}</h2>
        </div>

        <div ref={sref} className="relative ml-auto hidden w-full max-w-md md:block">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={e => { setQ(e.target.value); setSOpen(true); }} onFocus={() => setSOpen(true)} placeholder="Search students, teachers, pages…" className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100" />
          {sOpen && q && (
            <div className="pop absolute left-0 right-0 top-11 z-30 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
              {results.length === 0 && <p className="p-4 text-sm text-slate-400">No results for “{q}”</p>}
              {results.map((r, i) => (
                <button key={i} onClick={() => { go(r.path); setQ(""); setSOpen(false); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50">
                  <span className="w-14 text-[10px] font-semibold uppercase tracking-wide text-brand-600">{r.k}</span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm text-slate-800">{r.label}</span><span className="block truncate text-xs text-slate-400">{r.sub}</span></span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative hidden sm:block">
          <select value={s.academicYear} onChange={e => { up(() => ({ academicYear: e.target.value })); toast(`Academic year switched to ${e.target.value}`); }} className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-100">
            {["2026-27", "2025-26", "2024-25"].map(y => <option key={y}>{y}</option>)}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>

        <div ref={nref} className="relative">
          <button onClick={() => { setNOpen(o => !o); setUnread(0); }} className="relative rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
            <Bell size={17} />
            {unread > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unread}</span>}
          </button>
          {nOpen && (
            <div className="pop absolute right-0 top-12 z-30 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><span className="text-sm font-semibold">Notifications</span><button onClick={() => toast("All notifications marked as read")} className="text-xs text-brand-600 hover:underline">Mark all read</button></div>
              {notes.map((n, i) => (
                <div key={i} className="flex gap-3 border-b border-slate-50 px-4 py-3 last:border-0 hover:bg-slate-50"><span className={cx("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.tone)} /><div><p className="text-[13px] text-slate-700">{n.t}</p><p className="text-[11px] text-slate-400">{n.d}</p></div></div>
              ))}
            </div>
          )}
        </div>

        <div ref={pref} className="relative">
          <button onClick={() => setPOpen(o => !o)} className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-slate-50">
            <Avatar name={s.school.principal.replace("Dr. ", "")} size={34} />
            <span className="hidden text-left leading-tight lg:block"><span className="block text-[13px] font-medium text-slate-800">{s.school.principal}</span><span className="block text-[11px] text-slate-400">Administrator</span></span>
            <ChevronDown size={14} className="hidden text-slate-400 lg:block" />
          </button>
          {pOpen && (
            <div className="pop absolute right-0 top-12 z-30 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl">
              <p className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Demo role switcher</p>
              <button className="flex w-full items-center gap-3 bg-brand-50 px-4 py-2 text-left text-sm text-brand-700"><UserCircle2 size={16} /> Administrator <span className="ml-auto text-[10px]">Current</span></button>
              <button onClick={() => { up(() => ({ role: "parent" })); setPOpen(false); toast("Previewing the Parent Portal"); }} className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"><Baby size={16} /> Parent Portal</button>
              <button onClick={() => { up(() => ({ role: "student" })); setPOpen(false); toast("Previewing the Student Portal"); }} className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"><GraduationCap size={16} /> Student Portal</button>
              <div className="my-1.5 border-t border-slate-100" />
              <button onClick={() => { go("settings"); setPOpen(false); }} className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"><SettingsIcon size={16} /> Settings</button>
              <button onClick={() => { reset(); setPOpen(false); }} className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"><RotateCcw size={16} /> Reset demo data</button>
              <button onClick={() => { toast("Sign-out is disabled in the prototype", "warn"); setPOpen(false); }} className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"><LogOut size={16} /> Sign out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function PortalFrame() {
  const { s, up, toast } = useStore();
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="sticky top-0 z-30 flex flex-wrap items-center gap-3 bg-brand-900 px-4 py-2.5 text-sm text-white">
        <span className="rounded bg-white/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide">Demo preview</span>
        <span className="text-slate-300">{s.role === "parent" ? "Parent Portal" : "Student Portal"} · {s.school.name}</span>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => { up(() => ({ role: s.role === "parent" ? "student" : "parent" })); toast("Switched portal view"); }} className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/20"><Repeat size={13} /> Switch to {s.role === "parent" ? "Student" : "Parent"} portal</button>
          <button onClick={() => up(() => ({ role: "admin" }))} className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-brand-800 hover:bg-slate-100"><X size={13} /> Exit to Admin</button>
        </div>
      </div>
      {s.role === "parent" ? <ParentPortal /> : <StudentPortal />}
    </div>
  );
}

export { fmtDate };
