import { Db } from "mongodb";

export interface VoterRegistryDocument {
  voterId: string;
  name: string;
  dob: Date | null;
  mobile: string;
  address: string;
  constituency: string;
  wardNo: number | string;
  wardName: string;
  doorNo?: string;
  importedAt?: Date;
  updatedAt: Date;
  sourceFile: string;
  /** Links voters to a specific importHistory record for safe batch delete. */
  importBatchId?: string;
  /** Legacy field from earlier seed — kept for backward compatibility reads. */
  ward?: number | string;
  createdAt?: Date;
}

export interface ImportHistoryDocument {
  fileName: string;
  totalRows: number;
  imported: number;
  updated: number;
  skipped: number;
  importedBy: string;
  importedAt: Date;
  sheetName?: string;
  skipReasons?: Record<string, number>;
}

export async function ensureVoterRegistryIndexes(db: Db): Promise<void> {
  await db.collection("voterRegistry").createIndex({ voterId: 1 }, { unique: true });
  await db.collection("voterRegistry").createIndex({ constituency: 1 });
  await db.collection("voterRegistry").createIndex({ wardNo: 1 });
  await db.collection("voterRegistry").createIndex({ name: 1 });
  await db.collection("importHistory").createIndex({ importedAt: -1 });
  await db.collection("importHistory").createIndex({ importedBy: 1 });
  await db.collection("voterRegistry").createIndex({ importBatchId: 1 });
}

export function normalizeVoterId(value: unknown): string {
  return String(value ?? "").trim().toUpperCase().replace(/\s+/g, "");
}

export function readWardNo(doc: Record<string, unknown>): number | string {
  const raw = doc.wardNo ?? doc.ward ?? 0;
  if (raw === "" || raw === null || raw === undefined) return 0;
  const num = Number(raw);
  return Number.isFinite(num) && String(raw).trim() !== "" ? num : String(raw).trim();
}

/** Format DOB for API/UI display. */
export function formatVoterDob(value: unknown): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value).trim();
  return date.toLocaleDateString("ta-IN");
}

/** Calculate age in full years from a display or ISO date string. */
export function calculateAgeFromDob(dobStr: string): string {
  const raw = String(dobStr || "").trim();
  if (!raw) return "";

  let birth: Date | null = null;
  const parts = raw.split(/[\/\-\.]/).map((p) => p.trim());
  if (parts.length === 3) {
    const a = Number(parts[0]);
    const b = Number(parts[1]);
    const c = Number(parts[2]);
    if (c > 1000) birth = new Date(c, b - 1, a);
    else if (a > 1000) birth = new Date(a, b - 1, c);
  }
  if (!birth || Number.isNaN(birth.getTime())) {
    birth = new Date(raw);
  }
  if (!birth || Number.isNaN(birth.getTime())) return "";

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age >= 0 && age <= 120 ? String(age) : "";
}
