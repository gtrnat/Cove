import Link from "next/link";
import { ArrowRight, Dumbbell, Mail, Utensils } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { ProgressRing } from "@/components/ui/progress-ring";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Mail,
    title: "Spending, recorded for you",
    body: "Every myBCA receipt in your inbox becomes a transaction. No typing, no receipts to keep.",
  },
  {
    icon: Dumbbell,
    title: "Every set and every run",
    body: "Log lifts and runs in seconds. See estimated 1RM, weekly volume, and pace trends over time.",
  },
  {
    icon: Utensils,
    title: "Protein without the math",
    body: "Pick a food, enter 3 eggs or 150 g of chicken. Cove does the arithmetic against your daily target.",
  },
];

export default function LandingPage() {
  return (
    <div className="relative isolate min-h-dvh overflow-hidden">
      {/* Soft accent glow behind the hero */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-40 -z-10 mx-auto h-[520px] max-w-4xl rounded-full bg-accent/[0.07] blur-3xl"
      />

      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo />
        <nav aria-label="Account" className="flex items-center gap-1">
          <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Sign in
          </Link>
          <Link href="/register" className={buttonVariants({ variant: "secondary", size: "sm" })}>
            Get started
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="animate-fade-up mx-auto max-w-2xl pt-20 text-center md:pt-28">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
            Finance · Training · Nutrition
          </p>
          <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.1] tracking-[-0.03em] md:text-[56px]">
            A quiet place for your money and your training.
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-pretty text-[15px] leading-relaxed text-muted md:text-base">
            Cove records your spending straight from your bank emails and keeps
            every set, run, and gram of protein in one calm dashboard.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}>
              Create your account
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto")}
            >
              Sign in
            </Link>
          </div>
        </section>

        <Preview />

        <section
          aria-labelledby="features-heading"
          className="mx-auto grid max-w-5xl gap-px overflow-hidden rounded-xl border bg-border md:grid-cols-3"
        >
          <h2 id="features-heading" className="sr-only">
            Features
          </h2>
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-background p-7">
              <Icon aria-hidden="true" strokeWidth={1.5} className="size-5 text-accent" />
              <h3 className="mt-5 text-[15px] font-medium">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="mx-auto mt-28 flex max-w-6xl items-center justify-between border-t px-6 py-8 text-xs text-muted">
        <span>Cove</span>
        <span>Built for one, open to a few.</span>
      </footer>
    </div>
  );
}

/** Decorative product preview. Static sample values, hidden from assistive tech. */
function Preview() {
  const bars = [32, 48, 20, 64, 40, 72, 28, 52, 36, 60, 44, 24, 56, 38];

  return (
    <div
      aria-hidden="true"
      className="animate-fade-up mx-auto mb-24 mt-20 max-w-5xl rounded-xl border bg-surface/60 p-2 [animation-delay:120ms]"
    >
      <div className="grid gap-2 md:grid-cols-[1.4fr_1fr]">
        <div className="rounded-lg border bg-background p-6">
          <p className="text-[13px] text-muted">Spent this month</p>
          <p className="tabular mt-2 text-3xl font-medium">Rp 2.450.000</p>
          <p className="mt-1 text-xs text-muted">
            <span className="text-positive">12% less</span> than last month
          </p>
          <div className="mt-8 flex h-24 items-end gap-1.5">
            {bars.map((h, i) => (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className={cn(
                  "flex-1 rounded-sm",
                  i === bars.length - 3 ? "bg-accent" : "bg-surface-3",
                )}
              />
            ))}
          </div>
          <div className="mt-6 space-y-3 border-t pt-5 text-sm">
            {[
              ["Elox Jus Sentul", "Food & Drinks", "Rp 12.000"],
              ["Grab", "Transport", "Rp 27.500"],
            ].map(([merchant, cat, amount]) => (
              <div key={merchant} className="flex items-center justify-between">
                <div>
                  <p>{merchant}</p>
                  <p className="text-xs text-muted">{cat}</p>
                </div>
                <p className="tabular text-muted">{amount}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          <div className="flex items-center gap-6 rounded-lg border bg-background p-6">
            <ProgressRing value={112} max={140} />
            <div>
              <p className="text-[13px] text-muted">Protein today</p>
              <p className="tabular mt-1 text-2xl font-medium">
                112<span className="text-base text-muted"> / 140 g</span>
              </p>
            </div>
          </div>
          <div className="rounded-lg border bg-background p-6">
            <p className="text-[13px] text-muted">Bench press · est. 1RM</p>
            <p className="tabular mt-2 text-2xl font-medium">93.3 kg</p>
            <p className="mt-1 text-xs text-muted">80 kg × 5 · new PR</p>
          </div>
          <div className="rounded-lg border bg-background p-6">
            <p className="text-[13px] text-muted">Running this week</p>
            <p className="tabular mt-2 text-2xl font-medium">
              18.4<span className="text-base text-muted"> km</span>
            </p>
            <p className="mt-1 text-xs text-muted">Avg pace 5:42 /km</p>
          </div>
        </div>
      </div>
    </div>
  );
}
