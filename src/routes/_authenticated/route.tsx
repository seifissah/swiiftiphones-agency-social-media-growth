import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Clock, KeyRound, LogOut, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppProvider } from "@/lib/app-context";
import { claimRole } from "@/lib/roles.functions";
import { clearPasswordFlag } from "@/lib/access.functions";
import type { Profile } from "@/lib/platform";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function ChangePasswordScreen({ onDone }: { onDone: () => void }) {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (pw.length < 8) return toast.error("Password must be at least 8 characters.");
    if (pw !== confirm) return toast.error("Passwords do not match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) {
      setBusy(false);
      return toast.error(error.message);
    }
    await clearPasswordFlag();
    await supabase.auth.refreshSession();
    setBusy(false);
    toast.success("Password updated");
    onDone();
  }
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <form onSubmit={submit} className="panel w-full max-w-md space-y-4 p-8">
        <KeyRound className="h-6 w-6 text-primary" />
        <h1 className="font-display text-2xl font-semibold">Choose a new password</h1>
        <p className="text-sm text-muted-foreground">
          You signed in with an access code from your account manager. Set your own password to continue.
        </p>
        <Input type="password" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
        <Input type="password" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
        <Button type="submit" className="w-full" disabled={busy}>Save password</Button>
      </form>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

async function loadMe() {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
  ]);

  let isAdmin = (roles ?? []).some((r) => r.role === "admin");

  // Role + profile provisioning happens server-side; the first ever account
  // becomes admin. Also covers email-confirmation and Google sign-ups, which
  // have no client session at the moment of registration.
  let needsRefetch = false;
  if (!(roles ?? []).length || !profile) {
    const { isAdmin: claimed } = await claimRole();
    isAdmin = claimed;
    needsRefetch = true;
  }

  const fresh = needsRefetch
    ? ((await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle()).data ??
      profile)
    : profile;

  return {
    userId: user.id,
    email: user.email ?? "",
    profile: (fresh as Profile | null) ?? null,
    isAdmin,
    mustChangePassword: user.user_metadata?.["must_change_password"] === true,
  };
}

function AuthenticatedLayout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ["me"], queryFn: loadMe });

  useEffect(() => {
    if (!data?.profile) return;
    void supabase
      .from("profiles")
      .update({ last_login: new Date().toISOString() })
      .eq("id", data.profile.id);
  }, [data?.profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!data) return null;

  if (data.mustChangePassword) {
    return <ChangePasswordScreen onDone={() => queryClient.invalidateQueries({ queryKey: ["me"] })} />;
  }


  const status = data.profile?.status;
  if (!data.isAdmin && status !== "active") {
    return (
      <GateScreen
        status={status ?? "pending"}
        onSignOut={signOut}
        name={data.profile?.full_name ?? data.email}
      />
    );
  }

  return (
    <AppProvider
      value={{
        userId: data.userId,
        email: data.email,
        profile: data.profile,
        isAdmin: data.isAdmin,
        refresh: () => queryClient.invalidateQueries(),
      }}
    >
      <AppShell>
        <Outlet />
      </AppShell>
    </AppProvider>
  );
}

function GateScreen({
  status,
  name,
  onSignOut,
}: {
  status: string;
  name: string;
  onSignOut: () => void;
}) {
  const copy: Record<string, { title: string; body: string }> = {
    pending: {
      title: "Awaiting administrator approval",
      body: "Your account has been submitted successfully and is awaiting administrator approval. You'll receive an email as soon as it is reviewed.",
    },
    rejected: {
      title: "Registration not approved",
      body: "Your registration request was not approved. Please contact your account manager if you believe this is a mistake.",
    },
    suspended: {
      title: "Account suspended",
      body: "Your access has been temporarily suspended. Please contact your account manager to reactivate it.",
    },
  };
  const content = copy[status] ?? copy["pending"]!;
  const pending = status === "pending";

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4 grid-noise">
      <div className="panel max-w-lg p-8 text-center">
        <span
          className={`mx-auto grid h-12 w-12 place-items-center rounded-2xl ${
            pending ? "bg-warning/15 text-warning-foreground" : "bg-destructive/12 text-destructive"
          }`}
        >
          {pending ? <Clock className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
        </span>
        <h1 className="mt-5 font-display text-2xl font-semibold">{content.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{content.body}</p>
        <p className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">
          Signed in as {name}
        </p>
        <Button variant="outline" className="mt-6" onClick={onSignOut}>
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </div>
    </div>
  );
}
