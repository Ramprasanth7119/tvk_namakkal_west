/** Final constituency list — fixed order, do not sort alphabetically. */
export const CONSTITUENCIES = [
  "குமாரபாளையம்",
  "நாமக்கல்",
  "பரமத்தி வேலூர்",
] as const;

export type Constituency = (typeof CONSTITUENCIES)[number];

/** Filter/dropdown list with "All" option first. */
export const ALL_AREAS = ["அனைத்தும்", ...CONSTITUENCIES] as const;

export function isConstituency(value: string): value is Constituency {
  return (CONSTITUENCIES as readonly string[]).includes(value);
}
