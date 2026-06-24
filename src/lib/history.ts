import type { ValuePoint } from "./types";

/** Insert or replace the point for a given date, keeping the list sorted. */
export function upsertPoint(
  history: ValuePoint[],
  point: ValuePoint,
): ValuePoint[] {
  const next = history.filter((p) => p.date !== point.date);
  next.push(point);
  next.sort((a, b) => a.date.localeCompare(b.date));
  return next;
}

/** Bare numeric values of a history series, oldest first. */
export function historyValues(history: ValuePoint[] | undefined): number[] {
  return (history ?? []).map((p) => p.value);
}
