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
  panchayat?: string;
  taluk?: string;
  district?: string;
  gender?: string;
  age?: number | string;
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
  await db.collection("voterRegistry").createIndex({ doorNo: 1 });
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

/** Format DOB for API/UI display (always returning YYYY-MM-DD). */
export function formatVoterDob(value: unknown): string {
  if (value === null || value === undefined || String(value).trim() === "") return "";
  
  let date: Date | null = null;
  
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    date = value;
  } else {
    const text = String(value).trim();
    
    // Excel serial number
    if (/^\d+(\.\d+)?$/.test(text)) {
      const serial = Number(text);
      if (serial > 20000 && serial < 80000) {
        const epoch = new Date(Date.UTC(1899, 11, 30));
        date = new Date(epoch.getTime() + serial * 86400000);
      }
    }
    
    if (!date || Number.isNaN(date.getTime())) {
      // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
      const dmy = text.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
      if (dmy) {
        const day = Number(dmy[1]);
        const month = Number(dmy[2]) - 1;
        let year = Number(dmy[3]);
        if (year < 100) {
          // Dynamic cutoff: years > (currentYear - 18) % 100 are in 1900s (old voters)
          // years <= cutoff are in 2000s (recent births)
          const cutoff = (new Date().getFullYear() - 18) % 100;
          year += year > cutoff ? 1900 : 2000;
        }
        date = new Date(year, month, day);
      }
    }
    
    if (!date || Number.isNaN(date.getTime())) {
      const iso = new Date(text);
      if (!Number.isNaN(iso.getTime()) && iso.getFullYear() > 1900 && iso.getFullYear() < 2100) {
        date = iso;
      }
    }
  }

  if (!date || Number.isNaN(date.getTime())) {
    return String(value).trim();
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
