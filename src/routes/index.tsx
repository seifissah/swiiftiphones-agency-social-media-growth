import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, BarChart3, FileText, ShieldCheck, Target, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Swiiftiphones Agency — Social Media Client Growth Platform" },
      {
        name: "description",
        content:
          "Manage social media clients, approve accounts, track follower growth across platforms and publish branded monthly performance reports.",
      },
      { property: "og:title", content: "Swiiftiphones Agency — Social Media Client Growth Platform" },
      {
        property: "og:description",
        content:
          "One dashboard for client management, growth analytics, goals and monthly reporting.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Users,
    title: "Client management",
    body: "Approve, suspend or reactivate clients, and keep every profile, handle and note in one place.",
  },
  {
    icon: BarChart3,
    title: "Growth analytics",
    body: "Historical follower, engagement, reach and impression tracking with 7-day to 12-month views.",
  },
  {
    icon: FileText,
    title: "Monthly reports",
    body: "Generate month-over-month performance reports with scores, comparisons and recommendations.",
  },
  {
    icon: Target,
    title: "Goals & scoring",
    body: "Set follower targets with deadlines and a configurable 0–100 performance score per client.",
  },
  {
    icon: ShieldCheck,
    title: "Strict data isolation",
    body: "Role-based access ensures clients only ever see their own accounts, reports and messages.",
  },
  {
    icon: Activity,
    title: "API-ready architecture",
    body: "Manual metric entry today, official platform API sync tomorrow — with clear data-source labels.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Activity className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-semibold">Swiiftiphones Agency</span>
        </div>
        <Button asChild size="sm">
          <Link to="/auth">Sign in</Link>
        </Button>
      </header>

      <section className="grid-noise">
        <div className="mx-auto max-w-6xl px-5 py-20 text-center sm:py-28">
          <p className="mx-auto w-fit rounded-full border border-border bg-card px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Social media agency operating system
          </p>
          <h1 className="mx-auto mt-6 max-w-3xl font-display text-4xl font-semibold leading-[1.08] sm:text-6xl">
            Every client's growth, tracked and reported in one place.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Swiiftiphones Agency gives agencies an admin portal for approvals, accounts, analytics and
            reporting — and gives every client a private dashboard that answers one question: how is
            my social media performing?
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Request client access</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">Administrator sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <article key={f.title} className="panel p-6">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary">
                <f.icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 font-display text-lg font-semibold">{f.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        Swiiftiphones Agency — social media client growth &amp; reporting.
      </footer>
    </div>
  );
}
