"use client";
import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import * as D from "./data";
import { setGradeScale, gradeScale, GradeBand, TODAY } from "./utils";

export type ReminderSettings = {
  enabled: boolean; frequency: string; day: string; time: string; channels: string[]; onlyOutstanding: boolean; stopOnPaid: boolean;
};
export type SchoolSettings = {
  name: string; tagline: string; address: string; phone: string; email: string; website: string; principal: string; affiliation: string;
  passPercent: number; minAttendance: number; lateAfter: string; lateFee: number; graceDays: number;
  notif: Record<string, boolean>;
};
export type Role = "admin" | "parent" | "student";

export type State = {
  students: D.Student[]; parents: D.Parent[]; teachers: D.Teacher[]; classes: D.ClassRec[]; subjects: D.Subject[];
  exams: D.Exam[]; marks: D.MarksMap; attendance: D.AttMap; structures: D.FeeStructure[]; feeRecords: D.FeeRecord[];
  payments: D.Payment[]; notifications: D.Notification[]; templates: D.Template[]; admissions: D.Admission[];
  homework: D.Homework[]; ttOverrides: Record<string, D.TTOverride>; interventions: Record<string, string>;
  remarks: Record<string, string>; reminder: ReminderSettings; reminderLog: Record<string, { last: string; status: string }>;
  school: SchoolSettings; grading: GradeBand[]; academicYear: string; role: Role; portalStudent: string; portalParent: string;
};

function seed(): State {
  const { students, parents } = D.seedStudentsAndParents();
  const structures = D.seedFeeStructures();
  const { records, payments } = D.seedFees(students, structures);
  const log: State["reminderLog"] = {};
  records.forEach((r, i) => { if (i % 3 !== 1) log[r.studentId] = { last: i % 2 ? "2026-11-09" : "2026-11-02", status: i % 11 === 5 ? "Failed" : "Delivered" }; });
  return {
    students, parents, teachers: D.seedTeachers(), classes: D.seedClasses(), subjects: D.seedSubjects(), exams: D.seedExams(),
    marks: D.seedMarks(students), attendance: D.seedAttendance(students), structures, feeRecords: records, payments,
    notifications: D.seedNotifications(students, parents), templates: D.TEMPLATES, admissions: D.seedAdmissions(),
    homework: D.seedHomework(), ttOverrides: {}, interventions: { "S1001|MAT": "Counselling scheduled", "S1002|SCI": "Remedial classes", "S1003|ENG": "Not started" },
    remarks: {}, reminder: { enabled: true, frequency: "Weekly", day: "Monday", time: "10:00 AM", channels: ["WhatsApp", "SMS"], onlyOutstanding: true, stopOnPaid: true },
    reminderLog: log,
    school: {
      name: "St. Mary's International School", tagline: "Excellence • Integrity • Compassion", address: "42, Church Road, Indiranagar, Bengaluru 560038",
      phone: "+91 80 4123 4567", email: "office@stmarys.edu.in", website: "www.stmarys.edu.in", principal: "Dr. Anjali Deshpande", affiliation: "CBSE – 830456",
      passPercent: 33, minAttendance: 75, lateAfter: "08:45", lateFee: 50, graceDays: 7,
      notif: { "Absence alerts to parents": true, "Fee due reminders": true, "Exam schedule updates": true, "Result publication": true, "Daily summary email to principal": false, "Admission enquiry alerts": true },
    },
    grading: [...gradeScale], academicYear: "2026-27", role: "admin", portalStudent: "S1001", portalParent: "P1",
  };
}

type Ctx = {
  s: State; up: (fn: (s: State) => Partial<State>) => void; toast: (msg: string, tone?: "ok" | "warn" | "err") => void;
  toasts: { id: number; msg: string; tone: string }[]; reset: () => void;
  parentOf: (id: string) => D.Parent | undefined; student: (id: string) => D.Student | undefined; teacher: (id: string) => D.Teacher | undefined;
  paid: (sid: string) => number; fee: (sid: string) => { total: number; discount: number; net: number; paid: number; balance: number; due: string; status: string };
  attPct: (sid: string) => number;
  addNotifications: (n: Omit<D.Notification, "id">[]) => void;
  nextId: (p: string) => string;
};
const C = createContext<Ctx>(null as unknown as Ctx);
export const useStore = () => useContext(C);
const KEY = "school-erp-proto-v1";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<State>(() => seed());
  const [ready, setReady] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; msg: string; tone: string }[]>([]);
  const counter = useRef(5000);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const p = JSON.parse(raw); setS(prev => ({ ...prev, ...p })); if (p.grading) setGradeScale(p.grading); }
    } catch { /* ignore */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* quota */ } }, 300);
    return () => clearTimeout(t);
  }, [s, ready]);

  const up = useCallback((fn: (s: State) => Partial<State>) => setS(prev => ({ ...prev, ...fn(prev) })), []);
  const toast = useCallback((msg: string, tone: "ok" | "warn" | "err" = "ok") => {
    const id = ++counter.current;
    setToasts(t => [...t, { id, msg, tone }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3600);
  }, []);
  const reset = useCallback(() => {
    try { localStorage.removeItem(KEY); } catch { /* */ }
    const fresh = seed();
    setGradeScale(fresh.grading);
    setS(fresh);
    toast("Demo data reset to defaults");
  }, [toast]);
  const nextId = useCallback((p: string) => p + (++counter.current), []);

  const value = useMemo<Ctx>(() => {
    const parentOf = (id: string) => s.parents.find(p => p.id === id);
    const student = (id: string) => s.students.find(x => x.id === id);
    const teacher = (id: string) => s.teachers.find(x => x.id === id);
    const paid = (sid: string) => D.paidOf(s.payments, sid);
    const fee = (sid: string) => {
      const r = s.feeRecords.find(f => f.studentId === sid);
      const total = r?.total ?? 0, discount = r?.discount ?? 0, net = total - discount, p = paid(sid), balance = Math.max(0, net - p);
      const due = r?.dueDate ?? TODAY;
      const status = balance === 0 ? "Paid" : due < TODAY ? "Overdue" : p > 0 ? "Partial" : "Unpaid";
      return { total, discount, net, paid: p, balance, due, status };
    };
    const attPct = (sid: string) => {
      let p = 0, n = 0;
      Object.values(s.attendance).forEach(day => { const v = day[sid]; if (v) { n++; if (v !== "A") p++; } });
      return n ? Math.round((p / n) * 1000) / 10 : 0;
    };
    const addNotifications = (n: Omit<D.Notification, "id">[]) =>
      up(st => ({ notifications: [...n.map((x, i) => ({ ...x, id: "N" + (++counter.current) + i })), ...st.notifications] }));
    return { s, up, toast, toasts, reset, parentOf, student, teacher, paid, fee, attPct, addNotifications, nextId };
  }, [s, up, toast, toasts, reset, nextId]);

  return <C.Provider value={value}>{children}</C.Provider>;
}
