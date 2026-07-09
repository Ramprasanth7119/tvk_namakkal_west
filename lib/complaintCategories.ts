/**
 * Stable complaint category keys for DB storage.
 * Display labels live in constants/translations.ts (cat.* / sub.*).
 * Legacy Tamil strings from older records are mapped on read.
 */

export const COMPLAINT_CATEGORY_TREE: Record<string, readonly string[]> = {
  "cat.electricity": [
    "sub.electricity.pole_damage",
    "sub.electricity.frequent_outage",
    "sub.electricity.hanging_wires",
    "sub.common.other",
  ],
  "cat.road": [
    "sub.road.surface_damage",
    "sub.road.new_road_needed",
    "sub.road.speed_breaker_needed",
    "sub.common.other",
  ],
  "cat.water": [
    "sub.water.pipe_burst",
    "sub.water.no_supply",
    "sub.water.contaminated",
    "sub.common.other",
  ],
  "cat.drainage": [
    "sub.drainage.sewer_block",
    "sub.drainage.stagnation",
    "sub.common.other",
  ],
  "cat.sanitation": [
    "sub.sanitation.garbage_not_collected",
    "sub.sanitation.mosquito_spray",
    "sub.common.other",
  ],
  "cat.transport": [
    "sub.transport.bus_issue",
    "sub.transport.congestion",
    "sub.common.other",
  ],
  "cat.streetlight": [
    "sub.streetlight.not_working",
    "sub.streetlight.new_pole_needed",
    "sub.common.other",
  ],
  "cat.education": [
    "sub.education.building_damage",
    "sub.education.toilet_facility",
    "sub.common.other",
  ],
  "cat.health": [
    "sub.health.primary_center",
    "sub.health.medicine_shortage",
    "sub.common.other",
  ],
  "cat.welfare": [
    "sub.welfare.senior_pension",
    "sub.welfare.ration_issue",
    "sub.common.other",
  ],
  "cat.revenue": [
    "sub.revenue.patta_transfer",
    "sub.revenue.certificate_request",
    "sub.common.other",
  ],
  "cat.police": [
    "sub.police.security_issue",
    "sub.police.complaint_action",
    "sub.common.other",
  ],
  "cat.environment": [
    "sub.environment.waterbody_pollution",
    "sub.environment.air_pollution",
    "sub.common.other",
  ],
  "cat.other": ["sub.other.general"],
} as const;

export const DEFAULT_COMPLAINT_CATEGORY = "cat.electricity";

export const COMPLAINT_CATEGORY_KEYS = Object.keys(
  COMPLAINT_CATEGORY_TREE
) as (keyof typeof COMPLAINT_CATEGORY_TREE)[];

/** Legacy Tamil category labels → stable keys (existing DB records). */
const LEGACY_CATEGORY_TO_KEY: Record<string, string> = {
  மின்சாரம்: "cat.electricity",
  Electricity: "cat.electricity",
  சாலை: "cat.road",
  Road: "cat.road",
  குடிநீர்: "cat.water",
  Water: "cat.water",
  கழிவுநீர்: "cat.drainage",
  Drainage: "cat.drainage",
  சுகாதாரம்: "cat.sanitation",
  Sanitation: "cat.sanitation",
  போக்குவரத்து: "cat.transport",
  Transport: "cat.transport",
  தெருவிளக்கு: "cat.streetlight",
  Streetlight: "cat.streetlight",
  கல்வி: "cat.education",
  Education: "cat.education",
  மருத்துவம்: "cat.health",
  Health: "cat.health",
  "அரசு நலத்திட்டம்": "cat.welfare",
  Welfare: "cat.welfare",
  "வருவாய் துறை": "cat.revenue",
  Revenue: "cat.revenue",
  காவல்துறை: "cat.police",
  Police: "cat.police",
  சுற்றுச்சூழல்: "cat.environment",
  Environment: "cat.environment",
  பிற: "cat.other",
  Other: "cat.other",
};

/** Legacy Tamil subcategory labels → stable keys. */
const LEGACY_SUBCATEGORY_TO_KEY: Record<string, string> = {
  "மின்கம்பம் பழுது": "sub.electricity.pole_damage",
  "அடிக்கடி மின்தடை": "sub.electricity.frequent_outage",
  "தொங்கும் மின் கம்பிகள்": "sub.electricity.hanging_wires",
  "சாலை சேதம்": "sub.road.surface_damage",
  "புதிய சாலை தேவை": "sub.road.new_road_needed",
  "வேகத்தடை தேவை": "sub.road.speed_breaker_needed",
  "குடிநீர் குழாய் உடைப்பு": "sub.water.pipe_burst",
  "குடிநீர் வராமை": "sub.water.no_supply",
  "அசுத்தமான குடிநீர்": "sub.water.contaminated",
  "சாக்கடை அடைப்பு": "sub.drainage.sewer_block",
  "கழிவுநீர் தேக்கம்": "sub.drainage.stagnation",
  "குப்பை அள்ளப்படவில்லை": "sub.sanitation.garbage_not_collected",
  "கொசு மருந்து தெளிக்க வேண்டும்": "sub.sanitation.mosquito_spray",
  "பேருந்து வசதி குறைபாடு": "sub.transport.bus_issue",
  "போக்குவரத்து நெரிசல்": "sub.transport.congestion",
  "தெருவிளக்கு எரியவில்லை": "sub.streetlight.not_working",
  "புதிய தெருவிளக்கு கம்பம் தேவை": "sub.streetlight.new_pole_needed",
  "பள்ளி கட்டிட பழுது": "sub.education.building_damage",
  "பள்ளி கழிப்பறை வசதி": "sub.education.toilet_facility",
  "ஆரம்ப சுகாதார நிலையம்": "sub.health.primary_center",
  "மருந்து தட்டுப்பாடு": "sub.health.medicine_shortage",
  "முதியோர் உதவித்தொகை": "sub.welfare.senior_pension",
  "ரேஷன் கடை குறைபாடு": "sub.welfare.ration_issue",
  "பட்டா மாறுதல்": "sub.revenue.patta_transfer",
  "சான்றிதழ் கோரிக்கை": "sub.revenue.certificate_request",
  "பாதுகாப்பு குறைபாடு": "sub.police.security_issue",
  "புகார் மனு மீது நடவடிக்கை": "sub.police.complaint_action",
  "நீர்நிலை மாசுபடுதல்": "sub.environment.waterbody_pollution",
  "காற்று மாசுபடுதல்": "sub.environment.air_pollution",
  பிற: "sub.common.other",
  "பிற குறைபாடுகள்": "sub.other.general",
};

export function normalizeCategoryKey(value?: string | null): string {
  if (!value) return "";
  if (value.startsWith("cat.")) return value;
  return LEGACY_CATEGORY_TO_KEY[value] || value;
}

export function normalizeSubcategoryKey(value?: string | null): string {
  if (!value) return "";
  if (value.startsWith("sub.")) return value;
  return LEGACY_SUBCATEGORY_TO_KEY[value] || value;
}

/** Resolve a stored category or subcategory value to a translated label. */
export function labelComplaintCategory(
  value: string | undefined | null,
  t: (key: string) => string
): string {
  if (!value) return "";
  const normalized = value.startsWith("sub.")
    ? normalizeSubcategoryKey(value)
    : normalizeCategoryKey(value);
  const translated = t(normalized);
  return translated !== normalized ? translated : value;
}

export function getSubcategoryKeys(categoryKey: string): readonly string[] {
  const key = normalizeCategoryKey(categoryKey);
  return COMPLAINT_CATEGORY_TREE[key] || COMPLAINT_CATEGORY_TREE[DEFAULT_COMPLAINT_CATEGORY];
}
