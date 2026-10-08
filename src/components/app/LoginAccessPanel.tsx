import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { issueAccessCode } from "@/lib/access.functions";
import { logAudit } from "@/lib/data";
import { Button } from "@/components/ui/button";

export function LoginAccessPanel({ profileId, name }: { profileId: string; name: string }) {
  const issue = useServerFn(issueAccessCode);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ code: string; email: string } | null>(null);

  async function run() {
    if (!confirm(`Create a new access code for ${name}? Their current password will stop working.`))
      return;
    setBusy(true);
    try {
      const r = await issue({ data: { profileId } });
      setResult(r);
      void logAudit({
        adminName: "Admin",
        action: "Issued login access code",
        customerId: profileId,
        customerName: name,
      }).catch(() => undefined);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create code");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel p-5">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
        <KeyRound className="h-5 w-5" /> Login access
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        If this client forgot their password, create a one-time access code and give it to them.
        They sign in with their email and this code, then must choose a new password.
      </p>
      <Button className="mt-4" onClick={run} disabled={busy}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Create access code
      </Button>
      {result && (
        <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Give this to the client (shown only once)
          </p>
          <p className="mt-2 text-sm">Email: {result.email}</p>
          <div className="mt-1 flex items-center gap-2">
            <code className="font-mono text-lg font-semibold">{result.code}</code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                void navigator.clipboard.writeText(result.code);
                toast.success("Copied");
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
