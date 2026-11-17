"use client";
import React, { useEffect, useState } from "react";
import { X, Search, ChevronLeft, ChevronRight, AlertTriangle, Inbox } from "lucide-react";
import { cx, initials } from "@/lib/utils";

export function Card({ children, className, pad = true }: { children: React.ReactNode; className?: string; pad?: boolean }) {
  return <div className={cx("rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]", pad && "p-5", className)}>{children}</div>;
}
export function CardHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
      <div>
        <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
        {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

const btnTones = {
  primary: "bg-brand-700 text-white hover:bg-brand-800 shadow-sm",
  secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
  ghost: "text-slate-600 hover:bg-slate-100",
  danger: "bg-red-600 text-white hover:bg-red-700",
  soft: "bg-brand-50 text-brand-700 hover:bg-brand-100",
  success: "bg-emerald-600 text-white hover:bg-emerald-700",
};
export function Btn({ tone = "primary", size = "md", icon, children, className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: keyof typeof btnTones; size?: "sm" | "md"; icon?: React.ReactNode }) {
  return (
    <button {...p} className={cx("inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50", size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2 text-sm", btnTones[tone], className)}>
      {icon}{children}
    </button>
  );
}

const badgeTones: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/15", red: "bg-red-50 text-red-700 ring-red-600/15",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20", blue: "bg-brand-50 text-brand-700 ring-brand-600/15",
  slate: "bg-slate-100 text-slate-600 ring-slate-500/15", violet: "bg-violet-50 text-violet-700 ring-violet-600/15",
};
export function Badge({ tone = "slate", children }: { tone?: string; children: React.ReactNode }) {
  return <span className={cx("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset", badgeTones[tone] ?? badgeTones.slate)}>{children}</span>;
}
export const statusTone = (s: string) =>
  ({ Active: "green", Paid: "green", Delivered: "green", Read: "blue", Approved: "green", Completed: "green", Present: "green", Pass: "green", Sent: "green", Resolved: "green",
     Pending: "amber", Partial: "amber", Late: "amber", Scheduled: "blue", "Under Review": "amber", "On Leave": "amber", Ongoing: "blue", Unpaid: "red", Inactive: "slate",
     Failed: "red", Overdue: "red", Absent: "red", Fail: "red", Rejected: "red", Transferred: "slate", Resigned: "slate", "Not notified": "slate", Queued: "amber" } as Record<string, string>)[s] ?? "slate";

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const hues = [220, 250, 200, 270, 190, 235];
  const h = hues[name.length % hues.length];
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold" style={{ width: size, height: size, fontSize: size * 0.36, background: `hsl(${h} 70% 94%)`, color: `hsl(${h} 50% 32%)` }}>
      {initials(name)}
    </span>
  );
}

export function Stat({ label, value, sub, icon, tone = "blue", trend }: { label: string; value: string; sub?: string; icon?: React.ReactNode; tone?: string; trend?: { v: string; up: boolean } }) {
  const tones: Record<string, string> = { blue: "bg-brand-50 text-brand-700", green: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700", red: "bg-red-50 text-red-600", violet: "bg-violet-50 text-violet-700" };
  return (
    <Card className="!p-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-1.5 truncate text-[22px] font-semibold tracking-tight text-slate-900">{value}</p>
        </div>
        {icon && <span className={cx("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", tones[tone])}>{icon}</span>}
      </div>
      {(sub || trend) && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
          {trend && <span className={cx("font-medium", trend.up ? "text-emerald-600" : "text-red-600")}>{trend.up ? "▲" : "▼"} {trend.v}</span>}
          {sub}
        </p>
      )}
    </Card>
  );
}

export function Modal({ open, onClose, title, sub, children, footer, wide }: { open: boolean; onClose: () => void; title: string; sub?: string; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean | "xl" }) {
  useEffect(() => {
    if (!open) return;
    const f = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="no-print absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className={cx("pop relative flex max-h-[90vh] w-full flex-col rounded-2xl bg-white shadow-2xl", wide === "xl" ? "max-w-5xl" : wide ? "max-w-2xl" : "max-w-lg")}>
        <div className="no-print flex items-start justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="no-print flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-3 rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  );
}

export function Confirm({ open, title, message, confirmLabel = "Delete", onConfirm, onClose, tone = "danger" }: { open: boolean; title: string; message: React.ReactNode; confirmLabel?: string; onConfirm: () => void; onClose: () => void; tone?: "danger" | "primary" }) {
  return (
    <Modal open={open} onClose={onClose} title={title} footer={<><Btn tone="secondary" onClick={onClose}>Cancel</Btn><Btn tone={tone} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Btn></>}>
      <div className="flex gap-3">
        <span className={cx("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", tone === "danger" ? "bg-red-50 text-red-600" : "bg-brand-50 text-brand-700")}><AlertTriangle size={20} /></span>
        <div className="text-sm text-slate-600">{message}</div>
      </div>
    </Modal>
  );
}

export function Tabs({ tabs, value, onChange, className }: { tabs: { id: string; label: string; icon?: React.ReactNode; count?: number }[]; value: string; onChange: (id: string) => void; className?: string }) {
  return (
    <div className={cx("flex gap-1 overflow-x-auto border-b border-slate-200", className)}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} className={cx("-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors", value === t.id ? "border-brand-700 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-800")}>
          {t.icon}{t.label}{t.count !== undefined && <span className="rounded-full bg-slate-100 px-1.5 text-[10px] text-slate-600">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}
export function Pills({ tabs, value, onChange }: { tabs: { id: string; label: string }[]; value: string; onChange: (id: string) => void }) {
  return (
    <div className="inline-flex rounded-lg bg-slate-100 p-1">
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} className={cx("rounded-md px-3 py-1.5 text-xs font-medium transition", value === t.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800")}>{t.label}</button>
      ))}
    </div>
  );
}

const field = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100";
export function Field({ label, children, hint, className }: { label: string; children: React.ReactNode; hint?: string; className?: string }) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} {...p} className={cx(field, className)} />;
});
export function Select({ className, children, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...p} className={cx(field, "pr-8", className)}>{children}</select>;
}
export function Textarea({ className, ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...p} className={cx(field, "resize-y", className)} />;
}
export function SearchBox({ value, onChange, placeholder = "Search…", className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cx("relative", className)}>
      <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cx(field, "pl-9")} />
    </div>
  );
}
export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={cx("relative h-6 w-11 shrink-0 rounded-full transition-colors", on ? "bg-brand-700" : "bg-slate-300")}>
      <span className={cx("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", on ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}
export function Check({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-[#263478]" />
      {label}
    </label>
  );
}

export function Progress({ value, tone = "blue", h = 6 }: { value: number; tone?: string; h?: number }) {
  const c: Record<string, string> = { blue: "bg-brand-600", green: "bg-emerald-500", amber: "bg-amber-500", red: "bg-red-500" };
  return <div className="w-full overflow-hidden rounded-full bg-slate-100" style={{ height: h }}><div className={cx("h-full rounded-full", c[tone])} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>;
}

export function Empty({ text = "No records found" }: { text?: string }) {
  return <div className="flex flex-col items-center justify-center py-12 text-slate-400"><Inbox size={28} /><p className="mt-2 text-sm">{text}</p></div>;
}

export function Table({ head, children, className }: { head: (string | { label: string; right?: boolean })[]; children: React.ReactNode; className?: string }) {
  return (
    <div className={cx("overflow-x-auto", className)}>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {head.map((h, i) => { const o = typeof h === "string" ? { label: h } : h; return <th key={i} className={cx("whitespace-nowrap px-4 py-2.5", (o as { right?: boolean }).right && "text-right")}>{o.label}</th>; })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}
export const Td = ({ children, right, className }: { children?: React.ReactNode; right?: boolean; className?: string }) => <td className={cx("px-4 py-2.5 align-middle text-slate-700", right && "text-right", className)}>{children}</td>;
export const Tr = ({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) => <tr onClick={onClick} className={cx("transition-colors hover:bg-slate-50/70", onClick && "cursor-pointer", className)}>{children}</tr>;

export function usePaged<T>(items: T[], size = 10) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(items.length / size));
  useEffect(() => { if (page > pages) setPage(pages); }, [pages, page]);
  return { page, setPage, pages, slice: items.slice((page - 1) * size, page * size), total: items.length, size };
}
export function Pager({ p }: { p: { page: number; setPage: (n: number) => void; pages: number; total: number; size: number } }) {
  if (p.total === 0) return null;
  const from = (p.page - 1) * p.size + 1, to = Math.min(p.total, p.page * p.size);
  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
      <span>Showing {from}–{to} of {p.total}</span>
      <div className="flex items-center gap-1">
        <button disabled={p.page === 1} onClick={() => p.setPage(p.page - 1)} className="rounded-md border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-40"><ChevronLeft size={14} /></button>
        {Array.from({ length: p.pages }, (_, i) => i + 1).slice(Math.max(0, p.page - 3), p.page + 2).map(n => (
          <button key={n} onClick={() => p.setPage(n)} className={cx("h-7 min-w-7 rounded-md px-2 font-medium", n === p.page ? "bg-brand-700 text-white" : "text-slate-600 hover:bg-slate-100")}>{n}</button>
        ))}
        <button disabled={p.page === p.pages} onClick={() => p.setPage(p.page + 1)} className="rounded-md border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-40"><ChevronRight size={14} /></button>
      </div>
    </div>
  );
}

export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {sub && <p className="mt-0.5 text-sm text-slate-500">{sub}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}

export function Toasts({ toasts }: { toasts: { id: number; msg: string; tone: string }[] }) {
  const col: Record<string, string> = { ok: "bg-emerald-500", warn: "bg-amber-500", err: "bg-red-500" };
  return (
    <div className="no-print pointer-events-none fixed bottom-5 right-5 z-[60] flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className="slidein pointer-events-auto flex max-w-sm items-start gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-xl">
          <span className={cx("mt-1.5 h-2 w-2 shrink-0 rounded-full", col[t.tone])} />{t.msg}
        </div>
      ))}
    </div>
  );
}

export const CHART = { navy: "#263478", blue: "#5f76c8", light: "#bcc7ec", green: "#10b981", amber: "#f59e0b", red: "#ef4444", violet: "#8b5cf6", slate: "#94a3b8", grid: "#eef0f6" };
