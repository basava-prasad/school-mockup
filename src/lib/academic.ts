import { State } from "./store";
import { CORE, Exam, SUBJECT_NAMES } from "./data";
import { gradeOf } from "./utils";

export const pctOf = (obt: number, max: number) => (max ? Math.round((obt / max) * 1000) / 10 : 0);

export function examResult(s: State, examId: string, studentId: string) {
  const ex = s.exams.find(e => e.id === examId);
  const m = s.marks[examId]?.[studentId];
  if (!ex || !m) return null;
  const rows = ex.subjects.map(code => {
    const obtained = m[code] ?? null;
    const pct = obtained === null ? null : pctOf(obtained, ex.maxMarks);
    return { code, name: SUBJECT_NAMES[code] ?? code, max: ex.maxMarks, obtained, pct, grade: pct === null ? "—" : gradeOf(pct), pass: obtained === null ? null : obtained >= ex.passMarks };
  });
  const filled = rows.filter(r => r.obtained !== null);
  if (!filled.length) return null;
  const total = filled.reduce((a, r) => a + (r.obtained as number), 0);
  const max = filled.length * ex.maxMarks;
  const pct = pctOf(total, max);
  return { rows, total, max, pct, grade: gradeOf(pct), pass: filled.every(r => r.pass), exam: ex };
}

export function subjectPct(s: State, examId: string, studentId: string, code: string) {
  const ex = s.exams.find(e => e.id === examId);
  const v = s.marks[examId]?.[studentId]?.[code];
  if (!ex || v === undefined || v === null) return null;
  return pctOf(v, ex.maxMarks);
}

export function attentionList(s: State) {
  const out: { studentId: string; code: string; prev: number; cur: number; drop: number }[] = [];
  s.students.forEach(st => {
    CORE.forEach(code => {
      const prev = subjectPct(s, "E1", st.id, code), cur = subjectPct(s, "E2", st.id, code);
      if (prev === null || cur === null) return;
      if (prev - cur >= 20 || cur < 40) out.push({ studentId: st.id, code, prev, cur, drop: prev - cur });
    });
  });
  return out.sort((a, b) => b.drop - a.drop);
}

export function classAverages(s: State, examId: string) {
  return s.classes.map(c => {
    const ids = s.students.filter(x => x.cls === c.name && s.marks[examId]?.[x.id]).map(x => x.id);
    if (!ids.length) return null;
    const vals = ids.map(id => examResult(s, examId, id)?.pct).filter((x): x is number => x !== undefined && x !== null);
    return { cls: c.name, avg: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10, count: ids.length };
  }).filter((x): x is { cls: string; avg: number; count: number } => !!x);
}

export function subjectAverages(s: State, examId: string, classFilter?: string) {
  return CORE.map(code => {
    const vals = s.students.filter(x => (!classFilter || x.cls === classFilter)).map(x => subjectPct(s, examId, x.id, code)).filter((v): v is number => v !== null);
    return { code, subject: SUBJECT_NAMES[code], avg: vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0 };
  });
}

export function examLabel(e: Exam) { return `${e.name}`; }

export function defaultRemark(pct: number, name: string) {
  const first = name.split(" ")[0];
  if (pct >= 90) return `${first} has delivered an outstanding performance and is a role model for peers. Keep up the excellent work.`;
  if (pct >= 75) return `${first} has performed very well this term. With a little more focus on weaker areas, ${first} can reach the top bracket.`;
  if (pct >= 60) return `${first} shows steady progress. Regular practice and revision will help improve results further.`;
  if (pct >= 40) return `${first} needs to put in more consistent effort. Extra practice in core subjects is recommended.`;
  return `${first} requires immediate academic support. We recommend a parent-teacher discussion and remedial classes.`;
}
