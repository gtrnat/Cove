"use client";

import { Minus, Plus, Timer, X } from "lucide-react";
import { useEffect, useState } from "react";

function mmss(total: number) {
  const s = Math.max(0, Math.ceil(total));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Floating countdown shown after a set is checked off. */
export function RestTimer({
  endsAt,
  onAdjust,
  onDismiss,
}: {
  endsAt: number;
  onAdjust: (deltaSeconds: number) => void;
  onDismiss: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const remaining = (endsAt - now) / 1000;
  const done = remaining <= 0;

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!done) return;
    navigator.vibrate?.([200, 100, 200]);
    const id = setTimeout(onDismiss, 4000);
    return () => clearTimeout(id);
  }, [done, onDismiss]);

  const btn = "grid size-9 place-items-center rounded-md text-muted transition-colors hover:bg-surface-3 hover:text-foreground";

  return (
    <div
      role="timer"
      aria-label="Rest timer"
      className="fixed inset-x-4 bottom-20 z-40 mx-auto flex max-w-sm items-center gap-2 rounded-xl border border-border-strong bg-surface-2 p-2 pl-4 shadow-2xl shadow-black/50 md:bottom-6"
    >
      <Timer aria-hidden="true" className={done ? "size-4 text-positive" : "size-4 text-accent"} />
      <p className="tabular flex-1 text-lg font-medium" aria-live={done ? "assertive" : "off"}>
        {done ? "Rest over" : mmss(remaining)}
      </p>
      {!done && (
        <>
          <button type="button" className={btn} onClick={() => onAdjust(-15)} aria-label="15 seconds less">
            <Minus aria-hidden="true" className="size-4" />
          </button>
          <button type="button" className={btn} onClick={() => onAdjust(15)} aria-label="15 seconds more">
            <Plus aria-hidden="true" className="size-4" />
          </button>
        </>
      )}
      <button type="button" className={btn} onClick={onDismiss} aria-label="Dismiss rest timer">
        <X aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}
