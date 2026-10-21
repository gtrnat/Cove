"use client";

import { Check, Dumbbell, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getPreviousSets, saveWorkout } from "./actions";
import { ExercisePicker, type PickerExercise } from "./exercise-picker";
import { muscleLabels, type MuscleGroup } from "./labels";
import { formatDuration, formatWeight, parseRepsInput, parseWeightInput } from "./metrics";
import { RestTimer } from "./rest-timer";

type DraftSet = { key: string; weight: string; reps: string; done: boolean; warmup: boolean };
type DraftExercise = { key: string; exerciseId: string; sets: DraftSet[] };
type Draft = {
  title: string;
  /** datetime-local value in the user's timezone */
  startedAt: string;
  /** Wall-clock ms when logging began; drives the elapsed timer for new workouts */
  startedAtMs: number;
  /** Minutes, as typed. Empty = use elapsed time. */
  durationMin: string;
  notes: string;
  exercises: DraftExercise[];
};

type PreviousSets = Record<string, { weightKg: number; reps: number; isWarmup: boolean }[]>;

export type WorkoutLoggerProps = {
  userId: string;
  exercises: PickerExercise[];
  /** Initial values; for edits, `id` is set and sets arrive already checked. */
  initial: Omit<Draft, "exercises" | "startedAtMs"> & {
    id?: string;
    exercises: { exerciseId: string; sets: { weightKg: number; reps: number; isWarmup: boolean }[] }[];
  };
  previous: PreviousSets;
};

const uid = () => Math.random().toString(36).slice(2, 10);
const nowMs = () => Date.now();
const REST_KEY = "cove:rest-seconds";

function readDraft(key: string): Draft | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? "null") as Draft | null;
    return parsed && Array.isArray(parsed.exercises) && parsed.exercises.length > 0 ? parsed : null;
  } catch {
    return null; // corrupt draft: ignore it
  }
}

function readRestSeconds() {
  const v = Number(localStorage.getItem(REST_KEY));
  return v >= 15 && v <= 600 ? v : 90;
}

const subscribeNoop = () => () => {};

/**
 * The logger reads its draft from localStorage, so it renders only in the
 * browser. The server sends a skeleton; there's nothing to prerender.
 */
export function WorkoutLogger(props: WorkoutLoggerProps) {
  const isClient = useSyncExternalStore(subscribeNoop, () => true, () => false);
  if (!isClient) {
    return (
      <div aria-busy="true" aria-label="Loading" className="animate-pulse space-y-6">
        <div className="h-28 rounded-lg border bg-surface" />
        <div className="h-56 rounded-lg border bg-surface" />
      </div>
    );
  }
  return <Logger {...props} />;
}

function fromInitial(initial: WorkoutLoggerProps["initial"]): Draft {
  return {
    title: initial.title,
    startedAt: initial.startedAt,
    startedAtMs: Date.now(),
    durationMin: initial.durationMin,
    notes: initial.notes,
    exercises: initial.exercises.map((e) => ({
      key: uid(),
      exerciseId: e.exerciseId,
      sets: e.sets.map((s) => ({
        key: uid(),
        weight: formatWeight(s.weightKg).replace(/,/g, ""),
        reps: String(s.reps),
        done: true,
        warmup: s.isWarmup,
      })),
    })),
  };
}

function Logger({ userId, exercises, initial, previous: initialPrevious }: WorkoutLoggerProps) {
  const router = useRouter();
  const editingId = initial.id;
  const draftKey = `cove:workout-draft:${userId}:${editingId ?? "new"}`;

  // Only rendered in the browser (see WorkoutLogger), so localStorage is safe here.
  const [savedDraft] = useState(() => readDraft(draftKey));
  const [draft, setDraft] = useState<Draft>(() => savedDraft ?? fromInitial(initial));
  const [restored, setRestored] = useState(savedDraft !== null);
  const [previous, setPrevious] = useState<PreviousSets>(initialPrevious);
  const [library, setLibrary] = useState(exercises);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null);
  const [restSeconds, setRestSeconds] = useState(readRestSeconds);
  const [error, setError] = useState<string>();
  const [saving, startSaving] = useTransition();

  const byId = useMemo(() => new Map(library.map((e) => [e.id, e])), [library]);

  // A restored draft may contain exercises the server didn't load "previous" sets for.
  const fetchedMissing = useRef(false);
  useEffect(() => {
    if (fetchedMissing.current || !savedDraft) return;
    fetchedMissing.current = true;
    const missing = savedDraft.exercises.map((e) => e.exerciseId).filter((id) => !(id in initialPrevious));
    if (missing.length) getPreviousSets(missing, editingId).then((p) => setPrevious((cur) => ({ ...p, ...cur })));
  }, [savedDraft, initialPrevious, editingId]);

  useEffect(() => {
    if (draft.exercises.length === 0) localStorage.removeItem(draftKey);
    else localStorage.setItem(draftKey, JSON.stringify(draft));
  }, [draft, draftKey]);

  // Elapsed clock for new workouts.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (editingId) return;
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, [editingId]);
  const elapsedS = Math.max(0, Math.round((now - draft.startedAtMs) / 1000));

  const update = (fn: (d: Draft) => Draft) => setDraft((d) => fn(structuredClone(d)));

  function addExercise(ex: PickerExercise) {
    setPickerOpen(false);
    const prev = previous[ex.id];
    update((d) => {
      const working = prev?.filter((s) => !s.isWarmup) ?? [];
      const seed = working.length > 0 ? working : [{ weightKg: 0, reps: 0, isWarmup: false }];
      d.exercises.push({
        key: uid(),
        exerciseId: ex.id,
        sets: seed.map((s) => ({
          key: uid(),
          weight: s.weightKg ? String(s.weightKg) : "",
          reps: s.reps ? String(s.reps) : "",
          done: false,
          warmup: false,
        })),
      });
      return d;
    });
    if (!(ex.id in previous)) {
      getPreviousSets([ex.id], editingId).then((p) => {
        setPrevious((cur) => ({ ...cur, [ex.id]: p[ex.id] ?? [] }));
        // Prefill the first, still-empty set from last time.
        const last = p[ex.id]?.filter((s) => !s.isWarmup);
        if (last?.length) {
          update((d) => {
            const target = d.exercises.findLast((e) => e.exerciseId === ex.id);
            if (target && target.sets.length === 1 && !target.sets[0].weight && !target.sets[0].reps) {
              target.sets = last.map((s) => ({ key: uid(), weight: String(s.weightKg), reps: String(s.reps), done: false, warmup: false }));
            }
            return d;
          });
        }
      });
    }
  }

  function toggleDone(exKey: string, setKey: string) {
    const current = draft.exercises.find((e) => e.key === exKey)?.sets.find((x) => x.key === setKey);
    if (!current) return;
    if (!current.done && (parseWeightInput(current.weight) === null || parseRepsInput(current.reps) === null)) {
      setError("Enter weight and reps before checking off a set.");
      return;
    }
    const nextDone = !current.done;
    update((d) => {
      const s = d.exercises.find((e) => e.key === exKey)?.sets.find((x) => x.key === setKey);
      if (s) s.done = nextDone;
      return d;
    });
    setError(undefined);
    if (nextDone && !current.warmup) setRestEndsAt(nowMs() + restSeconds * 1000);
  }

  const doneSets = draft.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);

  function finish() {
    setError(undefined);
    const payloadExercises = draft.exercises
      .map((e) => ({
        exerciseId: e.exerciseId,
        sets: e.sets
          .filter((s) => s.done)
          .map((s) => ({ weightKg: parseWeightInput(s.weight)!, reps: parseRepsInput(s.reps)!, isWarmup: s.warmup }))
          .filter((s) => s.weightKg !== null && s.reps !== null),
      }))
      .filter((e) => e.sets.length > 0);

    if (payloadExercises.length === 0) {
      setError("Check off at least one set to save the workout.");
      return;
    }

    const minutes = draft.durationMin.trim();
    const durationS = minutes ? Math.round(Number(minutes) * 60) : editingId ? null : elapsedS;
    if (minutes && (!Number.isFinite(Number(minutes)) || Number(minutes) < 0 || Number(minutes) > 1440)) {
      setError("Duration must be between 0 and 1440 minutes.");
      return;
    }

    startSaving(async () => {
      const res = await saveWorkout({
        id: editingId,
        title: draft.title,
        startedAt: draft.startedAt,
        durationS,
        notes: draft.notes.trim() || null,
        exercises: payloadExercises,
      });
      if (!res.ok) {
        setError(res.message);
        return;
      }
      localStorage.removeItem(draftKey);
      router.push(`/fitness/history/${res.id}`);
    });
  }

  function discard() {
    if (!confirm(editingId ? "Discard your changes?" : "Discard this workout? Nothing will be saved.")) return;
    localStorage.removeItem(draftKey);
    router.push(editingId ? `/fitness/history/${editingId}` : "/fitness");
  }

  const dismissRest = useCallback(() => setRestEndsAt(null), []);

  function adjustRest(delta: number) {
    setRestEndsAt((t) => (t ? t + delta * 1000 : t));
    setRestSeconds((s) => {
      const next = Math.min(600, Math.max(15, s + delta));
      localStorage.setItem(REST_KEY, String(next));
      return next;
    });
  }

  return (
    <div className="space-y-6 pb-24">
      {restored && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-accent/30 bg-accent/5 px-4 py-2.5 text-sm">
          <span>Restored your unsaved workout.</span>
          <button
            type="button"
            className="text-muted underline-offset-4 hover:text-foreground hover:underline"
            onClick={() => {
              localStorage.removeItem(draftKey);
              setDraft(fromInitial(initial));
              setRestored(false);
            }}
          >
            Start over
          </button>
        </div>
      )}

      <section aria-label="Workout details" className="grid gap-4 rounded-lg border bg-surface p-4 sm:grid-cols-[1fr_auto_auto]">
        <div className="space-y-2">
          <Label htmlFor="w-title">Name</Label>
          <Input
            id="w-title"
            value={draft.title}
            maxLength={80}
            onChange={(e) => update((d) => ({ ...d, title: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="w-start">Started</Label>
          <Input
            id="w-start"
            type="datetime-local"
            value={draft.startedAt}
            onChange={(e) => update((d) => ({ ...d, startedAt: e.target.value }))}
            className="[color-scheme:dark]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="w-duration">Duration (min)</Label>
          <Input
            id="w-duration"
            inputMode="numeric"
            placeholder={editingId ? "—" : String(Math.round(elapsedS / 60))}
            value={draft.durationMin}
            onChange={(e) => update((d) => ({ ...d, durationMin: e.target.value }))}
            className="tabular sm:w-32"
            aria-describedby="w-duration-hint"
          />
          <p id="w-duration-hint" className="text-xs text-muted">
            {editingId ? "Leave empty if unknown." : `Running for ${formatDuration(elapsedS)}`}
          </p>
        </div>
      </section>

      {draft.exercises.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="Add your first exercise"
          description="Pick from the library or create your own. Last session's numbers are filled in for you."
          action={
            <Button onClick={() => setPickerOpen(true)}>
              <Plus aria-hidden="true" />
              Add exercise
            </Button>
          }
        />
      ) : (
        <>
          {draft.exercises.map((ex, i) => {
            const info = byId.get(ex.exerciseId);
            return (
              <ExerciseCard
                key={ex.key}
                index={i}
                name={info?.name ?? "Unknown exercise"}
                muscle={info ? muscleLabels[info.muscleGroup as MuscleGroup] : ""}
                exercise={ex}
                previous={previous[ex.exerciseId]}
                onChange={(next) => update((d) => ({ ...d, exercises: d.exercises.map((e) => (e.key === ex.key ? next : e)) }))}
                onRemove={() => update((d) => ({ ...d, exercises: d.exercises.filter((e) => e.key !== ex.key) }))}
                onToggleDone={(setKey) => toggleDone(ex.key, setKey)}
              />
            );
          })}
          <Button variant="secondary" onClick={() => setPickerOpen(true)} className="w-full">
            <Plus aria-hidden="true" />
            Add exercise
          </Button>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="w-notes">Notes</Label>
        <Textarea
          id="w-notes"
          rows={2}
          maxLength={1000}
          placeholder="How did it feel?"
          value={draft.notes}
          onChange={(e) => update((d) => ({ ...d, notes: e.target.value }))}
        />
      </div>

      <FormMessage>{error}</FormMessage>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-16 z-30 border-t bg-background/90 px-5 py-3 backdrop-blur-md md:bottom-0 md:left-60">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 md:px-5">
          <Button variant="ghost" onClick={discard}>
            <X aria-hidden="true" />
            {editingId ? "Cancel" : "Discard"}
          </Button>
          <Button onClick={finish} disabled={saving}>
            {saving ? <Spinner /> : <Check aria-hidden="true" />}
            {editingId ? "Save changes" : "Finish"} · {doneSets} {doneSets === 1 ? "set" : "sets"}
          </Button>
        </div>
      </div>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        exercises={library}
        selected={new Set(draft.exercises.map((e) => e.exerciseId))}
        onPick={addExercise}
        onCreated={(ex) => {
          setLibrary((l) => [...l, ex].sort((a, b) => a.name.localeCompare(b.name)));
          setPrevious((p) => ({ ...p, [ex.id]: [] }));
          addExercise(ex);
        }}
      />

      {restEndsAt && <RestTimer key={restEndsAt} endsAt={restEndsAt} onAdjust={adjustRest} onDismiss={dismissRest} />}
    </div>
  );
}

function ExerciseCard({
  index,
  name,
  muscle,
  exercise,
  previous,
  onChange,
  onRemove,
  onToggleDone,
}: {
  index: number;
  name: string;
  muscle: string;
  exercise: DraftExercise;
  previous?: { weightKg: number; reps: number; isWarmup: boolean }[];
  onChange: (next: DraftExercise) => void;
  onRemove: () => void;
  onToggleDone: (setKey: string) => void;
}) {
  const prevWorking = previous?.filter((s) => !s.isWarmup) ?? [];
  const headingId = `ex-${exercise.key}`;

  const setField = (key: string, patch: Partial<DraftSet>) =>
    onChange({ ...exercise, sets: exercise.sets.map((s) => (s.key === key ? { ...s, ...patch } : s)) });

  function addSet() {
    const last = exercise.sets.at(-1);
    onChange({
      ...exercise,
      sets: [...exercise.sets, { key: uid(), weight: last?.weight ?? "", reps: last?.reps ?? "", done: false, warmup: false }],
    });
  }

  let workingIndex = 0;

  return (
    <section aria-labelledby={headingId} className="rounded-lg border bg-surface">
      <div className="flex items-start justify-between gap-3 p-4 pb-2">
        <div className="min-w-0">
          <h2 id={headingId} className="truncate text-[15px] font-medium">
            <span className="sr-only">Exercise {index + 1}: </span>
            {name}
          </h2>
          <p className="text-xs text-muted">{muscle}</p>
        </div>
        <Button variant="ghost" size="icon" className="size-8 text-muted" onClick={onRemove} aria-label={`Remove ${name}`}>
          <Trash2 aria-hidden="true" />
        </Button>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-muted">
            <th scope="col" className="w-12 py-1.5 pl-4 text-left font-normal">Set</th>
            <th scope="col" className="hidden py-1.5 text-left font-normal sm:table-cell">Previous</th>
            <th scope="col" className="py-1.5 text-left font-normal">kg</th>
            <th scope="col" className="py-1.5 text-left font-normal">Reps</th>
            <th scope="col" className="w-14 py-1.5 pr-4 text-right font-normal">
              <span className="sr-only">Done</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {exercise.sets.map((s, i) => {
            const prev = s.warmup ? undefined : prevWorking[workingIndex];
            const label = s.warmup ? "W" : String(++workingIndex);
            return (
              <tr key={s.key} className={cn("border-t transition-colors", s.done && "bg-positive/[0.06]")}>
                <td className="py-1.5 pl-4">
                  <button
                    type="button"
                    onClick={() => setField(s.key, { warmup: !s.warmup })}
                    aria-label={`Set ${i + 1}, ${s.warmup ? "warm-up" : "working set"}. Toggle warm-up`}
                    className={cn(
                      "tabular grid size-8 place-items-center rounded-md text-xs transition-colors hover:bg-surface-3",
                      s.warmup ? "text-warning" : "text-muted",
                    )}
                  >
                    {label}
                  </button>
                </td>
                <td className="tabular hidden py-1.5 text-xs text-faint sm:table-cell">
                  {prev ? `${formatWeight(prev.weightKg)} × ${prev.reps}` : "—"}
                </td>
                <td className="py-1.5 pr-2">
                  <Input
                    aria-label={`Set ${i + 1} weight in kilograms`}
                    inputMode="decimal"
                    placeholder={prev ? String(prev.weightKg) : "0"}
                    value={s.weight}
                    onChange={(e) => setField(s.key, { weight: e.target.value, done: false })}
                    aria-invalid={s.weight !== "" && parseWeightInput(s.weight) === null ? true : undefined}
                    className="tabular h-9 max-w-24"
                  />
                </td>
                <td className="py-1.5 pr-2">
                  <Input
                    aria-label={`Set ${i + 1} reps`}
                    inputMode="numeric"
                    placeholder={prev ? String(prev.reps) : "0"}
                    value={s.reps}
                    onChange={(e) => setField(s.key, { reps: e.target.value, done: false })}
                    aria-invalid={s.reps !== "" && parseRepsInput(s.reps) === null ? true : undefined}
                    className="tabular h-9 max-w-20"
                  />
                </td>
                <td className="py-1.5 pr-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onChange({ ...exercise, sets: exercise.sets.filter((x) => x.key !== s.key) })}
                      aria-label={`Delete set ${i + 1}`}
                      className="hidden size-8 place-items-center rounded-md text-faint hover:bg-surface-3 hover:text-muted sm:grid"
                    >
                      <X aria-hidden="true" className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleDone(s.key)}
                      aria-pressed={s.done}
                      aria-label={`Mark set ${i + 1} done`}
                      className={cn(
                        "grid size-9 place-items-center rounded-md border transition-colors",
                        s.done
                          ? "border-positive bg-positive text-background"
                          : "border-border-strong text-faint hover:border-faint hover:text-muted",
                      )}
                    >
                      <Check aria-hidden="true" className="size-4" strokeWidth={2.5} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex items-center justify-between p-2">
        <Button variant="ghost" size="sm" onClick={addSet}>
          <Plus aria-hidden="true" />
          Add set
        </Button>
        {exercise.sets.length > 1 && (
          <button
            type="button"
            className="px-3 text-xs text-muted hover:text-foreground sm:hidden"
            onClick={() => onChange({ ...exercise, sets: exercise.sets.slice(0, -1) })}
          >
            Remove last set
          </button>
        )}
      </div>
    </section>
  );
}
