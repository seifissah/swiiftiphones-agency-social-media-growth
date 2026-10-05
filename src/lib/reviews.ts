import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { scoreBand } from "@/lib/platform";

export type Review = {
  id: string;
  customer_id: string;
  social_account_id: string | null;
  score: number | null;
  verdict: string;
  comment: string | null;
  updated_at: string;
};

export const VERDICTS: Record<string, { label: string; tone: string; dot: string }> = {
  excellent: { label: "Excellent", tone: "text-success", dot: "bg-success" },
  good: { label: "Good progress", tone: "text-primary", dot: "bg-primary" },
  improving: { label: "Improving", tone: "text-warning-foreground", dot: "bg-warning" },
  needs_improvement: { label: "Needs improvement", tone: "text-warning-foreground", dot: "bg-warning" },
  priority: { label: "Priority focus", tone: "text-destructive", dot: "bg-destructive" },
};

export function usePerformanceReviews(customerId?: string) {
  return useQuery({
    queryKey: ["performance-reviews", customerId],
    enabled: !!customerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("performance_reviews")
        .select("*")
        .eq("customer_id", customerId!);
      if (error) throw error;
      return (data ?? []) as Review[];
    },
  });
}

/** Final score/label: the admin's decision wins over the automatic calculation. */
export function resolveScore(autoScore: number, review?: Review | null) {
  const score = review?.score ?? autoScore;
  const v = review && review.verdict !== "auto" ? VERDICTS[review.verdict] : undefined;
  const band = v ?? scoreBand(score);
  return {
    score,
    label: band.label,
    tone: band.tone,
    dot: band.dot,
    comment: review?.comment?.trim() || null,
    manual: !!review && (review.score !== null || review.verdict !== "auto"),
  };
}
