export type ComplaintStatusCode = 
  | "registered" 
  | "under_review" 
  | "assigned" 
  | "work_in_progress" 
  | "solution_submitted" 
  | "pending_rep_approval" 
  | "pending_admin_approval" 
  | "resolved"
  | "pend"
  | "warn"
  | "ok";

export const STATUS_LABELS: Record<ComplaintStatusCode, string> = {
  registered: "பதிவு செய்யப்பட்டது",
  under_review: "பிரதிநிதி ஆய்வில்",
  assigned: "களப்பணியாளருக்கு ஒதுக்கப்பட்டது",
  work_in_progress: "களப்பணி நடைபெறுகிறது",
  solution_submitted: "தீர்வு சமர்ப்பிக்கப்பட்டது",
  pending_rep_approval: "பிரதிநிதி ஒப்புதல் நிலுவையில்",
  pending_admin_approval: "நிர்வாக ஒப்புதல் நிலுவையில்",
  resolved: "தீர்க்கப்பட்டது",
  pend: "பதிவு செய்யப்பட்டது",
  warn: "பிரதிநிதி ஆய்வில்",
  ok: "தீர்க்கப்பட்டது",
};

export const STATUS_TIMELINE_LABELS: Record<ComplaintStatusCode, string> = {
  registered: "REGISTERED",
  under_review: "UNDER_REVIEW",
  assigned: "ASSIGNED",
  work_in_progress: "WORK_IN_PROGRESS",
  solution_submitted: "SOLUTION_SUBMITTED",
  pending_rep_approval: "PENDING_REP_APPROVAL",
  pending_admin_approval: "PENDING_ADMIN_APPROVAL",
  resolved: "RESOLVED",
  pend: "REGISTERED",
  warn: "UNDER_REVIEW",
  ok: "RESOLVED",
};

export const STATUS_FILTER_LABELS: Record<string, string> = {
  all: "அனைத்தும்",
  registered: "பதிவு செய்யப்பட்டது",
  under_review: "பிரதிநிதி ஆய்வில்",
  assigned: "களப்பணியாளருக்கு ஒதுக்கப்பட்டது",
  work_in_progress: "களப்பணி நடைபெறுகிறது",
  solution_submitted: "தீர்வு சமர்ப்பிக்கப்பட்டது",
  pending_rep_approval: "பிரதிநிதி ஒப்புதல் நிலுவையில்",
  pending_admin_approval: "நிர்வாக ஒப்புதல் நிலுவையில்",
  resolved: "தீர்க்கப்பட்டது",
};

export const TRACK_STATUS_STEPS = [
  { code: "pend", label: "பதிவில்", icon: "" },
  { code: "warn", label: "நடவடிக்கையில்", icon: "⏳" },
  { code: "ok", label: "தீர்க்கப்பட்டது", icon: "✓" },
];
