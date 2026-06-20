export const CONSTITUENCIES = [
  "குமாரபாளையம்",
  "நாமக்கல்",
  "பரமத்தி வேலூர்",
] as const;

export type Constituency = (typeof CONSTITUENCIES)[number];

export const ALL_AREAS = ["அனைத்தும்", ...CONSTITUENCIES] as const;
