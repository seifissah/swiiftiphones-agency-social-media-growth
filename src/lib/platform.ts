export const PLATFORMS = [
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
  "twitter",
  "linkedin",
  "other",
] as const;

export type PlatformKey = (typeof PLATFORMS)[number];

export const PLATFORM_LABEL: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  twitter: "X / Twitter",
  linkedin: "LinkedIn",
  other: "Other",
};

export const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  active: "Active",
  rejected: "Rejected",
  suspended: "Suspended",
};

export const STATUS_TONE: Record<string, string> = {
  active: "bg-success/12 text-success border-success/25",
  pending: "bg-warning/15 text-warning-foreground border-warning/35",
  rejected: "bg-destructive/12 text-destructive border-destructive/25",
  suspended: "bg-muted text-muted-foreground border-border",
};

export type Metric = {
  id: string;
  social_account_id: string;
  recorded_on: string;
  followers: number;
  following: number;
  posts: number;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  reach: number;
  impressions: number;
  engagement_rate: number;
  source: string;
};

export type SocialAccount = {
  id: string;
  customer_id: string;
  platform: string;
  handle: string;
  profile_url: string | null;
  connection_status: string;
  data_source: string;
  last_synced_at: string | null;
};

export type Profile = {
  id: string;
  user_id: string | null;
  full_name: string;
  username: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  status: string;
  is_demo: boolean;
  last_login: string | null;
  updated_at: string;
  created_at: string;
};

export const nf = new Intl.NumberFormat("en-US");

export function compact(n: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(
    n,
  );
}

export function pct(n: number, digits = 1) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(digits)}%`;
}

export function growth(current: number, previous: number) {
  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export const RANGES = [
  { key: "7d", label: "7 Days", days: 7 },
  { key: "30d", label: "30 Days", days: 30 },
  { key: "3m", label: "3 Months", days: 92 },
  { key: "6m", label: "6 Months", days: 183 },
  { key: "12m", label: "12 Months", days: 366 },
] as const;

export function filterByRange(metrics: Metric[], days: number) {
  const cutoff = Date.now() - days * 86400000;
  const inRange = metrics.filter((m) => new Date(m.recorded_on).getTime() >= cutoff);
  return inRange.length >= 2 ? inRange : metrics.slice(-2);
}

/** Aggregate the latest metric row per account. */
export function latestPerAccount(metrics: Metric[]) {
  const byAccount = new Map<string, Metric>();
  for (const m of metrics) {
    const prev = byAccount.get(m.social_account_id);
    if (!prev || new Date(m.recorded_on) > new Date(prev.recorded_on)) {
      byAccount.set(m.social_account_id, m);
    }
  }
  return [...byAccount.values()];
}

export function previousPerAccount(metrics: Metric[]) {
  const byAccount = new Map<string, Metric[]>();
  for (const m of metrics) {
    const list = byAccount.get(m.social_account_id) ?? [];
    list.push(m);
    byAccount.set(m.social_account_id, list);
  }
  const out: Metric[] = [];
  for (const list of byAccount.values()) {
    list.sort((a, b) => a.recorded_on.localeCompare(b.recorded_on));
    const prev = list[list.length - 2] ?? list[0];
    if (prev) out.push(prev);
  }
  return out;
}

export function sumField(rows: Metric[], field: keyof Metric) {
  return rows.reduce((acc, r) => acc + Number(r[field] ?? 0), 0);
}

export function avgEngagement(rows: Metric[]) {
  if (!rows.length) return 0;
  return sumField(rows, "engagement_rate") / rows.length;
}

/** Build a date-keyed follower series across a set of accounts. */
export function buildSeries(metrics: Metric[]) {
  const byDate = new Map<string, { date: string; followers: number; engagement: number; n: number }>();
  for (const m of metrics) {
    const entry = byDate.get(m.recorded_on) ?? {
      date: m.recorded_on,
      followers: 0,
      engagement: 0,
      n: 0,
    };
    entry.followers += m.followers;
    entry.engagement += Number(m.engagement_rate);
    entry.n += 1;
    byDate.set(m.recorded_on, entry);
  }
  return [...byDate.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({
      date: e.date,
      label: new Date(e.date).toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      followers: e.followers,
      engagement: Number((e.engagement / Math.max(e.n, 1)).toFixed(2)),
    }));
}

export type ScoreWeights = {
  weight_growth: number;
  weight_engagement: number;
  weight_reach: number;
  weight_activity: number;
};

export const DEFAULT_WEIGHTS: ScoreWeights = {
  weight_growth: 40,
  weight_engagement: 30,
  weight_reach: 20,
  weight_activity: 10,
};

/** Configurable 0-100 performance score. */
export function performanceScore(
  input: { growthPct: number; engagement: number; reach: number; posts: number },
  w: ScoreWeights = DEFAULT_WEIGHTS,
) {
  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  const growthPart = clamp((input.growthPct + 5) / 20);
  const engagementPart = clamp(input.engagement / 8);
  const reachPart = clamp(input.reach / 250000);
  const activityPart = clamp(input.posts / 30);
  const total = w.weight_growth + w.weight_engagement + w.weight_reach + w.weight_activity || 100;
  const score =
    (growthPart * w.weight_growth +
      engagementPart * w.weight_engagement +
      reachPart * w.weight_reach +
      activityPart * w.weight_activity) *
    (100 / total);
  return Math.round(Math.max(0, Math.min(100, score)));
}

export function scoreBand(score: number) {
  if (score >= 75) return { label: "Excellent", tone: "text-success", dot: "bg-success" };
  if (score >= 50)
    return { label: "Needs improvement", tone: "text-warning-foreground", dot: "bg-warning" };
  return { label: "Poor", tone: "text-destructive", dot: "bg-destructive" };
}

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Build a per-month rollup from raw metric rows (last snapshot of each month). */
export type MonthlyRow = {
  key: string;
  label: string;
  followers: number;
  gained: number;
  engagement: number;
  reach: number;
  impressions: number;
  posts: number;
  views: number;
};

export function monthlyRollup(metrics: Metric[]): MonthlyRow[] {
  const byMonth = new Map<string, Metric[]>();
  for (const m of metrics) {
    const key = m.recorded_on.slice(0, 7);
    const list = byMonth.get(key) ?? [];
    list.push(m);
    byMonth.set(key, list);
  }
  const rows = [...byMonth.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, list]) => {
      // per account, keep the latest snapshot of that month
      const latest = latestPerAccount(list);
      const [y, mo] = key.split("-");
      return {
        key,
        label: `${MONTHS[Number(mo) - 1]} ${y}`,
        followers: sumField(latest, "followers"),
        gained: 0,
        engagement: Number(avgEngagement(latest).toFixed(2)),
        reach: sumField(latest, "reach"),
        impressions: sumField(latest, "impressions"),
        posts: sumField(latest, "posts"),
        views: sumField(latest, "views"),
      } satisfies MonthlyRow;
    });
  for (let i = 0; i < rows.length; i++) {
    const cur = rows[i]!;
    const prev = rows[i - 1];
    cur.gained = prev ? cur.followers - prev.followers : 0;
  }
  return rows;
}

export type PerformanceStats = {
  followers: number;
  gained: number;
  growthPct: number;
  engagement: number;
  reach: number;
  posts: number;
  score: number;
};

export function computeStats(metrics: Metric[]): PerformanceStats {
  const last = latestPerAccount(metrics);
  const prev = previousPerAccount(metrics);
  const followers = sumField(last, "followers");
  const prevFollowers = sumField(prev, "followers");
  const growthPct = growth(followers, prevFollowers);
  const engagement = avgEngagement(last);
  const reach = sumField(last, "reach");
  const posts = sumField(last, "posts");
  return {
    followers,
    gained: followers - prevFollowers,
    growthPct,
    engagement,
    reach,
    posts,
    score: performanceScore({ growthPct, engagement, reach, posts }),
  };
}

/** Performance-driven narrative summary for a reporting period. */
export function buildSummary(name: string, period: string, s: PerformanceStats) {
  const band = scoreBand(s.score);
  return `${name} finished ${period} with ${nf.format(s.followers)} followers (${
    s.gained >= 0 ? "+" : ""
  }${nf.format(s.gained)}, ${s.growthPct >= 0 ? "+" : ""}${s.growthPct.toFixed(
    1,
  )}%), an average engagement rate of ${s.engagement.toFixed(2)}% and ${compact(
    s.reach,
  )} total reach across ${nf.format(s.posts)} tracked posts. Overall performance is rated ${band.label.toLowerCase()} (${s.score}/100).`;
}

/** Recommendations derived strictly from the client's own performance numbers. */
export function buildRecommendations(s: PerformanceStats) {
  const out: string[] = [];

  if (s.growthPct < 0)
    out.push(
      "• Follower count is shrinking — audit recent posts for drops in relevance and pause anything that under-performed, then rebuild with proven formats.",
    );
  else if (s.growthPct < 3)
    out.push(
      "• Growth is below 3% — raise posting cadence and run collaborations or shout-outs to reach new audiences.",
    );
  else if (s.growthPct < 8)
    out.push("• Growth is steady — double down on the formats driving the current gains.");
  else
    out.push("• Growth is exceptional — capture it with a follow-focused CTA and consistent series.");

  if (s.engagement < 1.5)
    out.push(
      "• Engagement is very low — reply to every comment within the first hour and switch to conversation-driving formats (polls, questions, carousels).",
    );
  else if (s.engagement < 3)
    out.push("• Engagement is under benchmark — test hooks in the first 3 seconds and stronger captions.");
  else if (s.engagement < 6)
    out.push("• Engagement is healthy — repurpose the top posts across the other platforms.");
  else out.push("• Engagement is outstanding — turn the most-commented posts into a recurring series.");

  if (s.reach < 20000)
    out.push("• Reach is limited — publish short-form video with trending audio and platform-native hashtags.");
  else if (s.reach < 100000)
    out.push("• Reach is building — boost the two best organic posts to widen the top of funnel.");
  else out.push("• Reach is strong — convert it with clearer calls-to-action and link placements.");

  if (s.posts < 8)
    out.push("• Publishing volume is low — target at least 3 posts per week for consistent distribution.");
  else if (s.posts > 40)
    out.push("• Volume is very high — shift effort from quantity to production quality.");

  if (s.score < 50)
    out.push("• Priority this month: fix the weakest metric above before adding new channels.");

  return out.join("\n");
}
