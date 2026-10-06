import { MONTHS, monthlyRollup, latestPerAccount, sumField, nf, compact, type Metric, type MonthlyRow } from "@/lib/platform";

export const REPORT_FIELDS = [
  ["acknowledgement", "Acknowledgement"], ["summary", "Executive summary"],
  ["achievements", "Key results & achievements"], ["whatWorked", "What worked best"],
  ["contentAnalysis", "Monthly content analysis"], ["growthDrivers", "Growth drivers"],
  ["improvements", "Areas for improvement"], ["recommendations", "Next-month recommendation pillars"],
  ["strategy", "Next-month strategy"], ["targets", "Targets for the next 30 days"],
] as const;

export type ReportSnapshot = {
  clientName: string;
  rows: MonthlyRow[];
  current?: MonthlyRow;
  previous?: MonthlyRow;
  interactions?: number;
  previousInteractions?: number;
  accounts: string[];
};
export type ReportDraft = {
  acknowledgement: string; achievements: string; summary: string; recommendations: string;
  whatWorked?: string; contentAnalysis?: string; growthDrivers?: string; improvements?: string;
  strategy?: string; targets?: string; preparedBy?: string; rating?: string;
  snapshot?: ReportSnapshot;
  invoice?: { number: string; service: string; amount: string; currency: string; terms: string; contact: string; paymentDetails: string };
};

export function monthWindow(metrics: Metric[], month: number, year: number) {
  const key = `${year}-${String(month).padStart(2, "0")}`;
  const all = monthlyRollup(metrics).filter(r => r.key <= key);
  const cur = all.find(r => r.key === key);
  const previousKey = `${month === 1 ? year - 1 : year}-${String(month === 1 ? 12 : month - 1).padStart(2, "0")}`;
  const prev = all.find(r => r.key === previousKey);
  return { rows: all.slice(-6), cur, prev };
}
export function buildAcknowledgement(name: string, period: string) {
  return `Thank you, ${name}, for trusting Swiiftiphones Agency with your social media growth. This report reviews ${period}, the recorded results and our priorities for the next month.`;
}
export function buildAchievements(metrics: Metric[], month: number, year: number) {
  const { cur, prev } = monthWindow(metrics, month, year);
  if (!cur) return "No performance snapshot has been recorded for this month.";
  return [prev ? `• ${cur.followers >= prev.followers ? "Gained" : "Lost"} ${nf.format(Math.abs(cur.followers - prev.followers))} followers compared with the previous month.` : "• Follower growth comparison is unavailable until a previous-month snapshot is recorded.",
    `• ${nf.format(cur.followers)} followers in the latest monthly snapshot.`,
    `• ${compact(cur.views)} views and ${compact(cur.reach)} reach recorded.`,
    `• ${cur.engagement.toFixed(2)}% average engagement across tracked accounts.`].join("\n");
}
export function createReportDraft(name: string, metrics: Metric[], month: number, year: number, preparedBy: string, accounts: string[]): ReportDraft {
  const { cur, prev, rows } = monthWindow(metrics, month, year);
  const key = `${year}-${String(month).padStart(2, "0")}`;
  const interactionCount = (period: string) => {
    const latest = latestPerAccount(metrics.filter(m => m.recorded_on.slice(0, 7) === period));
    return sumField(latest, "likes") + sumField(latest, "comments") + sumField(latest, "shares");
  };
  const period = `${MONTHS[month - 1]} ${year}`;
  const noData = "No snapshot recorded for the selected month. Add and confirm performance data before setting the next month's strategy.";
  const comparison = cur && prev ? `Followers changed by ${nf.format(cur.followers - prev.followers)} (${prev.followers ? (((cur.followers - prev.followers) / prev.followers) * 100).toFixed(1) : "not comparable"}${prev.followers ? "%" : ""}) from the previous month.` : "A previous-month snapshot is not available, so month-over-month growth cannot yet be confirmed.";
  return {
    acknowledgement: buildAcknowledgement(name, period),
    summary: cur ? `${name} closed ${period} with ${nf.format(cur.followers)} followers, ${compact(cur.views)} recorded views, ${compact(cur.reach)} recorded reach and an average engagement rate of ${cur.engagement.toFixed(2)}%. ${comparison}` : noData,
    achievements: buildAchievements(metrics, month, year),
    whatWorked: cur ? `The recorded results show ${compact(cur.reach)} reach and ${cur.engagement.toFixed(2)}% engagement. Confirm which posts contributed most before attributing growth to a specific format or campaign.` : noData,
    contentAnalysis: cur ? `${nf.format(cur.posts)} posts are recorded in the latest account snapshots. Reels, Stories, individual post performance and watch time are not tracked separately; add your verified content breakdown and top-performing examples here.` : noData,
    growthDrivers: cur ? `${comparison}\nReview posting consistency, audience response and the best-performing content to identify verified growth drivers.` : noData,
    improvements: cur ? (cur.engagement < 3 ? "Strengthen audience interaction: test clearer hooks and captions, respond to comments, and compare engagement by format." : "Maintain audience engagement while improving calls-to-action and measuring enquiries from social activity.") : noData,
    recommendations: cur ? [prev && cur.followers < prev.followers ? "• Audience growth: review declining formats and test relevant collaborations." : "• Audience growth: continue testing discovery-focused content and clear follow calls-to-action.", cur.engagement < 3 ? "• Engagement: test questions, useful carousels and stronger opening hooks." : "• Engagement: repeat confirmed high-engagement themes and respond consistently.", "• Conversion: add clear enquiry calls-to-action and track customer responses.", "• Measurement: record comparable monthly snapshots and individual content results."].join("\n") : noData,
    strategy: cur ? "Week 1: review verified content results and choose themes.\nWeek 2: test new hooks and calls-to-action.\nWeek 3: repeat confirmed winners and engage with the audience.\nWeek 4: compare results, document learnings and prepare the next monthly review." : noData,
    targets: "Targets pending your approval: set realistic follower, views, engagement, publishing and enquiry targets from the verified monthly baseline.",
    preparedBy,
    snapshot: { clientName: name, current: cur, previous: prev, rows, accounts, interactions: cur ? interactionCount(key) : undefined, previousInteractions: prev ? interactionCount(prev.key) : undefined },
  };
}

const VERSION = "[[REPORT_V2]]";
export function packSummary(draft: ReportDraft) { return VERSION + JSON.stringify(draft); }
export function unpackSummary(value: string | null): ReportDraft {
  if (value?.startsWith(VERSION)) {
    try {
      const d = JSON.parse(value.slice(VERSION.length));
      if (d && typeof d === "object" && typeof d.summary === "string") return d as ReportDraft;
    } catch { /* Fall back to readable legacy content. */ }
  }
  if (value?.startsWith("[[ACK]]")) {
    const [acknowledgement, achievements, summary] = value.slice(7).split("[[ACH]]");
    return { acknowledgement: acknowledgement ?? "", achievements: achievements ?? "", summary: summary ?? "", recommendations: "" };
  }
  return { acknowledgement: "", achievements: "", summary: value ?? "", recommendations: "" };
}

export function reportComparisons(snapshot: ReportSnapshot) {
  const c = snapshot.current; const p = snapshot.previous;
  const val = (n: number | undefined, suffix = "") => n === undefined ? "Not recorded" : `${nf.format(n)}${suffix}`;
  return [
    ["Followers", val(p?.followers), val(c?.followers)],
    ["Views", val(p?.views), val(c?.views)],
    ["Reach", val(p?.reach), val(c?.reach)],
    ["Interactions (likes, comments, shares)", val(snapshot.previousInteractions), val(snapshot.interactions)],
    ["Posts in latest snapshot", val(p?.posts), val(c?.posts)],
    ["Average engagement", val(p?.engagement, "%"), val(c?.engagement, "%")],
  ];
}