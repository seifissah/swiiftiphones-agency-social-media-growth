import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCustomers, useMessages, notify } from "@/lib/data";
import { AvatarCircle } from "@/components/app/AvatarCircle";
import { LoadingBlock, PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/messages")({
  component: AdminMessages,
});

function AdminMessages() {
  const qc = useQueryClient();
  const { data: customers, isLoading: loadingCustomers } = useCustomers();
  const { data: messages, isLoading: loadingMessages } = useMessages();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const selected = (customers ?? []).find((c) => c.id === selectedId) ?? null;

  const thread = useMemo(
    () =>
      (messages ?? [])
        .filter((m) => m.customer_id === selectedId)
        .sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [messages, selectedId],
  );

  const lastByCustomer = useMemo(() => {
    const map = new Map<string, { at: string; preview: string; unread: number }>();
    for (const m of messages ?? []) {
      const existing = map.get(m.customer_id);
      const unreadFromCustomer = m.direction === "customer_to_admin" && !m.read ? 1 : 0;
      if (!existing || m.created_at > existing.at) {
        map.set(m.customer_id, {
          at: m.created_at,
          preview: m.subject,
          unread: (existing?.unread ?? 0) + unreadFromCustomer,
        });
      } else {
        existing.unread += unreadFromCustomer;
      }
    }
    return map;
  }, [messages]);

  async function openThread(customerId: string) {
    setSelectedId(customerId);
    // mark customer messages as read
    const unread = (messages ?? []).filter(
      (m) => m.customer_id === customerId && m.direction === "customer_to_admin" && !m.read,
    );
    if (unread.length) {
      await supabase
        .from("messages")
        .update({ read: true })
        .in(
          "id",
          unread.map((m) => m.id),
        );
      qc.invalidateQueries({ queryKey: ["messages"] });
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !subject.trim() || !body.trim()) {
      toast.error("Fill in the subject and message.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("messages").insert({
      customer_id: selectedId,
      subject: subject.trim(),
      body: body.trim(),
      direction: "admin_to_customer",
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await notify(selectedId, "New message from your account manager", subject.trim());
    setSubject("");
    setBody("");
    toast.success("Message sent.");
    qc.invalidateQueries({ queryKey: ["messages"] });
  }

  return (
    <div>
      <PageHeader
        title="Messages"
        description="Pick a client to see your full conversation with them."
      />
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="panel h-fit divide-y divide-border overflow-hidden">
          {loadingCustomers ? (
            <div className="p-4">
              <LoadingBlock rows={3} />
            </div>
          ) : !(customers ?? []).length ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No customers yet.</p>
          ) : (
            (customers ?? []).map((c) => {
              const last = lastByCustomer.get(c.id);
              const active = c.id === selectedId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => openThread(c.id)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                    active && "bg-primary/[0.06]",
                  )}
                >
                  <AvatarCircle name={c.full_name} avatarPath={c.avatar_url} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.full_name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {last ? last.preview : "No messages yet"}
                    </p>
                  </div>
                  {last?.unread ? (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                      {last.unread}
                    </span>
                  ) : null}
                </button>
              );
            })
          )}
        </aside>

        <section className="space-y-4">
          {!selected ? (
            <div className="panel p-10 text-center text-sm text-muted-foreground">
              Choose a client on the left to open their conversation.
            </div>
          ) : (
            <>
              <div className="panel flex items-center gap-3 p-4">
                <AvatarCircle name={selected.full_name} avatarPath={selected.avatar_url} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{selected.full_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{selected.email}</p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to="/admin/customers/$id" params={{ id: selected.id }}>
                    View profile
                  </Link>
                </Button>
              </div>

              <div className="space-y-3">
                {loadingMessages ? (
                  <LoadingBlock rows={3} />
                ) : !thread.length ? (
                  <div className="panel p-8 text-center text-sm text-muted-foreground">
                    No messages with {selected.full_name} yet — start the conversation below.
                  </div>
                ) : (
                  thread.map((m) => {
                    const fromCustomer = m.direction === "customer_to_admin";
                    return (
                      <article
                        key={m.id}
                        className={cn(
                          "panel p-4",
                          fromCustomer && "border-primary/25 bg-primary/[0.04]",
                        )}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium">{m.subject}</p>
                          <span className="text-xs text-muted-foreground">
                            {fromCustomer ? selected.full_name : "You"} ·{" "}
                            {new Date(m.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                          {m.body}
                        </p>
                      </article>
                    );
                  })
                )}
              </div>

              <form onSubmit={send} className="panel space-y-3 p-5">
                <h2 className="font-display text-lg font-semibold">
                  Reply to {selected.full_name}
                </h2>
                <div className="space-y-2">
                  <Label htmlFor="s">Subject</Label>
                  <Input id="s" value={subject} onChange={(e) => setSubject(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="b">Message</Label>
                  <Textarea
                    id="b"
                    rows={5}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={busy}>
                  <Send className="mr-1.5 h-4 w-4" /> Send
                </Button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
