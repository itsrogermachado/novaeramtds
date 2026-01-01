/**
 * Parse a date-only string (YYYY-MM-DD) into a Date object at local midnight.
 * This avoids the UTC interpretation that causes off-by-one day bugs.
 */
export function parseDateOnly(ymd: string): Date {
  const [year, month, day] = ymd.split('-').map(Number);
  return new Date(year, month - 1, day);
}
