import { normalizeStatus, type ComplaintStatusCode } from "@/lib/complaintStatus";

export type AnalyticsDisplayStatus = "ok" | "warn" | "pend";

export function toAnalyticsDisplayStatus(status?: string | null): AnalyticsDisplayStatus {
  const normalized = normalizeStatus(status);
  if (normalized === "resolved") return "ok";
  if (
    normalized === "under_review" ||
    normalized === "assigned" ||
    normalized === "work_in_progress" ||
    normalized === "solution_submitted" ||
    normalized === "pending_rep_approval" ||
    normalized === "pending_admin_approval"
  ) {
    return "warn";
  }
  return "pend";
}

export function categoryToSector(category?: string): string {
  if (category === "மின்சாரம்") return "power";
  if (category === "சாலை" || category === "போக்குவரத்து") return "road";
  if (category === "குடிநீர்") return "water";
  if (category === "கழிவுநீர்" || category === "சுகாதாரம்") return "drain";
  if (category === "தெருவிளக்கு") return "light";
  if (category === "கல்வி") return "edu";
  if (category === "மருத்துவம்" || category === "சுற்றுச்சூழல்") return "health";
  return "civic";
}

export function anonymizedIssueTitle(category?: string, subcategory?: string): string {
  return subcategory || category || "பொது புகார்";
}

export interface PublicAnalyticsRecord {
  id: string;
  sector: string;
  area: string;
  title: string;
  month: number;
  date: string;
  status: AnalyticsDisplayStatus;
}

export function mapComplaintToPublicRecord(item: {
  trackingId?: string;
  constituency?: string;
  status?: string | null;
  createdAt?: Date | string;
  complaintDetails?: { category?: string; subcategory?: string };
}): PublicAnalyticsRecord {
  const createdDate = new Date(item.createdAt || Date.now());
  const status = toAnalyticsDisplayStatus(item.status);
  const category = item.complaintDetails?.category;
  const subcategory = item.complaintDetails?.subcategory;

  return {
    id: item.trackingId || "—",
    sector: categoryToSector(category),
    area: item.constituency || "—",
    title: anonymizedIssueTitle(category, subcategory),
    month: createdDate.getMonth() % 6,
    date: createdDate.toLocaleDateString("ta-IN"),
    status,
  };
}
