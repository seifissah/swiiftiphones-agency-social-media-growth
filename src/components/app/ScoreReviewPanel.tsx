import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { computeStats, PLATFORM_LABEL, type Metric } from "@/lib/platform";
import { resolveScore, usePerformanceReviews, VERDICTS, type Review } from "@/lib/reviews";
import { notify } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Acc = { id: string; platform: string; handle: string };

export function ScoreReviewPanel({
  customerId,
  accounts,
  metrics,
}: {
  customerId: string;
  accounts: Acc[];
  metrics: Metric[];
}) {
  const { data: reviews } = usePerformanceReviews(customerId);
  const find = (accId: string | null) =>
    (reviews ?? []).find((r) => r.social_account_id === accId) ?? null;

  return (
    <div className="space-y-4">
      <div className="panel p-5">
        <h2 className="font-display text-lg font-semibold">Score & feedback</h2>
        <p className="text-sm text-muted-foreground">
          You decide what the client sees. Leave the score empty to use the automatic one, or type
          your own. Pick a rating and write a comment — the client sees your words instead of a
          bare number.
        </p>
      </div>
      <ReviewRow
        title="Overall performance"
        customerId={customerId}
        accountId={null}
        autoScore={computeStats(metrics).score}
        review={find(null)}
      />
      {accounts.map((a) => (
        <ReviewRow
          key={a.id}
          title={`${PLATFORM_LABEL[a.platform] ?? a.platform} · ${a.handle}`}
          customerId={customerId}
          accountId={a.id}
          autoScore={computeStats(metrics.filter((m) => m.social_account_id === a.id)).score}
          review={find(a.id)}
        />
      ))}
    </div>
  );
}

function ReviewRow({
  title,
  customerId,
  accountId,
  autoScore,
  review,
}: {
  title: string;
  customerId: string;
  accountId: string | null;
  autoScore: number;
  review: Review | null;
}) {
  const qc = useQueryClient();
  const [score, setScore] = useState("");
  const [verdict, setVerdict] = useState("auto");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setScore(review?.score != null ? String(review.score) : "");
    setVerdict(review?.verdict ?? "auto");
    setComment(review?.comment ?? "");
  }, [review]);

  const preview = resolveScore(autoScore, {
    ...(review ?? ({} as Review)),
    score: score.trim() ? Number(score) : null,
    verdict,
    comment,
  });

  async function save(tellClient: boolean) {
    const n = score.trim() ? Number(score) : null;
    if (n !== null && (!Number.isFinite(n) || n < 0 || n > 100)) {
      toast.error("Score must be between 0 and 100.");
      return;
    }
    setSaving(true);
    const payload = {
      customer_id: customerId,
      social_account_id: accountId,
      score: n === null ? null : Math.round(n),
      verdict,
      comment: comment.trim() || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = review
      ? await supabase.from("performance_reviews").update(payload).eq("id", review.id)
      : await supabase.from("performance_reviews").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (tellClient) {
      await notify(customerId, "New feedback from your account manager", `${title}: ${preview.label}.`);
    }
    toast.success("Saved.");
    qc.invalidateQueries({ queryKey: ["performance-reviews", customerId] });
  }

  return (
    <section className="panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-xs text-muted-foreground">Automatic score: {autoScore}/100</p>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5">
          <span className={cn("h-2.5 w-2.5 rounded-full", preview.dot)} />
          <span className="text-sm font-semibold">{preview.score}/100</span>
          <span className={cn("text-sm", preview.tone)}>{preview.label}</span>
          <span className="text-xs text-muted-foreground">· client sees this</span>
        </div>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-[140px_220px_1fr]">
        <div className="space-y-1.5">
          <Label>Your score</Label>
          <Input
            type="number"
            min={0}
            max={100}
            placeholder={`Auto (${autoScore})`}
            value={score}
            onChange={(e) => setScore(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Rating</Label>
          <Select value={verdict} onValueChange={setVerdict}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Automatic</SelectItem>
              {Object.entries(VERDICTS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Your comment to the client</Label>
          <Textarea
            rows={3}
            placeholder="e.g. Great reach this month. Let's post 2 more reels a week to grow faster."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button variant="outline" disabled={saving} onClick={() => save(false)}>
          Save
        </Button>
        <Button disabled={saving} onClick={() => save(true)}>
          Save & notify client
        </Button>
      </div>
    </section>
  );
}
