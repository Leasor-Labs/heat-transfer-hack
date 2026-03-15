/**
 * Filter Ohio seed data by location search query.
 * Returns items whose name (case-insensitive) contains the trimmed query.
 * Empty query returns the full array.
 */
export function filterOhioByQuery<T extends { name: string }>(
  items: T[],
  locationSearchQuery?: string
): T[] {
  const q = locationSearchQuery?.trim();
  if (!q) return [...items];
  const normalized = q.toLowerCase();
  return items.filter((item) =>
    item.name.toLowerCase().includes(normalized)
  );
}
