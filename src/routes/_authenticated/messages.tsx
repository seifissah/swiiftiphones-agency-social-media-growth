import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/app-context";
import { useMessages } from "@/lib/data";
import { LoadingBlock, PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/messages")({
  component: MessagesPage,
});

function MessagesPage() {
  const { profile } = useApp();
  const qc = useQueryClient();
  const { data: messages, isLoading } = useMessages(profile?.id);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !subject.trim() || !body.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("messages").insert({
      customer_id: profile.id,
      subject: subject.trim(),
      body: body.trim(),
      direction: "customer_to_admin",
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSubject("");
    setBody("");
    toast.success("Message sent to your account manager.");
    qc.invalidateQueries({ queryKey: ["messages"] });
  }

  return (
    <div>
      <PageHeader
        title="Messages"
        description="Talk directly to your account manager about your campaigns and reports."
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <section className="space-y-3">
          {isLoading ? (
            <LoadingBlock rows={3} />
          ) : !messages?.length ? (
            <div className="panel p-8 text-center text-sm text-muted-foreground">
              No messages yet — start the conversation.
            </div>
          ) : (
            messages.map((m) => {
              const mine = m.direction === "customer_to_admin";
              return (
                <article
                  key={m.id}
                  className={cn("panel p-4", mine ? "border-primary/25 bg-primary/[0.04]" : "")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{m.subject}</p>
                    <span className="text-xs text-muted-foreground">
                      {mine ? "You" : "Account manager"} ·{" "}
                      {new Date(m.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{m.body}</p>
                </article>
              );
            })
          )}
        </section>

        <form onSubmit={send} className="panel h-fit space-y-3 p-5">
          <h2 className="font-display text-lg font-semibold">New message</h2>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            <Send className="mr-1.5 h-4 w-4" /> Send message
          </Button>
        </form>
      </div>
    </div>
  );
}
