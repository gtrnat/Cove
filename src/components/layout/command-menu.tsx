"use client";

import {
  ArrowRight,
  Dumbbell,
  Footprints,
  LayoutGrid,
  Plus,
  Receipt,
  Scale,
  Search,
  Settings,
  Utensils,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createContext, use, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Dialog } from "../ui/dialog";

type Command = { id: string; label: string; group: "Quick add" | "Go to"; href: string; icon: LucideIcon; keywords?: string };

const commands: Command[] = [
  { id: "add-tx", label: "Add transaction", group: "Quick add", href: "/finance/transactions?new=1", icon: Plus, keywords: "expense income spend money" },
  { id: "log-workout", label: "Log workout", group: "Quick add", href: "/fitness/log/strength", icon: Dumbbell, keywords: "lift gym strength" },
  { id: "log-run", label: "Log run", group: "Quick add", href: "/fitness/log/run", icon: Footprints, keywords: "running cardio" },
  { id: "log-food", label: "Log food", group: "Quick add", href: "/fitness/nutrition?add=1", icon: Utensils, keywords: "protein meal eat nutrition" },
  { id: "log-weight", label: "Log body weight", group: "Quick add", href: "/fitness/nutrition#weight", icon: Scale, keywords: "weigh kg" },
  { id: "go-dashboard", label: "Dashboard", group: "Go to", href: "/dashboard", icon: LayoutGrid },
  { id: "go-finance", label: "Finance overview", group: "Go to", href: "/finance", icon: Wallet },
  { id: "go-transactions", label: "Transactions", group: "Go to", href: "/finance/transactions", icon: Receipt },
  { id: "go-budgets", label: "Budgets", group: "Go to", href: "/finance/budgets", icon: Wallet },
  { id: "go-categories", label: "Categories", group: "Go to", href: "/finance/categories", icon: Wallet },
  { id: "go-rules", label: "Rules", group: "Go to", href: "/finance/rules", icon: Wallet },
  { id: "go-fitness", label: "Fitness overview", group: "Go to", href: "/fitness", icon: Dumbbell },
  { id: "go-history", label: "Workout history", group: "Go to", href: "/fitness/history", icon: Dumbbell },
  { id: "go-exercises", label: "Exercise progress", group: "Go to", href: "/fitness/exercises", icon: Dumbbell, keywords: "pr 1rm" },
  { id: "go-running", label: "Running", group: "Go to", href: "/fitness/running", icon: Footprints },
  { id: "go-nutrition", label: "Nutrition", group: "Go to", href: "/fitness/nutrition", icon: Utensils },
  { id: "go-foods", label: "Food library", group: "Go to", href: "/fitness/foods", icon: Utensils },
  { id: "go-settings", label: "Settings", group: "Go to", href: "/settings", icon: Settings, keywords: "profile password target timezone" },
  { id: "go-integrations", label: "Integrations", group: "Go to", href: "/settings/integrations", icon: Settings, keywords: "gmail bca email api key" },
];

const CommandMenuContext = createContext<() => void>(() => {});

/** Provides ⌘K / Ctrl+K and an `open` function for trigger buttons. */
export function CommandMenuProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const show = useCallback(() => setOpen(true), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <CommandMenuContext value={show}>
      {children}
      <Dialog open={open} onClose={() => setOpen(false)} title="Quick actions" className="max-w-lg">
        <CommandList onDone={() => setOpen(false)} />
      </Dialog>
    </CommandMenuContext>
  );
}

function CommandList({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return commands.filter((c) => {
      const hay = `${c.label} ${c.keywords ?? ""} ${c.group}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }, [q]);
  const index = Math.min(active, Math.max(0, results.length - 1));

  function run(c: Command) {
    onDone();
    router.push(c.href);
  }

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${index}"]`)?.scrollIntoView({ block: "nearest" });
  }, [index]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={results[index] ? `${listId}-${results[index].id}` : undefined}
          aria-label="Search actions and pages"
          placeholder="Search actions and pages"
          autoFocus
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((i) => Math.min(i + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && results[index]) {
              e.preventDefault();
              run(results[index]);
            }
          }}
          className="h-11 w-full rounded-md border border-border-strong bg-background pl-9 pr-3 text-sm placeholder:text-faint focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
        />
      </div>

      <ul ref={listRef} id={listId} role="listbox" aria-label="Results" className="-mx-2 max-h-[55vh] overflow-y-auto px-2">
        {results.length === 0 && <li className="py-8 text-center text-sm text-muted">No matches.</li>}
        {results.map((c, i) => {
          const showGroup = i === 0 || results[i - 1].group !== c.group;
          const Icon = c.icon;
          return (
            <li key={c.id} role="presentation">
              {showGroup && (
                <p aria-hidden="true" className="mb-1 mt-3 px-2 text-xs font-medium uppercase tracking-wider text-muted first:mt-0">
                  {c.group}
                </p>
              )}
              <div
                id={`${listId}-${c.id}`}
                role="option"
                aria-selected={i === index}
                data-index={i}
                onMouseMove={() => setActive(i)}
                onClick={() => run(c)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm",
                  i === index ? "bg-surface-2 text-foreground" : "text-muted",
                )}
              >
                <Icon aria-hidden="true" strokeWidth={1.75} className={cn("size-4", i === index ? "text-accent" : "text-faint")} />
                <span className="flex-1">{c.label}</span>
                {i === index && <ArrowRight aria-hidden="true" className="size-3.5 text-faint" />}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="hidden text-xs text-faint sm:block">↑ ↓ to move · Enter to open · Esc to close · Ctrl/⌘ K anywhere</p>
    </div>
  );
}

export function useCommandMenu() {
  return use(CommandMenuContext);
}

/** Sidebar search field look-alike that opens the menu. */
export function CommandMenuTrigger({ compact }: { compact?: boolean }) {
  const open = useCommandMenu();
  if (compact) {
    return (
      <button
        type="button"
        onClick={open}
        aria-label="Quick actions"
        className="grid size-9 place-items-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
      >
        <Search aria-hidden="true" className="size-4" />
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={open}
      className="flex h-9 w-full items-center gap-2 rounded-md border border-border-strong bg-surface px-3 text-sm text-muted transition-colors hover:border-faint hover:text-foreground"
    >
      <Search aria-hidden="true" className="size-4 text-faint" />
      <span className="flex-1 text-left">Quick actions</span>
      <kbd className="rounded border border-border-strong px-1.5 font-mono text-[10px] text-faint">⌘K</kbd>
    </button>
  );
}
