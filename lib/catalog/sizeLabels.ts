/** Parse supported bottle and legacy bundle labels as positive total milliliters. */
export function parseSizeMilliliters(label: string): number | null {
  const normalized = label.trim().toLowerCase();
  const bottle = normalized.match(/^([0-9]+(?:\.[0-9]+)?)\s*(?:ml)?$/);
  const bundle = normalized.match(/^([0-9]+(?:\.[0-9]+)?)\s*[x\u00d7]\s*([0-9]+(?:\.[0-9]+)?)\s*ml$/);
  const amount = bottle
    ? Number(bottle[1])
    : bundle
      ? Number(bundle[1]) * Number(bundle[2])
      : Number.NaN;

  return Number.isFinite(amount) && amount > 0 && amount <= 1e17 ? amount : null;
}

export function normalizeSizeLabel(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, '').replace(/\u00d7/g, 'x');
}
