/** yyyy-mm-dd in local time (not UTC — avoids the midnight-shift bug). */
export function isoDate(d: Date = new Date()): string {
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return isoDate(d);
}

export function prettyDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** The retail order cutoff is ~21:00 local (docs/decisions/0003). After it,
 *  "tomorrow" for ordering purposes is the day after tomorrow. */
export const ORDER_CUTOFF_HOUR = 21;

export function nextDeliveryDate(now: Date = new Date()): string {
  const base = isoDate(now);
  return now.getHours() >= ORDER_CUTOFF_HOUR ? addDays(base, 2) : addDays(base, 1);
}

export function isPastCutoffFor(deliveryDate: string, now: Date = new Date()): boolean {
  // Editing is frozen once the cutoff for that delivery date has passed.
  return deliveryDate < nextDeliveryDate(now);
}
