import { REPORT_FIELDS, type ReportDraft } from "@/lib/report-document";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export function ReportEditor({ draft, onChange }: { draft: ReportDraft; onChange: (draft: ReportDraft) => void }) {
  return <div className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1"><Label htmlFor="report-preparer">Prepared by</Label><Input id="report-preparer" value={draft.preparedBy ?? ""} onChange={e => onChange({ ...draft, preparedBy: e.target.value })} /></div>
      <div className="space-y-1"><Label htmlFor="report-rating">Client-facing performance rating</Label><Input id="report-rating" value={draft.rating ?? ""} onChange={e => onChange({ ...draft, rating: e.target.value })} /></div>
    </div>
    {REPORT_FIELDS.map(([key, label]) => <div key={key} className="space-y-1"><Label htmlFor={`report-${key}`}>{label}</Label><Textarea id={`report-${key}`} rows={4} value={draft[key] ?? ""} onChange={e => onChange({ ...draft, [key]: e.target.value })} /></div>)}
    <div className="flex items-center justify-between border-t border-border pt-4"><Label htmlFor="report-invoice">Include invoice</Label><Switch id="report-invoice" checked={!!draft.invoice} onCheckedChange={checked => onChange({ ...draft, invoice: checked ? { number: "", service: "", amount: "", currency: "TZS", terms: "", contact: "", paymentDetails: "" } : undefined })} /></div>
    {draft.invoice ? <div className="grid gap-3 sm:grid-cols-2">{([['number', 'Invoice number'], ['service', 'Service'], ['amount', 'Amount'], ['currency', 'Currency'], ['terms', 'Payment terms'], ['contact', 'Contact details'], ['paymentDetails', 'Payment details']] as const).map(([key, label]) => <div key={key} className="space-y-1"><Label htmlFor={`invoice-${key}`}>{label}</Label><Input id={`invoice-${key}`} type={key === 'amount' ? 'number' : 'text'} min={key === 'amount' ? 0 : undefined} value={draft.invoice?.[key] ?? ""} onChange={e => { if (draft.invoice) onChange({ ...draft, invoice: { ...draft.invoice, [key]: e.target.value } }); }} /></div>)}</div> : null}
  </div>;
}