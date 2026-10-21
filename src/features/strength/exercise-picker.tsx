"use client";

import { Plus, Search } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { createExercise } from "./actions";
import { equipmentLabels, equipmentTypes, muscleGroups, muscleLabels, type MuscleGroup } from "./labels";

export type PickerExercise = {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  custom: boolean;
};

type ExercisePickerProps = {
  open: boolean;
  onClose: () => void;
  exercises: PickerExercise[];
  /** Already in the workout; shown as added. */
  selected: Set<string>;
  onPick: (exercise: PickerExercise) => void;
  onCreated: (exercise: PickerExercise) => void;
};

export function ExercisePicker({ open, onClose, exercises, selected, onPick, onCreated }: ExercisePickerProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Add exercise" className="max-w-lg">
      <PickerBody exercises={exercises} selected={selected} onPick={onPick} onCreated={onCreated} />
    </Dialog>
  );
}

function PickerBody({ exercises, selected, onPick, onCreated }: Omit<ExercisePickerProps, "open" | "onClose">) {
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState<MuscleGroup | "">("");
  const [creating, setCreating] = useState(false);

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = exercises.filter(
      (e) => (!muscle || e.muscleGroup === muscle) && (!needle || e.name.toLowerCase().includes(needle)),
    );
    return muscleGroups
      .map((m) => ({ muscle: m, items: filtered.filter((e) => e.muscleGroup === m) }))
      .filter((g) => g.items.length > 0);
  }, [exercises, q, muscle]);

  if (creating) {
    return (
      <CreateExerciseForm
        initialName={q}
        defaultMuscle={muscle || "chest"}
        onCancel={() => setCreating(false)}
        onCreated={(ex) => {
          onCreated(ex);
          setCreating(false);
        }}
      />
    );
  }

  const empty = groups.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            type="search"
            aria-label="Search exercises"
            placeholder="Search exercises"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>
        <Select
          aria-label="Muscle group"
          value={muscle}
          onChange={(e) => setMuscle(e.target.value as MuscleGroup | "")}
          className="w-36"
        >
          <option value="">All muscles</option>
          {muscleGroups.map((m) => (
            <option key={m} value={m}>
              {muscleLabels[m]}
            </option>
          ))}
        </Select>
      </div>

      <div className="-mx-2 max-h-[50vh] overflow-y-auto px-2">
        {empty ? (
          <p className="py-8 text-center text-sm text-muted">No exercises match.</p>
        ) : (
          groups.map((g) => (
            <section key={g.muscle} aria-labelledby={`pick-${g.muscle}`} className="mb-4">
              <h3 id={`pick-${g.muscle}`} className="mb-1 px-2 text-xs font-medium uppercase tracking-wider text-muted">
                {muscleLabels[g.muscle]}
              </h3>
              <ul>
                {g.items.map((e) => {
                  const added = selected.has(e.id);
                  return (
                    <li key={e.id}>
                      <button
                        type="button"
                        onClick={() => onPick(e)}
                        className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-surface-2"
                      >
                        <span className="min-w-0">
                          <span className="block truncate">{e.name}</span>
                          <span className="text-xs text-muted">
                            {equipmentLabels[e.equipment as keyof typeof equipmentLabels] ?? e.equipment}
                          </span>
                        </span>
                        <span className="flex shrink-0 gap-1.5">
                          {e.custom && <Badge>Custom</Badge>}
                          {added && <Badge variant="accent">Added</Badge>}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </div>

      <Button variant="ghost" size="sm" onClick={() => setCreating(true)} className="w-full">
        <Plus aria-hidden="true" />
        {q.trim() ? `Create “${q.trim()}”` : "Create a custom exercise"}
      </Button>
    </div>
  );
}

function CreateExerciseForm({
  initialName,
  defaultMuscle,
  onCancel,
  onCreated,
}: {
  initialName: string;
  defaultMuscle: MuscleGroup;
  onCancel: () => void;
  onCreated: (e: PickerExercise) => void;
}) {
  const [name, setName] = useState(initialName.trim());
  const [muscleGroup, setMuscleGroup] = useState<string>(defaultMuscle);
  const [equipment, setEquipment] = useState<string>("barbell");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setError(undefined);
        startTransition(async () => {
          const res = await createExercise({ name, muscleGroup, equipment });
          if (res.ok) onCreated(res.exercise);
          else setError(res.message);
        });
      }}
    >
      <div className="space-y-2">
        <label htmlFor="new-ex-name" className="text-[13px] font-medium">
          Name
        </label>
        <Input id="new-ex-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} autoFocus />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label htmlFor="new-ex-muscle" className="text-[13px] font-medium">
            Muscle group
          </label>
          <Select id="new-ex-muscle" value={muscleGroup} onChange={(e) => setMuscleGroup(e.target.value)}>
            {muscleGroups.map((m) => (
              <option key={m} value={m}>
                {muscleLabels[m]}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <label htmlFor="new-ex-equipment" className="text-[13px] font-medium">
            Equipment
          </label>
          <Select id="new-ex-equipment" value={equipment} onChange={(e) => setEquipment(e.target.value)}>
            {equipmentTypes.map((t) => (
              <option key={t} value={t}>
                {equipmentLabels[t]}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <FormMessage>{error}</FormMessage>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Back
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Spinner />}
          Create & add
        </Button>
      </div>
    </form>
  );
}
