import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useAccounts, useCustomers, useMetrics } from "@/lib/data";
import { PLATFORM_LABEL, compact, growth, nf } from "@/lib/platform";
import { LoadingBlock, PageHeader } from "@/components/app/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/accounts")({
  component: AdminAccounts,
});

function AdminAccounts() {
  const { data: accounts, isLoading } = useAccounts();
  const { data: customers } = useCustomers();
  const ids = useMemo(() => (accounts ?? []).map((a) => a.id), [accounts]);
  const { data: metrics } = useMetrics(ids);
  const [q, setQ] = useState("");
  const [platform, setPlatform] = useState("all");

  const nameById = useMemo(
    () => new Map((customers ?? []).map((c) => [c.id, c.full_name])),
    [customers],
  );

  const rows = useMemo(() => {
    return (accounts ?? [])
      .filter((a) => (platform === "all" ? true : a.platform === platform))
      .filter((a) =>
        q.trim()
          ? `${a.handle} ${nameById.get(a.customer_id) ?? ""}`
              .toLowerCase()
              .includes(q.trim().toLowerCase())
          : true,
      )
      .map((a) => {
        const rowsFor = (metrics ?? [])
          .filter((m) => m.social_account_id === a.id)
          .sort((x, y) => x.recorded_on.localeCompare(y.recorded_on));
        const last = rowsFor[rowsFor.length - 1];
        const prev = rowsFor[rowsFor.length - 2] ?? last;
        return {
          a,
          last,
          growthPct: last ? growth(last.followers, prev?.followers ?? last.followers) : 0,
        };
      });
  }, [accounts, metrics, q, platform, nameById]);

  if (isLoading) return <LoadingBlock rows={4} />;

  const platforms = ["all", ...new Set((accounts ?? []).map((a) => a.platform))];

  return (
    <div>
      <PageHeader
        title="Social accounts"
        description="Every tracked profile across all clients, with its latest snapshot."
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search handle or client…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {platforms.map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={cn(
                "rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
                platform === p
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-accent",
              )}
            >
              {p === "all" ? "All" : PLATFORM_LABEL[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="panel overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Handle</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-right">Followers</TableHead>
              <TableHead className="text-right">Growth</TableHead>
              <TableHead className="text-right">Reach</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ a, last, growthPct }) => (
              <TableRow key={a.id}>
                <TableCell>
                  <Button asChild variant="link" className="h-auto p-0">
                    <Link to="/admin/customers/$id" params={{ id: a.customer_id }}>
                      {nameById.get(a.customer_id) ?? "Unknown"}
                    </Link>
                  </Button>
                </TableCell>
                <TableCell>{PLATFORM_LABEL[a.platform] ?? a.platform}</TableCell>
                <TableCell className="text-muted-foreground">{a.handle}</TableCell>
                <TableCell className="text-muted-foreground">
                  {a.data_source === "api" ? "API" : "Manual"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {last ? nf.format(last.followers) : "—"}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right tabular-nums",
                    growthPct >= 0 ? "text-success" : "text-destructive",
                  )}
                >
                  {growthPct >= 0 ? "+" : ""}
                  {growthPct.toFixed(1)}%
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {last ? compact(last.reach) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
