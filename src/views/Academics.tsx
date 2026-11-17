"use client";
import React from "react";
import { Tabs } from "@/components/ui";
import { AcademicAnalytics, AcademicOverview } from "./AcademicInsights";
import { AttendanceMarking, ClassesPanel, SubjectsPanel, TimetablePanel } from "./AcademicsPanels";
import { ExamsPanel, MarksPanel, ReportCardPanel } from "./ExamPanels";
import { go } from "@/lib/router";

const TABS = [
  { id: "overview", label: "Overview" }, { id: "classes", label: "Classes" }, { id: "subjects", label: "Subjects" },
  { id: "timetable", label: "Timetable" }, { id: "attendance", label: "Attendance" }, { id: "exams", label: "Examinations" },
  { id: "marks", label: "Marks" }, { id: "report-cards", label: "Report Cards" }, { id: "analytics", label: "Analytics" },
];

export default function Academics({ sub }: { sub: string }) {
  const tab = TABS.some(t => t.id === sub) ? sub : "overview";
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Academic Workspace</h1>
        <p className="mt-0.5 text-sm text-slate-500">Classes, subjects, timetable, attendance, examinations, marks, report cards and analytics in one place</p>
      </div>
      <Tabs tabs={TABS} value={tab} onChange={t => go(t === "overview" ? "academics" : `academics/${t}`)} />
      {tab === "overview" && <AcademicOverview />}
      {tab === "classes" && <ClassesPanel />}
      {tab === "subjects" && <SubjectsPanel />}
      {tab === "timetable" && <TimetablePanel />}
      {tab === "attendance" && <AttendanceMarking />}
      {tab === "exams" && <ExamsPanel />}
      {tab === "marks" && <MarksPanel />}
      {tab === "report-cards" && <ReportCardPanel />}
      {tab === "analytics" && <AcademicAnalytics />}
    </div>
  );
}
