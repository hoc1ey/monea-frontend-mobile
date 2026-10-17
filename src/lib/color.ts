function parseHex(hex: string): [number, number, number] | null {
  const value = hex.replace('#', '').trim();

  if (value.length === 3) {
    return [
      parseInt(value[0] + value[0], 16),
      parseInt(value[1] + value[1], 16),
      parseInt(value[2] + value[2], 16),
    ];
  }

  if (value.length === 6) {
    return [
      parseInt(value.slice(0, 2), 16),
      parseInt(value.slice(2, 4), 16),
      parseInt(value.slice(4, 6), 16),
    ];
  }

  return null;
}

/**
 * Mixes two hex colors. Used to derive the credit card gradient end color
 * (`c2 = c1` mixed 35% with cerise-950, see CONVENCIONES 1.3).
 */
export function mixHexColor(base: string, target: string, amount: number): string {
  const from = parseHex(base);
  const to = parseHex(target);

  if (!from || !to) {
    return base;
  }

  const ratio = Math.min(1, Math.max(0, amount));
  const mixed = from.map((channel, index) =>
    Math.round(channel * (1 - ratio) + to[index] * ratio),
  );

  return `rgb(${mixed[0]}, ${mixed[1]}, ${mixed[2]})`;
}
