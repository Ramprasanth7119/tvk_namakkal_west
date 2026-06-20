export type ComplaintStatusCode = "pend" | "warn" | "ok";

export const STATUS_LABELS: Record<ComplaintStatusCode, string> = {
  pend: "பதிவில்",
  warn: "நடவடிக்கையில்",
  ok: "தீர்க்கப்பட்டது",
};

export const STATUS_TIMELINE_LABELS: Record<ComplaintStatusCode, string> = {
  pend: "PENDING",
  warn: "IN_PROGRESS",
  ok: "RESOLVED",
};

export function normalizeStatus(status?: string | null): ComplaintStatusCode {
  if (status === "ok" || status === "warn" || status === "pend") return status;
  if (status === "RESOLVED") return "ok";
  if (status === "IN_PROGRESS") return "warn";
  return "pend";
}

export function getStatusLabel(status?: string | null): string {
  return STATUS_LABELS[normalizeStatus(status)];
}

export interface TimelineEntry {
  status: ComplaintStatusCode;
  updatedAt: Date;
  updatedBy: string;
}

export function buildInitialTimeline(): TimelineEntry[] {
  return [{ status: "pend", updatedAt: new Date(), updatedBy: "system" }];
}
