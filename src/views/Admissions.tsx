"use client";
import React, { useState } from "react";
import { Inbox, Clock, CheckCircle2, XCircle, FileText, Plus, Image as ImageIcon } from "lucide-react";
import { useStore } from "@/lib/store";
import { Avatar, Badge, Btn, Card, CardHeader, Confirm, Empty, Field, Input, Modal, Pills, SearchBox, Select, Stat, Table, Td, Textarea, Tr, statusTone } from "@/components/ui";
import { Admission } from "@/lib/data";
import { TODAY, fmtDate } from "@/lib/utils";

export default function Admissions() {
  const { s, up, toast, nextId } = useStore();
  const [f, setF] = useState("All");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Admission | null>(null);
  const [add, setAdd] = useState(false);
  const a = s.admissions;
  const rows = a.filter(x => (f === "All" || x.status === f) && (!q || (x.applicant + x.guardian + x.id).toLowerCase().includes(q.toLowerCase())));
  const cur = sel ? a.find(x => x.id === sel.id) ?? null : null;
  const decide = (id: string, status: Admission["status"]) => { up(st => ({ admissions: st.admissions.map(x => x.id === id ? { ...x, status } : x) })); toast(status === "Approved" ? "Application approved — offer letter queued (simulated)" : status === "Rejected" ? "Application rejected" : "Marked under review", status === "Rejected" ? "warn" : "ok"); };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-xl font-semibold text-slate-900">Admissions</h1><p className="text-sm text-slate-500">Enquiries and applications for the 2027-28 intake</p></div><Btn icon={<Plus size={15} />} onClick={() => setAdd(true)}>New enquiry</Btn></div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Stat label="Total applications" value={String(a.length)} icon={<Inbox size={17} />} />
        <Stat label="Pending" value={String(a.filter(x => x.status === "Pending" || x.status === "Under Review").length)} icon={<Clock size={17} />} tone="amber" />
        <Stat label="Approved" value={String(a.filter(x => x.status === "Approved").length)} icon={<CheckCircle2 size={17} />} tone="green" />
        <Stat label="Rejected" value={String(a.filter(x => x.status === "Rejected").length)} icon={<XCircle size={17} />} tone="red" />
      </div>
      <Card pad={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4"><SearchBox value={q} onChange={setQ} placeholder="Search applicant, guardian or ID…" className="w-64" /><Pills tabs={["All", "Pending", "Under Review", "Approved", "Rejected"].map(x => ({ id: x, label: x }))} value={f} onChange={setF} /></div>
        <Table head={["Application", "Applicant", "Applying for", "Guardian", "Previous school", "Applied on", "Status", ""]}>
          {rows.map(x => <Tr key={x.id} onClick={() => setSel(x)}><Td className="font-mono text-xs">{x.id}</Td><Td><span className="flex items-center gap-2 font-medium text-slate-900"><Avatar name={x.applicant} size={26} />{x.applicant}</span></Td><Td>{x.applyingFor}</Td><Td>{x.guardian}</Td><Td className="text-xs text-slate-500">{x.previousSchool}</Td><Td className="text-xs">{fmtDate(x.date)}</Td><Td><Badge tone={statusTone(x.status)}>{x.status}</Badge></Td><Td><Btn size="sm" tone="soft">Review</Btn></Td></Tr>)}
        </Table>
        {rows.length === 0 && <Empty />}
      </Card>

      {cur && (
        <Modal open onClose={() => setSel(null)} wide="xl" title={`${cur.applicant} — ${cur.id}`} sub={`Applied ${fmtDate(cur.date)} for ${cur.applyingFor}`}
          footer={<><Badge tone={statusTone(cur.status)}>{cur.status}</Badge><span className="flex-1" /><Btn tone="secondary" onClick={() => decide(cur.id, "Under Review")}>Mark under review</Btn><Btn tone="danger" onClick={() => decide(cur.id, "Rejected")}>Reject</Btn><Btn tone="success" onClick={() => decide(cur.id, "Approved")}>Approve</Btn></>}>
          <div className="grid gap-6 lg:grid-cols-2">
            <div><CardHeader title="Student information" />
              <dl className="space-y-2.5 text-sm">{[["Applicant", cur.applicant], ["Gender", cur.gender], ["Date of birth", fmtDate(cur.dob)], ["Applying for", cur.applyingFor], ["Previous school", cur.previousSchool]].map(([k, v]) => <div key={k} className="flex justify-between border-b border-slate-50 pb-2"><dt className="text-slate-500">{k}</dt><dd className="font-medium text-slate-900">{v}</dd></div>)}</dl>
              <div className="mt-5"><CardHeader title="Guardian" /><dl className="space-y-2.5 text-sm">{[["Name", cur.guardian], ["Phone", cur.phone], ["Email", cur.email]].map(([k, v]) => <div key={k} className="flex justify-between border-b border-slate-50 pb-2"><dt className="text-slate-500">{k}</dt><dd className="font-medium text-slate-900">{v}</dd></div>)}</dl></div>
              <Field className="mt-4" label="Internal notes"><Textarea rows={2} value={cur.notes} onChange={e => up(st => ({ admissions: st.admissions.map(x => x.id === cur.id ? { ...x, notes: e.target.value } : x) }))} placeholder="Interview feedback, remarks…" /></Field>
            </div>
            <div><CardHeader title="Submitted documents" sub={`${cur.documents.length} of 6 uploaded`} />
              <div className="grid grid-cols-2 gap-3">{["Birth Certificate", "Transfer Certificate", "Previous Report Card", "Aadhaar Card", "Address Proof", "Passport Photo"].map(d => { const has = cur.documents.includes(d); return (
                <button key={d} onClick={() => toast(has ? `Previewing ${d} (placeholder)` : `${d} not uploaded yet`, has ? "ok" : "warn")} className={`flex h-28 flex-col items-center justify-center rounded-xl border-2 text-center transition ${has ? "border-slate-200 bg-slate-50 hover:border-brand-300" : "border-dashed border-slate-200 text-slate-300"}`}>
                  {has ? <ImageIcon className="text-brand-400" size={26} /> : <FileText size={24} />}<span className={`mt-2 px-2 text-xs font-medium ${has ? "text-slate-700" : ""}`}>{d}</span><span className="text-[10px] text-slate-400">{has ? "PDF · 240 KB" : "Missing"}</span>
                </button>); })}</div>
            </div>
          </div>
        </Modal>
      )}
      {add && <NewEnquiry onClose={() => setAdd(false)} />}
    </div>
  );
  function NewEnquiry({ onClose }: { onClose: () => void }) {
    const [e, setE] = useState({ applicant: "", gender: "Male", dob: "2018-01-01", applyingFor: "Grade 1", guardian: "", phone: "+91 ", email: "", previousSchool: "—" });
    return (
      <Modal open onClose={onClose} wide title="New admission enquiry" footer={<><Btn tone="secondary" onClick={onClose}>Cancel</Btn><Btn onClick={() => {
        if (!e.applicant.trim() || !e.guardian.trim()) return toast("Applicant and guardian names are required", "err");
        up(st => ({ admissions: [{ id: "APP" + (2600 + st.admissions.length + 1), ...e, date: TODAY, status: "Pending", documents: [], notes: "" }, ...st.admissions] }));
        toast("Enquiry recorded"); onClose();
      }}>Save enquiry</Btn></>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Applicant name"><Input value={e.applicant} onChange={x => setE({ ...e, applicant: x.target.value })} /></Field><Field label="Gender"><Select value={e.gender} onChange={x => setE({ ...e, gender: x.target.value })}><option>Male</option><option>Female</option></Select></Field>
          <Field label="Date of birth"><Input type="date" value={e.dob} onChange={x => setE({ ...e, dob: x.target.value })} /></Field><Field label="Applying for"><Select value={e.applyingFor} onChange={x => setE({ ...e, applyingFor: x.target.value })}>{s.classes.map(c => <option key={c.id}>{c.name}</option>)}</Select></Field>
          <Field label="Guardian name"><Input value={e.guardian} onChange={x => setE({ ...e, guardian: x.target.value })} /></Field><Field label="Phone"><Input value={e.phone} onChange={x => setE({ ...e, phone: x.target.value })} /></Field>
          <Field label="Email"><Input value={e.email} onChange={x => setE({ ...e, email: x.target.value })} /></Field><Field label="Previous school"><Input value={e.previousSchool} onChange={x => setE({ ...e, previousSchool: x.target.value })} /></Field>
        </div>
      </Modal>
    );
  }
}
export { Confirm };
