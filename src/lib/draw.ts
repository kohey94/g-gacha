export function drawRandomItem<T>(
  items: readonly T[],
  random: () => number = Math.random,
): T | undefined {
  if (items.length === 0) {
    return undefined;
  }

  const value = random();
  const normalized = Number.isFinite(value)
    ? Math.min(Math.max(value, 0), 0.9999999999999999)
    : 0;

  return items[Math.floor(normalized * items.length)];
}
