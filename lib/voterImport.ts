import * as xlsx from "xlsx";
import { Db, AnyBulkWriteOperation, ObjectId } from "mongodb";
import {
  ColumnMapping,
  VoterFieldKey,
  detectColumnMapping,
  getAllFieldKeys,
} from "./voterColumnMap";
import {
  ImportHistoryDocument,
  VoterRegistryDocument,
  normalizeVoterId,
} from "./voterRegistry";

const ALLOWED_EXTENSIONS = [".xlsx", ".xls", ".csv"];
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const BATCH_SIZE = 500;

export interface ParsedWorkbook {
  sheetNames: string[];
  sheetName: string;
  headers: string[];
  rows: Record<string, unknown>[];
  totalRows: number;
}

export interface AnalyzeResult {
  fileName: string;
  sheetNames: string[];
  sheetName: string;
  headers: string[];
  mapping: ColumnMapping;
  mappingDisplay: ReturnType<typeof buildMappingDisplay>;
  previewRows: Record<string, unknown>[];
  totalRows: number;
  missingRequired: VoterFieldKey[];
}

export interface ImportSummary {
  fileName: string;
  sheetName: string;
  totalRows: number;
  imported: number;
  updated: number;
  skipped: number;
  skipReasons: Record<string, number>;
  durationMs: number;
}

function getExtension(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  return idx >= 0 ? fileName.slice(idx).toLowerCase() : "";
}

export function assertAllowedVoterFile(fileName: string, size: number): void {
  const ext = getExtension(fileName);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error("ஆதரிக்கப்படும் வடிவங்கள்: xlsx, xls, csv மட்டுமே");
  }
  if (size <= 0) {
    throw new Error("கோப்பு காலியாக உள்ளது");
  }
  if (size > MAX_FILE_BYTES) {
    throw new Error("கோப்பு அளவு 50MB வரம்பை மீறுகிறது");
  }
}

export function parseVoterWorkbook(
  buffer: Buffer,
  fileName: string,
  preferredSheet?: string
): ParsedWorkbook {
  assertAllowedVoterFile(fileName, buffer.length);

  const ext = getExtension(fileName);
  const workbook =
    ext === ".csv"
      ? xlsx.read(buffer.toString("utf8"), { type: "string", raw: false })
      : xlsx.read(buffer, { type: "buffer", cellDates: false });

  const sheetNames = workbook.SheetNames.filter(Boolean);
  if (sheetNames.length === 0) {
    throw new Error("விரிதாள் எதுவும் கண்டறியப்படவில்லை");
  }

  const sheetName =
    preferredSheet && sheetNames.includes(preferredSheet)
      ? preferredSheet
      : sheetNames[0];

  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });

  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

  return {
    sheetNames,
    sheetName,
    headers,
    rows,
    totalRows: rows.length,
  };
}

function buildMappingDisplay(mapping: ColumnMapping) {
  return getAllFieldKeys().map((field) => ({
    field,
    column: mapping[field] ?? null,
  }));
}

function cellValue(row: Record<string, unknown>, column?: string): string {
  if (!column) return "";
  const val = row[column];
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

function isEmptyRow(row: Record<string, unknown>): boolean {
  return Object.values(row).every(
    (v) => v === null || v === undefined || String(v).trim() === ""
  );
}

function parseWardNo(value: string): number | string {
  if (!value) return 0;
  const num = Number(value);
  if (Number.isFinite(num) && value.trim() !== "") return num;
  return value.trim();
}

/** Parse DOB from Excel/text values — returns null if missing or invalid. */
export function parseDob(raw: unknown): Date | null {
  if (raw === null || raw === undefined || String(raw).trim() === "") return null;

  if (raw instanceof Date && !Number.isNaN(raw.getTime())) return raw;

  const text = String(raw).trim();

  // Excel serial number
  if (/^\d+(\.\d+)?$/.test(text)) {
    const serial = Number(text);
    if (serial > 20000 && serial < 80000) {
      const epoch = new Date(Date.UTC(1899, 11, 30));
      const parsed = new Date(epoch.getTime() + serial * 86400000);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = text.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]) - 1;
    let year = Number(dmy[3]);
    if (year < 100) {
      // Dynamic cutoff: years > (currentYear - 18) % 100 are in 1900s (old voters)
      const cutoff = (new Date().getFullYear() - 18) % 100;
      year += year > cutoff ? 1900 : 2000;
    }
    const parsed = new Date(year, month, day);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const iso = new Date(text);
  if (!Number.isNaN(iso.getTime()) && iso.getFullYear() > 1900 && iso.getFullYear() < 2100) {
    return iso;
  }

  return null;
}

function formatDobPreview(raw: unknown): string {
  const parsed = parseDob(raw);
  if (parsed) return parsed.toLocaleDateString("ta-IN");
  return String(raw ?? "").trim();
}

export function normalizeVoterRow(
  row: Record<string, unknown>,
  mapping: ColumnMapping
): { doc: Omit<VoterRegistryDocument, "importedAt" | "updatedAt" | "sourceFile"> | null; reason?: string } {
  const voterId = normalizeVoterId(cellValue(row, mapping.voterId));
  if (!voterId) {
    return { doc: null, reason: "missingVoterId" };
  }
  if (voterId.length < 3 || voterId.length > 40) {
    return { doc: null, reason: "invalidVoterId" };
  }

  return {
    doc: {
      voterId,
      name: cellValue(row, mapping.name),
      dob: mapping.dob ? parseDob(row[mapping.dob]) : null,
      mobile: cellValue(row, mapping.mobile).replace(/\s+/g, ""),
      address: cellValue(row, mapping.address),
      constituency: cellValue(row, mapping.constituency),
      wardNo: parseWardNo(cellValue(row, mapping.wardNo)),
      wardName: cellValue(row, mapping.wardName),
      doorNo: mapping.doorNo ? cellValue(row, mapping.doorNo) : undefined,
      panchayat: mapping.panchayat ? cellValue(row, mapping.panchayat) : undefined,
      taluk: mapping.taluk ? cellValue(row, mapping.taluk) : undefined,
      district: mapping.district ? cellValue(row, mapping.district) : undefined,
      gender: mapping.gender ? cellValue(row, mapping.gender) : undefined,
      age: mapping.age ? parseWardNo(cellValue(row, mapping.age)) : undefined,
    },
  };
}

export function analyzeVoterFile(
  buffer: Buffer,
  fileName: string,
  preferredSheet?: string,
  overrideMapping?: ColumnMapping
): AnalyzeResult {
  const parsed = parseVoterWorkbook(buffer, fileName, preferredSheet);
  const detected = detectColumnMapping(parsed.headers);
  const mapping: ColumnMapping = { ...detected.mapping, ...overrideMapping };

  const previewRows = parsed.rows.slice(0, 10).map((row) => {
    const preview: Record<string, unknown> = {};
    for (const field of getAllFieldKeys()) {
      if (field === "dob") {
        preview[field] = mapping.dob ? formatDobPreview(row[mapping.dob]) : "";
      } else {
        preview[field] = cellValue(row, mapping[field]);
      }
    }
    return preview;
  });

  return {
    fileName,
    sheetNames: parsed.sheetNames,
    sheetName: parsed.sheetName,
    headers: parsed.headers,
    mapping,
    mappingDisplay: buildMappingDisplay(mapping),
    previewRows,
    totalRows: parsed.totalRows,
    missingRequired: detected.missingRequired.filter((f) => !mapping[f]),
  };
}

export async function importVoterFile(
  db: Db,
  buffer: Buffer,
  fileName: string,
  importedBy: string,
  options?: { sheetName?: string; mapping?: ColumnMapping }
): Promise<ImportSummary> {
  const started = Date.now();
  const parsed = parseVoterWorkbook(buffer, fileName, options?.sheetName);
  const detected = detectColumnMapping(parsed.headers);
  const mapping: ColumnMapping = { ...detected.mapping, ...options?.mapping };

  if (!mapping.voterId) {
    throw new Error("வாக்காளர் அடையாள எண் புலம் கண்டறியப்படவில்லை. Import செய்ய முடியாது.");
  }

  const skipReasons: Record<string, number> = {};
  const deduped = new Map<
    string,
    Omit<VoterRegistryDocument, "importedAt" | "updatedAt" | "sourceFile">
  >();

  for (const row of parsed.rows) {
    if (isEmptyRow(row)) {
      skipReasons.emptyRow = (skipReasons.emptyRow || 0) + 1;
      continue;
    }

    const { doc, reason } = normalizeVoterRow(row, mapping);
    if (!doc) {
      const key = reason || "invalidRow";
      skipReasons[key] = (skipReasons[key] || 0) + 1;
      continue;
    }

    if (deduped.has(doc.voterId)) {
      skipReasons.duplicateInFile = (skipReasons.duplicateInFile || 0) + 1;
    }
    deduped.set(doc.voterId, doc);
  }

  const records = Array.from(deduped.values());
  let imported = 0;
  let updated = 0;

  const collection = db.collection<VoterRegistryDocument>("voterRegistry");
  const now = new Date();
  const batchId = new ObjectId();

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const chunk = records.slice(i, i + BATCH_SIZE);
    const ids = chunk.map((r) => r.voterId);
    const existing = await collection
      .find({ voterId: { $in: ids } }, { projection: { voterId: 1 } })
      .toArray();
    const existingSet = new Set(existing.map((e) => e.voterId));

    for (const rec of chunk) {
      if (existingSet.has(rec.voterId)) updated++;
      else imported++;
    }

    const ops: AnyBulkWriteOperation<VoterRegistryDocument>[] = chunk.map((rec) => ({
      updateOne: {
        filter: { voterId: rec.voterId },
        update: {
          $set: {
            ...rec,
            updatedAt: now,
            sourceFile: fileName,
            importBatchId: batchId.toString(),
          },
          $setOnInsert: { importedAt: now },
        },
        upsert: true,
      },
    }));

    if (ops.length > 0) {
      await collection.bulkWrite(ops, { ordered: false });
    }
  }

  const totalSkipped = Object.values(skipReasons).reduce((a, b) => a + b, 0);

  const history: ImportHistoryDocument = {
    fileName,
    totalRows: parsed.totalRows,
    imported,
    updated,
    skipped: totalSkipped,
    importedBy,
    importedAt: now,
    sheetName: parsed.sheetName,
    skipReasons,
  };

  await db.collection<ImportHistoryDocument>("importHistory").insertOne({
    _id: batchId,
    ...history,
  });

  return {
    fileName,
    sheetName: parsed.sheetName,
    totalRows: parsed.totalRows,
    imported,
    updated,
    skipped: totalSkipped,
    skipReasons,
    durationMs: Date.now() - started,
  };
}

/** Seed helper — reuse import pipeline for bundled sample file. */
export async function seedVotersFromBuffer(
  db: Db,
  buffer: Buffer,
  fileName: string
): Promise<void> {
  const count = await db.collection("voterRegistry").countDocuments();
  if (count > 0) return;
  await importVoterFile(db, buffer, fileName, "system-seed");
}
