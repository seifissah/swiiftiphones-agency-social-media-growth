import { MONTHS, compact, monthlyRollup, nf, scoreBand, type Metric } from "@/lib/platform";
import { cn } from "@/lib/utils";

export type ReportDraft = {
  acknowledgement: string;
  achievements: string;
  summary: string;
  recommendations: string;
};

export function monthWindow(metrics: Metric[], month: number, year: number) {
  const key = `${year}-${String(month).padStart(2, "0")}`;
  const rows = monthlyRollup(metrics).filter((r) => r.key <= key);
  const cur = rows.find((r) => r.key === key) ?? rows[rows.length - 1];
  const idx = cur ? rows.indexOf(cur) : -1;
  const prev = idx > 0 ? rows[idx - 1] : undefined;
  return { rows: rows.slice(-6), cur, prev };
}

export function buildAcknowledgement(name: string, period: string) {
  return `Thank you, ${name}, for trusting Swiiftiphones Agency with your social media growth. This report covers ${period} and reflects the work our team delivered across your connected accounts.`;
}

export function buildAchievements(metrics: Metric[], month: number, year: number) {
  const { cur, prev } = monthWindow(metrics, month, year);
  if (!cur) return "• No data recorded for this period yet.";
  const out: string[] = [];
  const gained = prev ? cur.followers - prev.followers : 0;
  out.push(`• ${gained >= 0 ? "Gained" : "Lost"} ${nf.format(Math.abs(gained))} followers, reaching ${nf.format(cur.followers)} in total.`);
  out.push(`• Average engagement rate of ${cur.engagement.toFixed(2)}%${prev ? ` (previous month ${prev.engagement.toFixed(2)}%)` : ""}.`);
  out.push(`• ${compact(cur.reach)} accounts reached and ${compact(cur.impressions)} impressions.`);
  out.push(`• ${nf.format(cur.posts)} posts tracked and ${compact(cur.views)} views.`);
  return out.join("\n");
}

export function ReportPreview({
  clientName,
  month,
  year,
  score,
  metrics,
  draft,
}: {
  clientName: string;
  month: number;
  year: number;
  score: number;
  metrics: Metric[];
  draft: ReportDraft;
}) {
  const band = scoreBand(score);
  const { rows, cur, prev } = monthWindow(metrics, month, year);
  const before = prev?.followers ?? 0;
  const after = cur?.followers ?? 0;
  const diff = after - before;
  return (
    <div className="space-y-5 text-sm">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border pb-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Monthly performance report</p>
          <h2 className="font-display text-xl font-semibold">{clientName}</h2>
          <p className="text-muted-foreground">{MONTHS[month - 1]} {year}</p>
        </div>
        <div className="text-right">
          <p className={cn("font-display text-3xl font-semibold", band.tone)}>{score}</p>
          <p className="text-xs text-muted-foreground">{band.label}</p>
        </div>
      </div>

      <Section title="Acknowledgement">{draft.acknowledgement}</Section>

      <div>
        <h3 className="mb-2 font-semibold">Before & after — followers</h3>
        <div className="grid grid-cols-3 gap-3">
          <Box label="Before" value={nf.format(before)} />
          <Box label="After" value={nf.format(after)} />
          <Box label="Change" value={`${diff >= 0 ? "+" : ""}${nf.format(diff)}`} tone={diff >= 0 ? "text-success" : "text-destructive"} />
        </div>
      </div>

      <div>
        <h3 className="mb-2 font-semibold">Monthly followers overview</h3>
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-left">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr><th className="p-2">Month</th><th className="p-2 text-right">Followers</th><th className="p-2 text-right">Gained</th><th className="p-2 text-right">Engagement</th><th className="p-2 text-right">Reach</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-t border-border">
                  <td className="p-2">{r.label}</td>
                  <td className="p-2 text-right">{nf.format(r.followers)}</td>
                  <td className={cn("p-2 text-right", r.gained >= 0 ? "text-success" : "text-destructive")}>{r.gained >= 0 ? "+" : ""}{nf.format(r.gained)}</td>
                  <td className="p-2 text-right">{r.engagement.toFixed(2)}%</td>
                  <td className="p-2 text-right">{compact(r.reach)}</td>
                </tr>
              ))}
              {!rows.length ? <tr><td colSpan={5} className="p-3 text-center text-muted-foreground">No metrics recorded.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>

      <Section title="What we achieved">{draft.achievements}</Section>
      <Section title="Summary">{draft.summary}</Section>
      <Section title="Recommendations for next month">{draft.recommendations}</Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: string }) {
  return (
    <div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 whitespace-pre-line text-muted-foreground">{children || "—"}</p>
    </div>
  );
}

function Box({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-md border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("font-display text-lg font-semibold", tone)}>{value}</p>
    </div>
  );
}

/** Pack/unpack the extra sections into the stored summary field. */
const ACK = "[[ACK]]";
const ACH = "[[ACH]]";
export function packSummary(d: ReportDraft) {
  return `${ACK}${d.acknowledgement}${ACH}${d.achievements}${ACH}${d.summary}`;
}
export function unpackSummary(s: string | null): Pick<ReportDraft, "acknowledgement" | "achievements" | "summary"> {
  if (!s || !s.startsWith(ACK)) return { acknowledgement: "", achievements: "", summary: s ?? "" };
  const [ack, ach, sum] = s.slice(ACK.length).split(ACH);
  return { acknowledgement: ack ?? "", achievements: ach ?? "", summary: sum ?? "" };
}
