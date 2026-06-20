import { 
  type ComplaintStatusCode, 
  STATUS_LABELS, 
  STATUS_TIMELINE_LABELS 
} from "@/constants/statuses";

export type { ComplaintStatusCode };
export { STATUS_LABELS, STATUS_TIMELINE_LABELS };

export function normalizeStatus(status?: string | null): ComplaintStatusCode {
  if (!status) return "registered";
  const lower = status.toLowerCase();
  if (lower === "pend" || lower === "registered") return "registered";
  if (lower === "warn" || lower === "under_review") return "under_review";
  if (lower === "assigned") return "assigned";
  if (lower === "work_in_progress") return "work_in_progress";
  if (lower === "solution_submitted") return "solution_submitted";
  if (lower === "pending_rep_approval") return "pending_rep_approval";
  if (lower === "pending_admin_approval") return "pending_admin_approval";
  if (lower === "ok" || lower === "resolved") return "resolved";
  return "registered";
}

export function getStatusLabel(status?: string | null): string {
  return STATUS_LABELS[normalizeStatus(status)];
}

export interface TimelineEntry {
  status: ComplaintStatusCode;
  updatedAt: Date;
  updatedBy: string;
  notes?: string;
}

export function buildInitialTimeline(): TimelineEntry[] {
  return [{ status: "registered", updatedAt: new Date(), updatedBy: "system", notes: "மனு வெற்றிகரமாக பதிவு செய்யப்பட்டது." }];
}
