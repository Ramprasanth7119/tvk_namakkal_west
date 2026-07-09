/**
 * Data for the "Upcoming Citizen Services" page (/upcoming-services).
 * Each feature only stores structural data + translation key prefixes;
 * the actual bilingual copy lives in constants/translations.ts under
 * "upcoming.feature.<id>.*" — following the same pattern as
 * lib/complaintCategories.ts (data separate from copy).
 */

export type UpcomingFeature = {
  id: string;
  /** SVG path "d" attributes for a 24x24 viewBox line icon (mirrors .svc-ic svg style) */
  icon: string[];
};

export const UPCOMING_FEATURES: UpcomingFeature[] = [
  {
    id: "gov_services",
    icon: ["M6 3h9l3 3v15H6z", "M9 8h6", "M9 12h6", "M9 16h4"],
  },
  {
    id: "women_safety",
    icon: ["M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z", "M12 8v5", "M12 16h.01"],
  },
  {
    id: "jobs_career",
    icon: ["M3 7h18v13H3z", "M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2", "M3 13h18"],
  },
  {
    id: "student_support",
    icon: ["M12 3 2 8l10 5 10-5-10-5z", "M6 10.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-5.5"],
  },
  {
    id: "blood_donation",
    icon: ["M12 2s6 7 6 11a6 6 0 1 1-12 0c0-4 6-11 6-11z"],
  },
  {
    id: "welfare_schemes",
    icon: [
      "M4 9h16v11H4z",
      "M4 13h16",
      "M12 9v11",
      "M8.5 9a2.5 2.5 0 1 1 0-5C10.5 4 12 6 12 9",
      "M15.5 9a2.5 2.5 0 1 0 0-5C13.5 4 12 6 12 9",
    ],
  },
  {
    id: "volunteer_assist",
    icon: [
      "M12 21s-7-4.35-9.5-9C.5 8 3 4 7 5c2 .5 3 2 5 2s3-1.5 5-2c4-1 6.5 3 4.5 7-2.5 4.65-9.5 9-9.5 9z",
    ],
  },
  {
    id: "doorstep_sevai",
    icon: ["M3 11l9-7 9 7", "M5 10v10h14V10", "M9 20v-6h6v6"],
  },
  {
    id: "ai_assistant",
    icon: [
      "M5 7h14v11H5z",
      "M9 21v-3",
      "M15 21v-3",
      "M12 7V3",
      "M9 12.5h.01",
      "M15 12.5h.01",
    ],
  },
  {
    id: "events_camps",
    icon: ["M3 5h18v16H3z", "M16 3v4", "M8 3v4", "M3 10h18"],
  },
  {
    id: "live_support",
    icon: ["M4 4h16v12H8l-4 4z", "M8 9h8", "M8 12h5"],
  },
  {
    id: "nearby_help",
    icon: ["M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z", "M12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"],
  },
  {
    id: "smart_notifications",
    icon: ["M6 8a6 6 0 1 1 12 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5z", "M10 19a2 2 0 0 0 4 0"],
  },
];

/** Shared generic workflow shown inside every expanded card ("How will it work?"). */
export const UPCOMING_WORKFLOW_STEPS = [
  "upcoming.workflow.step.need_help",
  "upcoming.workflow.step.open_app",
  "upcoming.workflow.step.choose_service",
  "upcoming.workflow.step.submit_request",
  "upcoming.workflow.step.receive_guidance",
  "upcoming.workflow.step.track_progress",
  "upcoming.workflow.step.completed",
] as const;
