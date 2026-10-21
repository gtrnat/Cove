"use client";

import { Check, Footprints } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, invalidProps } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { saveRun } from "./actions";
import {
  formatClock,
  formatPace,
  paceSecondsPerKm,
  parseDurationInput,
  parseKmInput,
  plausiblePace,
  runSurfaces,
  runTypeLabels,
  runTypes,
  surfaceLabels,
  type RunSurface,
  type RunType,
} from "./format";

export type RunFormInitial = {
  id?: string;
  title: string;
  startedAt: string;
  distance: string;
  duration: string;
  runType: RunType;
  surface: RunSurface;
  avgHr: string;
  maxHr: string;
  elevationGainM: string;
  cadence: string;
  notes: string;
};

function optionalInt(v: string): number | null | "invalid" {
  const t = v.trim();
  if (!t) return null;
  return /^\d{1,5}$/.test(t) ? Number(t) : "invalid";
}

export function RunForm({ initial }: { initial: RunFormInitial }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string>();
  const [pending, startTransition] = useTransition();
  const set = (patch: Partial<RunFormInitial>) => setForm((f) => ({ ...f, ...patch }));

  const distanceM = parseKmInput(form.distance);
  const durationS = parseDurationInput(form.duration);
  const pace = distanceM && durationS ? paceSecondsPerKm(durationS, distanceM) : null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!distanceM) errs.distanceM = "Enter a distance in km, e.g. 5.2.";
    if (!durationS) errs.durationS = "Use mm:ss or h:mm:ss, e.g. 28:45.";
    if (pace && !plausiblePace(pace)) errs.durationS = "That pace looks off. Check the distance and duration.";
    const extras = {
      avgHr: optionalInt(form.avgHr),
      maxHr: optionalInt(form.maxHr),
      elevationGainM: optionalInt(form.elevationGainM),
      cadence: optionalInt(form.cadence),
    };
    for (const [k, v] of Object.entries(extras)) if (v === "invalid") errs[k] = "Whole numbers only.";
    setErrors(errs);
    setMessage(undefined);
    if (Object.keys(errs).length > 0) return;

    startTransition(async () => {
      const res = await saveRun({
        id: form.id,
        title: form.title,
        startedAt: form.startedAt,
        distanceM,
        durationS,
        runType: form.runType,
        surface: form.surface,
        ...extras,
        notes: form.notes.trim() || null,
      });
      if (!res.ok) {
        if (res.field) setErrors({ [res.field]: res.message });
        else setMessage(res.message);
        return;
      }
      router.push(`/fitness/history/${res.id}`);
    });
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-5 rounded-lg border bg-surface p-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="run-distance" label="Distance" hint={<span className="text-xs text-muted">km</span>} error={errors.distanceM}>
            <Input
              id="run-distance"
              inputMode="decimal"
              placeholder="5.0"
              value={form.distance}
              onChange={(e) => set({ distance: e.target.value })}
              className="tabular h-12 text-lg"
              autoFocus={!form.id}
              {...invalidProps("run-distance", errors.distanceM)}
            />
          </Field>
          <Field id="run-duration" label="Duration" hint={<span className="text-xs text-muted">h:mm:ss</span>} error={errors.durationS}>
            <Input
              id="run-duration"
              inputMode="numeric"
              placeholder="28:45"
              value={form.duration}
              onChange={(e) => set({ duration: e.target.value })}
              onBlur={() => durationS && set({ duration: formatClock(durationS) })}
              className="tabular h-12 text-lg"
              {...invalidProps("run-duration", errors.durationS)}
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="run-title" label="Name">
            <Input id="run-title" value={form.title} maxLength={80} onChange={(e) => set({ title: e.target.value })} />
          </Field>
          <Field id="run-start" label="Started">
            <Input
              id="run-start"
              type="datetime-local"
              value={form.startedAt}
              onChange={(e) => set({ startedAt: e.target.value })}
              className="[color-scheme:dark]"
            />
          </Field>
          <Field id="run-type" label="Type">
            <Select id="run-type" value={form.runType} onChange={(e) => set({ runType: e.target.value as RunType })}>
              {runTypes.map((t) => (
                <option key={t} value={t}>
                  {runTypeLabels[t]}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="run-surface" label="Surface">
            <Select id="run-surface" value={form.surface} onChange={(e) => set({ surface: e.target.value as RunSurface })}>
              {runSurfaces.map((s) => (
                <option key={s} value={s}>
                  {surfaceLabels[s]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <details className="group" open={Boolean(form.avgHr || form.maxHr || form.elevationGainM || form.cadence)}>
          <summary className="cursor-pointer select-none text-sm text-muted hover:text-foreground">
            Heart rate, elevation, cadence
          </summary>
          <div className="mt-4 grid grid-cols-2 gap-5 sm:grid-cols-4">
            {(
              [
                ["avgHr", "Avg HR", "bpm"],
                ["maxHr", "Max HR", "bpm"],
                ["elevationGainM", "Elevation", "m"],
                ["cadence", "Cadence", "spm"],
              ] as const
            ).map(([key, label, unit]) => (
              <Field key={key} id={`run-${key}`} label={label} hint={<span className="text-xs text-muted">{unit}</span>} error={errors[key]}>
                <Input
                  id={`run-${key}`}
                  inputMode="numeric"
                  value={form[key]}
                  onChange={(e) => set({ [key]: e.target.value })}
                  className="tabular"
                  {...invalidProps(`run-${key}`, errors[key])}
                />
              </Field>
            ))}
          </div>
        </details>

        <Field id="run-notes" label="Notes" hint={<span className="text-xs text-muted">Optional</span>}>
          <Textarea id="run-notes" rows={2} maxLength={1000} value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
        </Field>
      </div>

      <aside className="space-y-4">
        <div className="rounded-lg border bg-surface p-5" aria-live="polite">
          <div className="flex items-center gap-2 text-[13px] text-muted">
            <Footprints aria-hidden="true" className="size-4 text-faint" strokeWidth={1.75} />
            Pace
          </div>
          <p className="tabular mt-3 text-4xl font-medium leading-none">
            {pace ? formatPace(pace) : "—"}
            <span className="text-base text-muted"> /km</span>
          </p>
          {pace && distanceM && durationS && (
            <p className="tabular mt-2 text-xs text-muted">
              {(distanceM / 1000).toFixed(2)} km in {formatClock(durationS)}
            </p>
          )}
        </div>
        <FormMessage>{message}</FormMessage>
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? <Spinner /> : <Check aria-hidden="true" />}
          {form.id ? "Save changes" : "Save run"}
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={() => router.back()}>
          Cancel
        </Button>
      </aside>
    </form>
  );
}
