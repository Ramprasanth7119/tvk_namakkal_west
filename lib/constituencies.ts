import { CONSTITUENCIES, ALL_AREAS, type Constituency } from "@/constants/constituencies";

export { CONSTITUENCIES, ALL_AREAS };
export type { Constituency };

export function isConstituency(value: string): value is Constituency {
  return (CONSTITUENCIES as readonly string[]).includes(value);
}
