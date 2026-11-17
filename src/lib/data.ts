import { TODAY, addDays, weekday } from "./utils";

export type Parent = { id: string; name: string; relation: string; phone: string; email: string; occupation: string };
export type Student = {
  id: string; admNo: string; name: string; gender: "Male" | "Female"; cls: string; section: string; rollNo: number;
  dob: string; parentId: string; admissionDate: string; status: "Active" | "Inactive" | "Transferred";
  blood: string; address: string;
};
export type Teacher = {
  id: string; empId: string; name: string; department: string; subjects: string[]; classes: string[];
  phone: string; email: string; status: "Active" | "On Leave" | "Resigned"; joined: string; qualification: string; experience: number;
};
export type ClassRec = { id: string; name: string; order: number; sections: string[]; classTeachers: Record<string, string>; room: string };
export type Subject = { code: string; name: string; type: "Compulsory" | "Optional"; teacherId: string; classes: string[] };
export type Exam = {
  id: string; name: string; type: string; classes: string[]; subjects: string[]; startDate: string; endDate: string;
  maxMarks: number; passMarks: number; status: "Completed" | "Ongoing" | "Scheduled";
};
export type FeeComponent = { name: string; amount: number };
export type FeeStructure = { id: string; name: string; classes: string[]; components: FeeComponent[]; installments: number };
export type FeeRecord = { studentId: string; total: number; discount: number; dueDate: string; structureId: string };
export type Payment = { id: string; receipt: string; studentId: string; amount: number; date: string; mode: string; note: string };
export type Notification = {
  id: string; parentName: string; studentName: string; cls: string; type: string; channel: string; date: string;
  status: "Delivered" | "Read" | "Failed" | "Pending"; subject?: string;
};
export type Template = { id: string; name: string; subject: string; body: string; channel: string };
export type Admission = {
  id: string; applicant: string; gender: string; dob: string; applyingFor: string; guardian: string; phone: string; email: string;
  date: string; status: "Pending" | "Approved" | "Rejected" | "Under Review"; previousSchool: string; documents: string[]; notes: string;
};
export type Homework = { id: string; cls: string; section: string; subject: string; title: string; assigned: string; due: string; teacherId: string; type: "Homework" | "Assignment"; description: string };
export type TTOverride = { subject: string; teacherId: string };
export type SchoolEvent = { date: string; title: string; kind: string };

export const SUBJECT_NAMES: Record<string, string> = {
  ENG: "English", HIN: "Hindi", MAT: "Mathematics", SCI: "Science", SST: "Social Science",
  CS: "Computer Science", PE: "Physical Education", ART: "Art & Craft", SAN: "Sanskrit",
};
export const CORE = ["ENG", "HIN", "MAT", "SCI", "SST", "CS"];

// seeded rng
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CLASS_NAMES = ["Nursery", "LKG", "UKG", ...Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`)];
export const gradeNum = (cls: string) => { const m = cls.match(/\d+/); return m ? +m[0] : cls === "UKG" ? -1 : cls === "LKG" ? -2 : -3; };

export function seedClasses(): ClassRec[] {
  const tids = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];
  let k = 0;
  return CLASS_NAMES.map((name, i) => {
    const g = gradeNum(name);
    const sections = g >= 11 ? ["A", "B", "C"] : g === 12 ? ["A", "B", "C"] : ["A", "B"];
    const classTeachers: Record<string, string> = {};
    sections.forEach(s => { classTeachers[s] = tids[k++ % tids.length]; });
    return { id: "c" + (i + 1), name, order: i, sections, classTeachers, room: `${100 + (i + 1) * 3}` };
  });
}

export function seedTeachers(): Teacher[] {
  const t = (id: number, name: string, dept: string, subjects: string[], classes: string[], status: Teacher["status"] = "Active", exp = 8, q = "M.Ed"): Teacher => ({
    id: "T" + id, empId: "EMP" + (2010 + id * 3), name, department: dept, subjects, classes,
    phone: `+91 98${(45000000 + id * 913471) % 100000000}`.slice(0, 14), email: name.toLowerCase().replace(/[^a-z ]/g, "").replace(/ /g, ".") + "@stmarys.edu.in",
    status, joined: `${2024 - Math.floor(exp / 2)}-0${(id % 8) + 1}-15`, qualification: q, experience: exp,
  });
  return [
    t(1, "Meera Iyer", "Languages", ["ENG"], ["Grade 10", "Grade 9", "Grade 8"], "Active", 14, "M.A. English, B.Ed"),
    t(2, "Suresh Nair", "Mathematics", ["MAT"], ["Grade 10", "Grade 9"], "Active", 18, "M.Sc. Mathematics, B.Ed"),
    t(3, "Kavita Deshmukh", "Sciences", ["SCI"], ["Grade 10", "Grade 9", "Grade 8"], "Active", 11, "M.Sc. Physics, B.Ed"),
    t(4, "Anil Verma", "Languages", ["HIN", "SAN"], ["Grade 10", "Grade 9", "Grade 8", "Grade 6"], "Active", 20, "M.A. Hindi, B.Ed"),
    t(5, "Priya Menon", "Humanities", ["SST"], ["Grade 10", "Grade 9", "Grade 8", "Grade 6"], "Active", 9, "M.A. History, B.Ed"),
    t(6, "Rahul Khanna", "Technology", ["CS"], ["Grade 10", "Grade 9", "Grade 8", "Grade 6"], "Active", 7, "MCA, B.Ed"),
    t(7, "Sunita Patil", "Mathematics", ["MAT"], ["Grade 8", "Grade 6", "Grade 3", "Grade 1"], "Active", 12, "M.Sc. Mathematics"),
    t(8, "Vikram Singh", "Sports", ["PE"], ["Grade 10", "Grade 9", "Grade 8", "Grade 6", "Grade 3", "Grade 1"], "Active", 10, "M.P.Ed"),
    t(9, "Deepa Krishnan", "Languages", ["ENG", "HIN"], ["Grade 6", "Grade 3", "Grade 1"], "Active", 6, "M.A. English, B.Ed"),
    t(10, "Mohammed Irfan", "Sciences", ["SCI", "MAT"], ["Grade 6", "Grade 3", "Grade 1"], "On Leave", 5, "M.Sc. Chemistry, B.Ed"),
    t(11, "Lakshmi Narayanan", "Arts", ["ART"], ["Grade 10", "Grade 9", "Grade 8", "Grade 6", "Grade 3", "Grade 1"], "Active", 13, "BFA, B.Ed"),
    t(12, "Ramesh Joshi", "Languages", ["SAN", "SST"], ["Grade 9", "Grade 8"], "Active", 22, "M.A. Sanskrit, B.Ed"),
  ];
}

export function seedSubjects(): Subject[] {
  const allBetween = (a: number, b: number) => CLASS_NAMES.filter(c => { const g = gradeNum(c); return g >= a && g <= b; });
  return [
    { code: "ENG", name: "English", type: "Compulsory", teacherId: "T1", classes: allBetween(1, 12) },
    { code: "HIN", name: "Hindi", type: "Compulsory", teacherId: "T4", classes: allBetween(1, 10) },
    { code: "MAT", name: "Mathematics", type: "Compulsory", teacherId: "T2", classes: allBetween(1, 12) },
    { code: "SCI", name: "Science", type: "Compulsory", teacherId: "T3", classes: allBetween(1, 10) },
    { code: "SST", name: "Social Science", type: "Compulsory", teacherId: "T5", classes: allBetween(1, 10) },
    { code: "CS", name: "Computer Science", type: "Compulsory", teacherId: "T6", classes: allBetween(3, 12) },
    { code: "PE", name: "Physical Education", type: "Compulsory", teacherId: "T8", classes: allBetween(-3, 12) },
    { code: "ART", name: "Art & Craft", type: "Optional", teacherId: "T11", classes: allBetween(-3, 9) },
    { code: "SAN", name: "Sanskrit", type: "Optional", teacherId: "T12", classes: allBetween(6, 10) },
  ];
}

// ---------- students ----------
const STU = `Aarav|Sharma|M|Grade 10|A
Ananya|Rao|F|Grade 10|A
Rohan|Kumar|M|Grade 10|A
Ishita|Verma|F|Grade 10|A
Vihaan|Mehta|M|Grade 10|A
Saanvi|Reddy|F|Grade 10|A
Arjun|Nair|M|Grade 10|A
Diya|Iyer|F|Grade 10|A
Kabir|Singh|M|Grade 10|A
Myra|Kapoor|F|Grade 10|A
Reyansh|Gupta|M|Grade 10|A
Aadhya|Pillai|F|Grade 10|A
Advait|Joshi|M|Grade 10|B
Kiara|Malhotra|F|Grade 10|B
Krish|Agarwal|M|Grade 10|B
Navya|Bhat|F|Grade 10|B
Atharv|Desai|M|Grade 10|B
Pari|Choudhury|F|Grade 10|B
Shaurya|Patil|M|Grade 10|B
Tanvi|Menon|F|Grade 10|B
Yash|Thakur|M|Grade 9|A
Riya|Banerjee|F|Grade 9|A
Dev|Chopra|M|Grade 9|A
Meera|Shetty|F|Grade 9|A
Neil|Fernandes|M|Grade 9|A
Sara|Khan|F|Grade 9|A
Harsh|Yadav|M|Grade 9|A
Anika|Das|F|Grade 9|A
Ayaan|Qureshi|M|Grade 8|A
Zoya|Ahmed|F|Grade 8|A
Pranav|Kulkarni|M|Grade 8|A
Trisha|Naidu|F|Grade 8|A
Samar|Bose|M|Grade 8|A
Ira|Saxena|F|Grade 8|A
Veer|Sinha|M|Grade 8|A
Nisha|Rathore|F|Grade 8|A
Diya|Sharma|F|Grade 6|A
Lakshay|Bhatia|M|Grade 6|A
Aditi|Pandey|F|Grade 6|A
Manav|Trivedi|M|Grade 6|A
Rudra|Mishra|M|Grade 3|A
Siya|Jain|F|Grade 3|A
Parth|Goel|M|Grade 3|A
Avni|Tiwari|F|Grade 3|A
Aryan|Hegde|M|Grade 1|A
Mahi|Dutta|F|Grade 1|A
Ritvik|Sethi|M|Grade 1|A
Anvi|Kohli|F|Grade 1|A`;

const FATHERS = ["Rajesh", "Sanjay", "Vijay", "Amit", "Prakash", "Manoj", "Ramesh", "Anand", "Deepak", "Sunil", "Naveen", "Girish", "Ashok", "Harish", "Mukesh", "Pradeep"];
const MOTHERS = ["Sunita", "Anita", "Neha", "Pooja", "Kavita", "Rekha", "Shilpa", "Jyoti", "Radha", "Seema", "Usha", "Divya", "Nandini", "Latha"];
const AREAS = ["Indiranagar", "Koramangala", "Jayanagar", "Whitefield", "HSR Layout", "Malleshwaram", "Basavanagudi", "Banashankari", "BTM Layout", "Yelahanka"];
const BLOOD = ["A+", "B+", "O+", "AB+", "O-", "A-", "B-"];

export function seedStudentsAndParents(): { students: Student[]; parents: Parent[] } {
  const r = rng(11);
  const parents: Parent[] = [];
  const students: Student[] = [];
  const counters: Record<string, number> = {};
  const lines = STU.split("\n");
  lines.forEach((ln, i) => {
    const [first, last, g, cls, section] = ln.split("|");
    const key = cls + section;
    counters[key] = (counters[key] ?? 0) + 1;
    let parent: Parent | undefined;
    if (first === "Diya" && last === "Sharma") parent = parents[0]; // sibling of Aarav
    if (!parent) {
      const father = FATHERS[i % FATHERS.length];
      const mother = MOTHERS[(i * 3) % MOTHERS.length];
      const isMother = i % 5 === 3;
      parent = {
        id: "P" + (parents.length + 1),
        name: `${isMother ? mother : father} ${last}`,
        relation: isMother ? "Mother" : "Father",
        phone: `+91 9${Math.floor(r() * 9) + 1}${Math.floor(1000 + r() * 8999)}${Math.floor(10000 + r() * 89999)}`,
        email: `${(isMother ? mother : father).toLowerCase()}.${last.toLowerCase()}@gmail.com`,
        occupation: ["Software Engineer", "Business Owner", "Doctor", "Bank Manager", "Teacher", "Chartered Accountant", "Government Officer", "Architect"][i % 8],
      };
      parents.push(parent);
    }
    const gn = gradeNum(cls);
    const year = 2026 - (gn + 5);
    const idx = students.length + 1;
    students.push({
      id: "S" + String(1000 + idx), admNo: `ADM${2020 + (idx % 6)}${String(100 + idx)}`, name: `${first} ${last}`,
      gender: g === "M" ? "Male" : "Female", cls, section, rollNo: counters[key],
      dob: `${year}-${String(((i * 5) % 12) + 1).padStart(2, "0")}-${String(((i * 7) % 27) + 1).padStart(2, "0")}`,
      parentId: parent.id, admissionDate: `${2026 - Math.min(gn + 1, 6)}-0${(i % 3) + 4}-${String((i % 20) + 5).padStart(2, "0")}`,
      status: i === 21 ? "Inactive" : i === 39 ? "Transferred" : "Active",
      blood: BLOOD[i % BLOOD.length], address: `${12 + i}, ${AREAS[i % AREAS.length]}, Bengaluru 560${String(10 + (i % 80)).padStart(3, "0")}`,
    });
  });
  return { students, parents };
}

// ---------- exams & marks ----------
export type MarksMap = Record<string, Record<string, Record<string, number | null>>>; // exam -> student -> subject

export function seedExams(): Exam[] {
  const up = CLASS_NAMES.filter(c => gradeNum(c) >= 6);
  const all = CLASS_NAMES.filter(c => gradeNum(c) >= 1);
  return [
    { id: "E1", name: "Unit Test 1", type: "Unit Test 1", classes: up, subjects: CORE, startDate: "2026-07-20", endDate: "2026-07-24", maxMarks: 50, passMarks: 17, status: "Completed" },
    { id: "E2", name: "Midterm Examination", type: "Midterm", classes: all, subjects: CORE, startDate: "2026-09-21", endDate: "2026-09-30", maxMarks: 100, passMarks: 33, status: "Completed" },
    { id: "E3", name: "Unit Test 2", type: "Unit Test 2", classes: up, subjects: CORE, startDate: "2026-11-17", endDate: "2026-11-21", maxMarks: 50, passMarks: 17, status: "Scheduled" },
    { id: "E4", name: "Half-Yearly Examination", type: "Half-Yearly", classes: all, subjects: CORE, startDate: "2026-12-07", endDate: "2026-12-18", maxMarks: 100, passMarks: 33, status: "Scheduled" },
    { id: "E5", name: "Pre-Final Examination", type: "Pre-Final", classes: ["Grade 10", "Grade 12"], subjects: CORE, startDate: "2027-01-19", endDate: "2027-01-30", maxMarks: 100, passMarks: 33, status: "Scheduled" },
    { id: "E6", name: "Annual Examination", type: "Annual Examination", classes: all, subjects: CORE, startDate: "2027-03-02", endDate: "2027-03-20", maxMarks: 100, passMarks: 33, status: "Scheduled" },
  ];
}

export function seedMarks(students: Student[]): MarksMap {
  const r = rng(77);
  const marks: MarksMap = { E1: {}, E2: {} };
  students.forEach((s, si) => {
    if (gradeNum(s.cls) < 6) { // E2 only for lower classes
      marks.E2[s.id] = {};
      CORE.forEach(c => { marks.E2[s.id][c] = Math.round(58 + r() * 36); });
      return;
    }
    const ability = 52 + r() * 40 + (si % 7 === 0 ? 4 : 0); // overall level
    marks.E1[s.id] = {}; marks.E2[s.id] = {};
    CORE.forEach(c => {
      const base = ability + (r() - 0.5) * 18;
      const p1 = Math.max(24, Math.min(98, base));
      const p2 = Math.max(18, Math.min(99, p1 + (r() - 0.55) * 14));
      marks.E1[s.id][c] = Math.round((p1 / 100) * 50);
      marks.E2[s.id][c] = Math.round(p2);
    });
  });
  const set = (name: string, subj: string, prev: number, cur: number) => {
    const s = students.find(x => x.name === name)!;
    marks.E1[s.id][subj] = Math.round((prev / 100) * 50);
    marks.E2[s.id][subj] = cur;
  };
  set("Aarav Sharma", "MAT", 82, 48);
  set("Ananya Rao", "SCI", 78, 51);
  set("Rohan Kumar", "ENG", 75, 46);
  set("Krish Agarwal", "SST", 72, 49);
  set("Tanvi Menon", "MAT", 79, 55);
  // a few students with heavy absences have lower marks
  set("Dev Chopra", "SCI", 58, 39);
  return marks;
}

// ---------- attendance ----------
export type AttMap = Record<string, Record<string, "P" | "A" | "L">>; // date -> student
export function schoolDays(count: number, end = TODAY) {
  const out: string[] = [];
  let d = end;
  while (out.length < count) { if (weekday(d) !== 0) out.push(d); d = addDays(d, -1); }
  return out.reverse();
}
export function seedAttendance(students: Student[]): AttMap {
  const r = rng(5);
  const att: AttMap = {};
  const habitual = new Set(["Aarav Sharma", "Dev Chopra", "Rohan Kumar", "Harsh Yadav", "Navya Bhat", "Kabir Singh"]);
  schoolDays(45).forEach(d => {
    att[d] = {};
    students.forEach(s => {
      const x = r();
      const absentP = habitual.has(s.name) ? 0.2 : 0.045;
      att[d][s.id] = x < absentP ? "A" : x < absentP + 0.035 ? "L" : "P";
    });
  });
  return att;
}

// ---------- fees ----------
export function seedFeeStructures(): FeeStructure[] {
  const g = (a: number, b: number) => CLASS_NAMES.filter(c => { const n = gradeNum(c); return n >= a && n <= b; });
  return [
    { id: "F1", name: "Pre-Primary Annual Fee", classes: g(-3, -1), installments: 3, components: [{ name: "Tuition", amount: 36000 }, { name: "Activity", amount: 6000 }, { name: "Development", amount: 5000 }] },
    { id: "F2", name: "Primary Annual Fee (1–5)", classes: g(1, 5), installments: 4, components: [{ name: "Tuition", amount: 48000 }, { name: "Activity", amount: 7000 }, { name: "Library & Lab", amount: 4000 }, { name: "Development", amount: 6000 }] },
    { id: "F3", name: "Middle School Annual Fee (6–8)", classes: g(6, 8), installments: 4, components: [{ name: "Tuition", amount: 58000 }, { name: "Activity", amount: 8000 }, { name: "Lab & Computer", amount: 8000 }, { name: "Development", amount: 6000 }] },
    { id: "F4", name: "Secondary Annual Fee (9–10)", classes: g(9, 10), installments: 4, components: [{ name: "Tuition", amount: 68000 }, { name: "Lab & Computer", amount: 10000 }, { name: "Examination", amount: 5000 }, { name: "Development", amount: 7000 }] },
    { id: "F5", name: "Senior Secondary Annual Fee (11–12)", classes: g(11, 12), installments: 2, components: [{ name: "Tuition", amount: 82000 }, { name: "Lab", amount: 14000 }, { name: "Examination", amount: 6000 }, { name: "Development", amount: 8000 }] },
  ];
}
export const feeTotal = (s: FeeStructure) => s.components.reduce((a, c) => a + c.amount, 0);

export function seedFees(students: Student[], structures: FeeStructure[]): { records: FeeRecord[]; payments: Payment[] } {
  const r = rng(404);
  const records: FeeRecord[] = [];
  const payments: Payment[] = [];
  const modes = ["UPI", "Net Banking", "Cash", "Card", "Cheque"];
  let rc = 1000;
  students.forEach((s, i) => {
    const st = structures.find(x => x.classes.includes(s.cls)) ?? structures[3];
    const total = feeTotal(st);
    const discount = i % 9 === 4 ? 5000 : 0;
    // payment pattern
    const pattern = i % 7;
    const net = total - discount;
    let paidFrac = 1;
    let due = "2026-10-10";
    if (pattern === 0) { paidFrac = 0.5; due = "2026-10-15"; }
    else if (pattern === 1) { paidFrac = 0.25; due = "2026-11-30"; }
    else if (pattern === 2) { paidFrac = 0.75; due = "2026-11-20"; }
    else if (pattern === 3 && i % 2 === 0) { paidFrac = 0; due = "2026-10-05"; }
    else if (pattern === 3) { paidFrac = 0.5; due = "2026-12-05"; }
    records.push({ studentId: s.id, total, discount, dueDate: due, structureId: st.id });
    const paid = Math.round((net * paidFrac) / 100) * 100;
    if (paid > 0) {
      const n = paidFrac === 1 ? 2 : 1;
      const each = Math.round(paid / n / 100) * 100;
      for (let k = 0; k < n; k++) {
        const amount = k === n - 1 ? paid - each * (n - 1) : each;
        rc++;
        payments.push({
          id: "PAY" + rc, receipt: "RCT-2026-" + rc, studentId: s.id, amount,
          date: addDays("2026-04-10", Math.floor(r() * 160) + k * 70 > 215 ? 200 : Math.floor(r() * 160) + k * 40),
          mode: modes[Math.floor(r() * modes.length)], note: k === 0 ? "Installment 1" : "Installment 2",
        });
      }
    }
  });
  payments.sort((a, b) => b.date.localeCompare(a.date));
  return { records, payments };
}
export const paidOf = (payments: Payment[], sid: string) => payments.filter(p => p.studentId === sid).reduce((a, p) => a + p.amount, 0);

// ---------- communication ----------
export const TEMPLATES: Template[] = [
  { id: "TP1", name: "General Announcement", channel: "WhatsApp", subject: "School Announcement", body: "Dear Parent,\n\n{{message}}\n\nRegards,\nSchool Administration" },
  { id: "TP2", name: "Holiday Notification", channel: "SMS", subject: "Holiday Notice", body: "Dear Parent,\n\nThe school will remain closed on {{date}} on account of {{occasion}}. Classes will resume on the next working day.\n\nRegards,\nSchool Administration" },
  { id: "TP3", name: "Examination Reminder", channel: "WhatsApp", subject: "Upcoming Examination", body: "Dear Parent,\n\n{{exam_name}} for {{student_name}} ({{class_name}}) begins on {{date}}. Kindly ensure regular revision and punctual attendance.\n\nRegards,\nSchool Administration" },
  { id: "TP4", name: "Attendance Alert", channel: "SMS", subject: "Absence Alert", body: "Dear Parent,\n\n{{student_name}} of {{class_name}} was marked absent today. Please share the reason or submit a leave note.\n\nRegards,\nClass Teacher" },
  { id: "TP5", name: "Fee Payment Reminder", channel: "WhatsApp", subject: "Fee Payment Reminder", body: "Dear Parent,\n\nThis is a reminder regarding the pending school fees for {{student_name}}.\n\nClass: {{class_name}}\nOutstanding Amount: ₹{{pending_amount}}\nDue Date: {{due_date}}\n\nKindly complete the payment at your earliest convenience.\n\nRegards,\nSchool Administration" },
  { id: "TP6", name: "Parent-Teacher Meeting", channel: "Email", subject: "Parent-Teacher Meeting Invitation", body: "Dear Parent,\n\nYou are invited to the Parent-Teacher Meeting for {{class_name}} on {{date}} at {{time}}. Your presence will help us discuss {{student_name}}'s progress.\n\nRegards,\nSchool Administration" },
  { id: "TP7", name: "Result Announcement", channel: "In-app", subject: "Results Published", body: "Dear Parent,\n\nThe results of {{exam_name}} for {{student_name}} have been published. Please log in to the parent portal to view the report card.\n\nRegards,\nSchool Administration" },
];
export const FEE_MESSAGE = TEMPLATES[4].body;

export function seedNotifications(students: Student[], parents: Parent[]): Notification[] {
  const r = rng(909);
  const types = ["Fee Reminder", "General Announcement", "Attendance Alert", "Examination Reminder", "Holiday Notification", "Parent-Teacher Meeting", "Result Announcement"];
  const channels = ["WhatsApp", "SMS", "Email", "In-app"];
  const out: Notification[] = [];
  for (let i = 0; i < 44; i++) {
    const s = students[Math.floor(r() * students.length)];
    const p = parents.find(x => x.id === s.parentId)!;
    const x = r();
    out.push({
      id: "N" + (100 + i), parentName: p.name, studentName: s.name, cls: `${s.cls}-${s.section}`, type: types[Math.floor(r() * types.length)],
      channel: channels[Math.floor(r() * 3.2)], date: addDays(TODAY, -Math.floor(r() * 21)),
      status: x < 0.06 ? "Failed" : x < 0.1 ? "Pending" : x < 0.55 ? "Read" : "Delivered",
    });
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

// ---------- admissions ----------
export function seedAdmissions(): Admission[] {
  const docs = ["Birth Certificate", "Transfer Certificate", "Previous Report Card", "Aadhaar Card", "Address Proof", "Passport Photo"];
  const a = (i: number, applicant: string, gender: string, forC: string, guardian: string, status: Admission["status"], prev: string, d: number): Admission => ({
    id: "APP" + (2600 + i), applicant, gender, dob: `${2026 - (gradeNum(forC) + 5)}-0${(i % 9) + 1}-1${i % 9}`, applyingFor: forC, guardian,
    phone: `+91 98${10000000 + i * 777313}`.slice(0, 14), email: guardian.split(" ")[0].toLowerCase() + i + "@gmail.com", date: addDays(TODAY, -d), status,
    previousSchool: prev, documents: docs.slice(0, status === "Pending" ? 4 : 6), notes: "",
  });
  return [
    a(1, "Aarohi Bhatt", "Female", "Grade 5", "Nitin Bhatt", "Pending", "Delhi Public School", 1),
    a(2, "Vivaan Reddy", "Male", "Grade 1", "Srinivas Reddy", "Under Review", "Little Flower Preschool", 2),
    a(3, "Kavya Nambiar", "Female", "Grade 9", "Rajan Nambiar", "Approved", "National Public School", 4),
    a(4, "Ishaan Chawla", "Male", "Nursery", "Gaurav Chawla", "Pending", "—", 4),
    a(5, "Tara Subramaniam", "Female", "Grade 7", "Venkat Subramaniam", "Approved", "Kendriya Vidyalaya", 6),
    a(6, "Rehan Sheikh", "Male", "Grade 6", "Imran Sheikh", "Rejected", "St. Joseph's School", 7),
    a(7, "Mishti Ghosh", "Female", "LKG", "Subhasish Ghosh", "Under Review", "—", 8),
    a(8, "Aditya Rao", "Male", "Grade 11", "Prakash Rao", "Pending", "Bishop Cotton Boys' School", 9),
    a(9, "Prisha Kulkarni", "Female", "Grade 3", "Mahesh Kulkarni", "Approved", "Vidya Niketan", 11),
    a(10, "Zayn Mirza", "Male", "Grade 8", "Faisal Mirza", "Pending", "The Valley School", 12),
    a(11, "Sneha Pillai", "Female", "UKG", "Anoop Pillai", "Approved", "Tiny Tots Playschool", 14),
    a(12, "Karthik Subbu", "Male", "Grade 10", "Subbu Raman", "Rejected", "Sri Kumaran School", 15),
  ];
}

// ---------- homework ----------
export function seedHomework(): Homework[] {
  const h = (i: number, cls: string, sec: string, subject: string, title: string, d: number, due: number, t: string, type: Homework["type"] = "Homework", description = ""): Homework => ({
    id: "HW" + i, cls, section: sec, subject, title, assigned: addDays(TODAY, -d), due: addDays(TODAY, due), teacherId: t, type, description: description || `Complete the given exercise from the textbook and submit in your notebook. ${title}.`,
  });
  return [
    h(1, "Grade 10", "A", "MAT", "Quadratic Equations – Exercise 4.3", 1, 2, "T2"),
    h(2, "Grade 10", "A", "SCI", "Lab report: Ohm's Law experiment", 2, 3, "T3", "Assignment"),
    h(3, "Grade 10", "A", "ENG", "Letter writing: Complaint to the editor", 2, 1, "T1"),
    h(4, "Grade 10", "A", "SST", "Map work: Resources & Development", 3, 4, "T5", "Assignment"),
    h(5, "Grade 10", "A", "HIN", "Kritika – Chapter 2 summary", 1, 5, "T4"),
    h(6, "Grade 10", "A", "CS", "Python: Functions practice sheet", 3, -1, "T6"),
    h(7, "Grade 10", "B", "MAT", "Trigonometry – Worksheet 6", 1, 2, "T2"),
    h(8, "Grade 9", "A", "SCI", "Diagram: Structure of the cell", 1, 2, "T3"),
    h(9, "Grade 9", "A", "ENG", "Essay: The Role of Technology in Education", 2, 4, "T1", "Assignment"),
    h(10, "Grade 8", "A", "MAT", "Algebraic expressions – Exercise 9.1", 1, 1, "T7"),
    h(11, "Grade 6", "A", "SCI", "Collect 5 leaf samples & label", 2, 3, "T10", "Assignment"),
    h(12, "Grade 3", "A", "ENG", "Reading comprehension – page 42", 1, 1, "T9"),
  ];
}

export function seedEvents(): SchoolEvent[] {
  return [
    { date: "2026-11-14", title: "Children's Day Celebrations", kind: "Event" },
    { date: "2026-11-17", title: "Unit Test 2 begins (Grades 6–12)", kind: "Exam" },
    { date: "2026-11-22", title: "Parent-Teacher Meeting – Grades 9 & 10", kind: "Meeting" },
    { date: "2026-11-28", title: "Inter-House Sports Meet", kind: "Sports" },
    { date: "2026-12-05", title: "Annual Science Exhibition", kind: "Event" },
    { date: "2026-12-07", title: "Half-Yearly Examinations begin", kind: "Exam" },
    { date: "2026-12-25", title: "Christmas Holiday", kind: "Holiday" },
  ];
}

// ---------- timetable ----------
export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export type Slot = { type: "period" | "break"; n?: number; label: string; time: string };
export const SLOTS: Slot[] = [
  { type: "period", n: 1, label: "Period 1", time: "08:30 – 09:15" },
  { type: "period", n: 2, label: "Period 2", time: "09:15 – 10:00" },
  { type: "break", label: "Short Break", time: "10:00 – 10:20" },
  { type: "period", n: 3, label: "Period 3", time: "10:20 – 11:05" },
  { type: "period", n: 4, label: "Period 4", time: "11:05 – 11:50" },
  { type: "period", n: 5, label: "Period 5", time: "11:50 – 12:35" },
  { type: "break", label: "Lunch Break", time: "12:35 – 13:15" },
  { type: "period", n: 6, label: "Period 6", time: "13:15 – 14:00" },
  { type: "period", n: 7, label: "Period 7", time: "14:00 – 14:45" },
];
export function teacherFor(teachers: Teacher[], subject: string, cls: string, secIdx: number) {
  const list = teachers.filter(t => t.subjects.includes(subject) && t.status !== "Resigned");
  const pref = list.filter(t => t.classes.includes(cls));
  const pool = pref.length ? pref : list;
  return pool.length ? pool[(Math.abs(gradeNum(cls)) + secIdx) % pool.length] : undefined;
}
export function defaultCell(teachers: Teacher[], cls: string, secIdx: number, day: number, period: number): TTOverride {
  const g = gradeNum(cls);
  const subjects = g >= 11 ? ["ENG", "MAT", "CS", "PE", "ENG", "MAT", "CS"] : g <= 0 ? ["ENG", "MAT", "ART", "PE", "HIN", "ENG", "ART"] : g >= 6 ? ["ENG", "MAT", "SCI", "HIN", "SST", "CS", "PE", "ART"] : ["ENG", "MAT", "SCI", "HIN", "SST", "ART", "PE"];
  if (day === 5 && period >= 6) return { subject: period === 6 ? "PE" : "ART", teacherId: teacherFor(teachers, period === 6 ? "PE" : "ART", cls, secIdx)?.id ?? "" };
  const subject = subjects[(day * 3 + period + secIdx * 2) % subjects.length];
  return { subject, teacherId: teacherFor(teachers, subject, cls, secIdx)?.id ?? "" };
}

export const DASH = {
  enrollment: [
    { year: "2021-22", students: 1042 }, { year: "2022-23", students: 1096 }, { year: "2023-24", students: 1148 },
    { year: "2024-25", students: 1203 }, { year: "2025-26", students: 1226 }, { year: "2026-27", students: 1248 },
  ],
  feeMonthly: [
    { month: "Apr", collected: 685000, expected: 720000 }, { month: "May", collected: 540000, expected: 610000 },
    { month: "Jun", collected: 410000, expected: 480000 }, { month: "Jul", collected: 620000, expected: 700000 },
    { month: "Aug", collected: 455000, expected: 520000 }, { month: "Sep", collected: 390000, expected: 460000 },
    { month: "Oct", collected: 720000, expected: 810000 }, { month: "Nov", collected: 430000, expected: 825000 },
  ],
  attendanceWeek: [
    { day: "Mon", rate: 95.1 }, { day: "Tue", rate: 94.2 }, { day: "Wed", rate: 95.8 }, { day: "Thu", rate: 93.4 }, { day: "Fri", rate: 92.9 }, { day: "Sat", rate: 94.5 },
  ],
  trend: [
    { exam: "UT1", prev: 68, cur: 71 }, { exam: "UT2", prev: 70, cur: 0 }, { exam: "Midterm", prev: 66, cur: 69 },
    { exam: "Half-Yearly", prev: 69, cur: 0 }, { exam: "Pre-Final", prev: 72, cur: 0 }, { exam: "Annual", prev: 74, cur: 0 },
  ],
  expectedFees: 5125000, collectedFees: 4250000, outstanding: 875000, overdue: 320000,
  totals: { students: 1248, teachers: 86, classes: 32, parents: 1086 },
};

export const ACTIVITIES = [
  { who: "Meera Iyer", what: "uploaded Midterm marks for Grade 10-A (English)", when: "12 min ago", kind: "marks" },
  { who: "Accounts Office", what: "recorded payment of ₹18,500 for Diya Iyer", when: "34 min ago", kind: "fee" },
  { who: "System", what: "Sent weekly fee reminders to 17 parents via WhatsApp", when: "Mon, 10:00 AM", kind: "reminder" },
  { who: "Admissions Desk", what: "approved application APP2603 — Kavya Nambiar (Grade 9)", when: "2 hrs ago", kind: "admission" },
  { who: "Vikram Singh", what: "marked attendance for Grade 9-A", when: "3 hrs ago", kind: "attendance" },
  { who: "Principal", what: "published the Children's Day circular", when: "Yesterday", kind: "message" },
];

export const TASKS = [
  "Approve 3 pending admission applications",
  "Review Grade 10 students flagged for academic intervention",
  "Finalise Half-Yearly invigilation duty roster",
  "Verify transport fee discrepancies (4 records)",
  "Approve leave request — Mohammed Irfan",
];
