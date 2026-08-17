import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCustomers, useMessages, notify } from "@/lib/data";
import { LoadingBlock, PageHeader } from "@/components/app/PageHeader";
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

export const Route = createFileRoute("/_authenticated/admin/messages")({
  component: AdminMessages,
});

function AdminMessages() {
  const qc = useQueryClient();
  const { data: customers } = useCustomers();
  const { data: messages, isLoading } = useMessages();
  const [customerId, setCustomerId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const nameById = useMemo(
    () => new Map((customers ?? []).map((c) => [c.id, c.full_name])),
    [customers],
  );

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId || !subject.trim() || !body.trim()) {
      toast.error("Choose a customer and fill in the message.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("messages").insert({
      customer_id: customerId,
      subject: subject.trim(),
      body: body.trim(),
      direction: "admin_to_customer",
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await notify(customerId, "New message from your account manager", subject.trim());
    setSubject("");
    setBody("");
    toast.success("Message sent.");
    qc.invalidateQueries({ queryKey: ["messages"] });
  }

  return (
    <div>
      <PageHeader
        title="Messages"
        description="Conversations with every client on the platform."
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <section className="space-y-3">
          {isLoading ? (
            <LoadingBlock rows={3} />
          ) : !messages?.length ? (
            <div className="panel p-8 text-center text-sm text-muted-foreground">
              No messages yet.
            </div>
          ) : (
            messages.map((m) => {
              const fromCustomer = m.direction === "customer_to_admin";
              return (
                <article
                  key={m.id}
                  className={cn("panel p-4", fromCustomer && "border-primary/25 bg-primary/[0.04]")}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{m.subject}</p>
                    <span className="text-xs text-muted-foreground">
                      {fromCustomer ? nameById.get(m.customer_id) ?? "Customer" : "You"} ·{" "}
                      {new Date(m.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{m.body}</p>
                </article>
              );
            })
          )}
        </section>

        <form onSubmit={send} className="panel h-fit space-y-3 p-5">
          <h2 className="font-display text-lg font-semibold">Send message</h2>
          <div className="space-y-2">
            <Label>Customer</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {(customers ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="s">Subject</Label>
            <Input id="s" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="b">Message</Label>
            <Textarea id="b" rows={6} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            <Send className="mr-1.5 h-4 w-4" /> Send
          </Button>
        </form>
      </div>
    </div>
  );
}
