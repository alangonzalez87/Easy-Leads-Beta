export type TimeRange = "day" | "week" | "month";

export function resolveRange(
  range: TimeRange = "month",
  base = new Date()
): { from: string; to: string; label: string } {
  const d = new Date(base);
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate()); // hoy 00:00
  let start = new Date(end);

  if (range === "day") {
    // mismo día
  } else if (range === "week") {
    const dow = end.getDay(); // 0=Dom
    const delta = (dow + 6) % 7; // arranca Lunes
    start.setDate(end.getDate() - delta);
  } else {
    start = new Date(end.getFullYear(), end.getMonth(), 1);
  }

  // to = fin inclusivo
  const to = new Date(end);
  to.setDate(end.getDate() + 1);

  const fromISO = start.toISOString().slice(0,10);
  const toISO = to.toISOString().slice(0,10);

  const label =
    range === "day"
      ? fromISO
      : range === "week"
      ? `${fromISO} → ${toISO}`
      : end.toLocaleString("es-AR", { month: "long", year: "numeric" });

  return { from: fromISO, to: toISO, label };
}
