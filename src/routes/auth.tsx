import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PLATFORMS, PLATFORM_LABEL } from "@/lib/platform";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Swiiftiphones Agency" },
      {
        name: "description",
        content:
          "Sign in or request access to the Swiiftiphones Agency social media growth and reporting platform.",
      },
      { property: "og:title", content: "Sign in — Swiiftiphones Agency" },
      {
        property: "og:description",
        content: "Access your social media growth dashboard and monthly reports.",
      },
    ],
  }),
  component: AuthPage,
});

const SIGNUP_PLATFORMS = PLATFORMS.filter((p) => p !== "other");

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("signin");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden flex-col justify-between bg-sidebar p-12 text-sidebar-foreground lg:flex grid-noise">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <Activity className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-semibold">Swiiftiphones Agency</span>
        </Link>
        <div className="max-w-md">
          <h2 className="font-display text-4xl font-semibold leading-tight">
            Every client. Every platform. One growth picture.
          </h2>
          <p className="mt-4 text-sm text-sidebar-foreground/70">
            Track follower growth, engagement and reach across Instagram, TikTok, YouTube, Facebook,
            X and LinkedIn — then ship branded monthly reports your clients actually read.
          </p>
        </div>
        <p className="text-xs text-sidebar-foreground/50">
          Accounts are reviewed by an administrator before dashboard access is granted.
        </p>
      </aside>

      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Tabs value={mode} onValueChange={setMode}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="register">Request access</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="mt-6">
              <SignInForm busy={busy} setBusy={setBusy} />
            </TabsContent>
            <TabsContent value="register" className="mt-6">
              <RegisterForm busy={busy} setBusy={setBusy} onDone={() => setMode("signin")} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

function SignInForm({ busy, setBusy }: { busy: boolean; setBusy: (v: boolean) => void }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!remember) sessionStorage.setItem("pg-session-only", "1");
    navigate({ to: "/dashboard" });
  }

  async function googleSignIn() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  }

  return (
    <form onSubmit={onSubmit} className="panel space-y-4 p-6">
      <div>
        <h1 className="font-display text-xl font-semibold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to your growth dashboard. Administrators use the same secure sign-in.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox checked={remember} onCheckedChange={(v) => setRemember(v === true)} />
          Remember me
        </label>
        <ForgotPassword email={email} />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Sign in
      </Button>
      <div className="relative py-1 text-center text-xs uppercase tracking-wider text-muted-foreground">
        <span className="relative z-10 bg-card px-3">or</span>
        <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
      </div>
      <Button type="button" variant="outline" className="w-full" onClick={googleSignIn}>
        Continue with Google
      </Button>
    </form>
  );
}

function ForgotPassword({ email }: { email: string }) {
  async function send() {
    if (!email) {
      toast.error("Enter your email address first.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset link sent. Check your inbox.");
  }
  return (
    <button type="button" onClick={send} className="text-sm font-medium text-primary hover:underline">
      Forgot password?
    </button>
  );
}

function RegisterForm({
  busy,
  setBusy,
  onDone,
}: {
  busy: boolean;
  setBusy: (v: boolean) => void;
  onDone: () => void;
}) {
  const [form, setForm] = useState({
    full_name: "",
    username: "",
    email: "",
    phone: "",
    company_name: "",
    password: "",
    confirm: "",
  });
  const [handles, setHandles] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    const cleanHandles = Object.fromEntries(
      Object.entries(handles).filter(([, v]) => v.trim()),
    );
    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: form.full_name.trim(),
          username: form.username.trim().toLowerCase(),
          phone: form.phone || null,
          company_name: form.company_name || null,
          handles: cleanHandles,
        },
      },
    });
    if (error) {
      setBusy(false);
      toast.error(error.message);
      return;
    }

    const userId = data.user?.id;
    if (userId && data.session) {
      const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .insert({
          user_id: userId,
          full_name: form.full_name.trim(),
          username: form.username.trim().toLowerCase(),
          email: form.email.trim(),
          phone: form.phone || null,
          company_name: form.company_name || null,
          status: "pending",
        })
        .select("id")
        .maybeSingle();
      if (pErr) toast.error(pErr.message);
      if (profile) {
        const rows = Object.entries(handles)
          .filter(([, v]) => v.trim())
          .map(([platform, handle]) => ({
            customer_id: profile.id,
            platform,
            handle: handle.trim(),
            data_source: "manual",
          }));
        if (rows.length) await supabase.from("social_accounts").insert(rows);
      }
    }
    setBusy(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="panel space-y-4 p-6 text-center">
        <h1 className="font-display text-xl font-semibold">Request submitted</h1>
        <p className="text-sm text-muted-foreground">
          Your account has been submitted successfully and is awaiting administrator approval.
          You'll be notified by email once it's reviewed.
        </p>
        <Button variant="outline" className="w-full" onClick={onDone}>
          Back to sign in <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="panel space-y-4 p-6">
      <div>
        <h1 className="font-display text-xl font-semibold">Request access</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell us about your brand. An administrator reviews every request.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required value={form.full_name} onChange={set("full_name")} />
        <Field label="Username" required value={form.username} onChange={set("username")} />
        <Field
          label="Email address"
          type="email"
          required
          value={form.email}
          onChange={set("email")}
        />
        <Field label="Phone number" value={form.phone} onChange={set("phone")} />
        <Field
          label="Company / brand"
          value={form.company_name}
          onChange={set("company_name")}
          className="sm:col-span-2"
        />
        <Field
          label="Password"
          type="password"
          required
          value={form.password}
          onChange={set("password")}
        />
        <Field
          label="Confirm password"
          type="password"
          required
          value={form.confirm}
          onChange={set("confirm")}
        />
      </div>
      <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4">
        <p className="text-sm font-semibold">Social media handles</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {SIGNUP_PLATFORMS.map((p) => (
            <div key={p} className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{PLATFORM_LABEL[p]}</Label>
              <Input
                value={handles[p] ?? ""}
                onChange={(e) => setHandles((h) => ({ ...h, [p]: e.target.value }))}
                placeholder="@handle"
              />
            </div>
          ))}
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Submit registration
      </Button>
    </form>
  );
}

function Field({
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; className?: string }) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label>{label}</Label>
      <Input {...props} />
    </div>
  );
}
