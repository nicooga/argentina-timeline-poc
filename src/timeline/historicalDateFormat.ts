export function formatHistoricalYear(year: number): string {
  if (year < 0) return `${Math.abs(year)} a.C.`;
  return String(year);
}

export function formatHistoricalYearDate(d: Date): string {
  return formatHistoricalYear(d.getUTCFullYear());
}

export function formatHistoricalDate(d: Date): string {
  return `${formatHistoricalMonthDay(d)} ${formatHistoricalYearDate(d)}`;
}

export function formatHistoricalMonthDay(d: Date): string {
  return d.toLocaleDateString("es-AR", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  });
}
