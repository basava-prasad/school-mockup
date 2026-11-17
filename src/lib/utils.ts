export const TODAY = "2026-11-12";
const inr = new Intl.NumberFormat("en-IN");
export const money = (n: number) => "₹" + inr.format(Math.round(n));
export const num = (n: number) => inr.format(n);
export function fmtDate(d: string, withYear = true) {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", ...(withYear ? { year: "numeric" } : {}) });
}
export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");
export function addDays(d: string, n: number) {
  const dt = new Date(d + "T00:00:00Z");
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}
export function daysBetween(a: string, b: string) {
  return Math.round((new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime()) / 86400000);
}
export const weekday = (d: string) => new Date(d + "T00:00:00Z").getUTCDay();

export type GradeBand = { grade: string; min: number };
export let gradeScale: GradeBand[] = [
  { grade: "A1", min: 91 }, { grade: "A2", min: 81 }, { grade: "B1", min: 71 }, { grade: "B2", min: 61 },
  { grade: "C1", min: 51 }, { grade: "C2", min: 41 }, { grade: "D", min: 33 }, { grade: "E", min: 0 },
];
export const setGradeScale = (g: GradeBand[]) => { gradeScale = g; };
export function gradeOf(pct: number) {
  return (gradeScale.find(b => pct >= b.min) ?? gradeScale[gradeScale.length - 1]).grade;
}
export function gradeTone(g: string) {
  if (g.startsWith("A")) return "green";
  if (g.startsWith("B")) return "blue";
  if (g.startsWith("C")) return "amber";
  return "red";
}
export function initials(name: string) {
  return name.split(" ").map(s => s[0]).slice(0, 2).join("").toUpperCase();
}
export function downloadCSV(name: string, rows: (string | number)[][]) {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
