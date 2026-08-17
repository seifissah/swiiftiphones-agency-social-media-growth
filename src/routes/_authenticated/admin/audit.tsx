import { createFileRoute } from "@tanstack/react-router";
import { useAuditLogs } from "@/lib/data";
import { EmptyState, LoadingBlock, PageHeader } from "@/components/app/PageHeader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/admin/audit")({
  component: AuditLog,
});

function AuditLog() {
  const { data: logs, isLoading } = useAuditLogs();
  if (isLoading) return <LoadingBlock rows={4} />;

  return (
    <div>
      <PageHeader
        title="Audit log"
        description="Every administrative action taken on the platform."
      />
      {!logs?.length ? (
        <EmptyState title="No activity recorded yet" />
      ) : (
        <div className="panel overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {new Date(l.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>{l.admin_name ?? "Admin"}</TableCell>
                  <TableCell className="font-medium">{l.action}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {l.target_customer_name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{l.details || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
