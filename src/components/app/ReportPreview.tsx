import { MONTHS, nf } from "@/lib/platform";
import { REPORT_FIELDS, monthWindow, reportComparisons, type ReportDraft } from "@/lib/report-document";
export { monthWindow, buildAchievements, buildAcknowledgement, packSummary, unpackSummary, type ReportDraft } from "@/lib/report-document";

export function ReportPreview({ clientName, month, year, score, metrics, draft }: {
  clientName: string; month: number; year: number; score: number;
  metrics: import("@/lib/platform").Metric[]; draft: ReportDraft;
}) {
  const live = monthWindow(metrics, month, year);
  const snapshot = draft.snapshot ?? { clientName, accounts: [], current: live.cur, previous: live.prev, rows: live.rows };
  const cur = snapshot.current; const prev = snapshot.previous;
  return <div className="report-document space-y-8 text-sm leading-relaxed">
    <header className="border-y-2 border-primary py-8 text-center">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">Swiiftiphones Agency</p>
      <h2 className="mt-3 break-words font-display text-2xl font-semibold text-primary">{snapshot.clientName || clientName}</h2>
      <p className="mt-2 text-lg text-primary">Social Media Growth Report{draft.invoice ? " & Invoice" : ""}</p>
      <p className="mt-5 font-medium">{MONTHS[month - 1]} {year}</p>
      <p className="text-muted-foreground">Prepared by: {draft.preparedBy || "Swiiftiphones Agency"}</p>
      {snapshot.accounts.length ? <p className="mt-2 break-words text-xs text-muted-foreground">{snapshot.accounts.join(" · ")}</p> : null}
      <p className="mt-3 font-semibold">Performance score: {score}/100{draft.rating ? ` · ${draft.rating}` : ""}</p>
    </header>
    <Section title="Acknowledgement">{draft.acknowledgement}</Section>
    <Section title="1. Executive summary">{draft.summary}</Section>
    <section><h3 className="mb-3 font-display text-lg font-semibold text-primary">2. Key performance results</h3>
      <p className="mb-3 text-xs text-muted-foreground">Latest recorded snapshot for each month; not the sum of daily snapshots.</p>
      <div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-primary text-primary-foreground"><tr><th className="p-3">Metric</th><th className="p-3">Previous month</th><th className="p-3">Reporting month</th></tr></thead><tbody>{reportComparisons(snapshot).map(([label, before, after]) => <tr key={label} className="border-b border-border even:bg-muted/50"><td className="p-3">{label}</td><td className="p-3 tabular-nums">{before}</td><td className="p-3 font-semibold tabular-nums">{after}</td></tr>)}</tbody></table></div>
    </section>
    <section><h3 className="mb-3 font-display text-lg font-semibold text-primary">3. Before & after: followers</h3>
      <div className="grid grid-cols-3 gap-3 border-y border-border py-4">{[["Before", prev ? nf.format(prev.followers) : "Not recorded"], ["After", cur ? nf.format(cur.followers) : "Not recorded"], ["Net change", cur && prev ? `${cur.followers >= prev.followers ? "+" : ""}${nf.format(cur.followers - prev.followers)}` : "Not available"]].map(([label, value]) => <div key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 break-words text-base font-semibold sm:text-xl">{value}</p></div>)}</div>
    </section>
    <section><h3 className="mb-3 font-display text-lg font-semibold text-primary">4. Monthly performance overview</h3>
      <div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-muted text-muted-foreground"><tr><th className="p-2">Month</th><th className="p-2">Followers</th><th className="p-2">Views</th><th className="p-2">Engagement</th></tr></thead><tbody>{snapshot.rows.map(r => <tr key={r.key} className="border-b border-border"><td className="p-2">{r.label}</td><td className="p-2">{nf.format(r.followers)}</td><td className="p-2">{nf.format(r.views)}</td><td className="p-2">{r.engagement.toFixed(2)}%</td></tr>)}{!snapshot.rows.length ? <tr><td colSpan={4} className="p-4 text-muted-foreground">No monthly snapshots recorded.</td></tr> : null}</tbody></table></div>
    </section>
    {REPORT_FIELDS.filter(([key]) => key !== "summary" && key !== "acknowledgement").map(([key, label], i) => <Section key={key} title={`${i + 5}. ${label}`}>{draft[key] || "Awaiting account manager review."}</Section>)}
    {draft.invoice ? <section className="border-t-2 border-primary pt-6"><h3 className="text-xl font-semibold text-primary">Invoice</h3><dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2"><dt>Invoice number</dt><dd>{draft.invoice.number || "Not assigned"}</dd><dt>Invoice to</dt><dd>{snapshot.clientName}</dd><dt>Service</dt><dd>{draft.invoice.service || "Not provided"}</dd><dt>Total due</dt><dd className="font-semibold">{draft.invoice.amount || "Not set"} {draft.invoice.currency}</dd></dl><Section title="Payment terms">{draft.invoice.terms}</Section>{draft.invoice.contact ? <Section title="Contact">{draft.invoice.contact}</Section> : null}{draft.invoice.paymentDetails ? <Section title="Payment details">{draft.invoice.paymentDetails}</Section> : null}</section> : null}
  </div>;
}
function Section({ title, children }: { title: string; children: string }) {
  return <section><h3 className="mb-2 font-display text-lg font-semibold text-primary">{title}</h3><p className="whitespace-pre-line break-words">{children || "—"}</p></section>;
}
