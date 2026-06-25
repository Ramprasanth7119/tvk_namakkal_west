export type VoterFieldKey =
  | "voterId"
  | "name"
  | "dob"
  | "wardNo"
  | "wardName"
  | "constituency"
  | "mobile"
  | "address"
  | "doorNo"
  | "panchayat"
  | "taluk"
  | "district"
  | "gender"
  | "age";

export type ColumnMapping = Partial<Record<VoterFieldKey, string>>;

const FIELD_LABELS: Record<VoterFieldKey, string> = {
  voterId: "Voter ID",
  name: "Voter Name",
  dob: "Date of Birth",
  wardNo: "Ward No",
  wardName: "Ward Name",
  constituency: "Constituency",
  mobile: "Mobile",
  address: "Address",
  doorNo: "Door Number",
  panchayat: "Panchayat",
  taluk: "Taluk",
  district: "District",
  gender: "Gender",
  age: "Age",
};

/** English + Tamil header aliases (normalized before compare). */
const COLUMN_ALIASES: Record<VoterFieldKey, string[]> = {
  voterId: [
    "voterid",
    "voter id",
    "voter_id",
    "epic",
    "epicno",
    "epic number",
    "elector id",
    "electorid",
    "id",
    "voter no",
    "voterno",
    "அடையாள",
    "அடையாளஎண்",
    "வாக்காளர்அடையாளம்",
  ],
  name: [
    "votername",
    "voter name",
    "name",
    "elector name",
    "electorname",
    "fullname",
    "full name",
    "பெயர்",
    "வாக்காளர்பெயர்",
  ],
  dob: [
    "dob",
    "dateofbirth",
    "date of birth",
    "birthdate",
    "birth date",
    "birthday",
    "birth",
    "age date",
    "பிறந்ததேதி",
    "பிறந்தநாள்",
    "பிறந்த",
  ],
  wardNo: [
    "wardno",
    "ward no",
    "ward",
    "ward number",
    "wardnumber",
    "ward_no",
    "வார்டு",
    "வார்டுஎண்",
  ],
  wardName: [
    "wardname",
    "ward name",
    "ward_name",
    "வார்டுபெயர்",
  ],
  constituency: [
    "constituency",
    "assembly",
    "ac",
    "segment",
    "தொகுதி",
    "சட்டமன்றத்தொகுதி",
  ],
  mobile: [
    "mobile",
    "phone",
    "phoneno",
    "phone no",
    "mobileno",
    "mobile no",
    "contact",
    "cell",
    "தொலைபேசி",
    "மொபைல்",
  ],
  address: [
    "address",
    "addr",
    "residence",
    "location",
    "முகவரி",
  ],
  doorNo: [
    "doorno",
    "door number",
    "door_no",
    "door_number",
    "houseno",
    "house no",
    "house_no",
    "கதவுஎண்",
    "கதவு",
    "வீட்டுஎண்",
  ],
  panchayat: [
    "panchayat",
    "panchayat name",
    "panchayat_name",
    "village panchayat",
    "கிராம பஞ்சாயத்து",
    "பஞ்சாயத்து",
  ],
  taluk: [
    "taluk",
    "taluka",
    "tahsil",
    "tehsil",
    "வட்டம்",
    "தாலுகா",
  ],
  district: [
    "district",
    "dist",
    "மாவட்டம்",
  ],
  gender: [
    "gender",
    "sex",
    "பாலினம்",
  ],
  age: [
    "age",
    "வயது",
  ],
};

function normalizeHeader(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s.-]+/g, "")
    .replace(/[^\w\u0B80-\u0BFF]/g, "");
}

function scoreHeader(header: string, aliases: string[]): number {
  const norm = normalizeHeader(header);
  if (!norm) return 0;

  let best = 0;
  for (const alias of aliases) {
    const normAlias = normalizeHeader(alias);
    if (!normAlias) continue;
    if (norm === normAlias) best = Math.max(best, 100);
    else if (norm.includes(normAlias) || normAlias.includes(norm)) {
      best = Math.max(best, 75);
    } else if (norm.startsWith(normAlias) || normAlias.startsWith(norm)) {
      best = Math.max(best, 60);
    }
  }
  return best;
}

/** Detect best column mapping from actual spreadsheet headers. */
export function detectColumnMapping(headers: string[]): {
  mapping: ColumnMapping;
  scores: Partial<Record<VoterFieldKey, number>>;
  missingRequired: VoterFieldKey[];
} {
  const fields = Object.keys(FIELD_LABELS) as VoterFieldKey[];
  const usedHeaders = new Set<string>();
  const mapping: ColumnMapping = {};
  const scores: Partial<Record<VoterFieldKey, number>> = {};

  const ranked = fields.map((field) => {
    let bestHeader = "";
    let bestScore = 0;
    for (const header of headers) {
      if (usedHeaders.has(header)) continue;
      const score = scoreHeader(header, COLUMN_ALIASES[field]);
      if (score > bestScore) {
        bestScore = score;
        bestHeader = header;
      }
    }
    return { field, bestHeader, bestScore };
  });

  ranked.sort((a, b) => b.bestScore - a.bestScore);

  for (const item of ranked) {
    if (item.bestScore < 55 || !item.bestHeader) continue;
    if (usedHeaders.has(item.bestHeader)) continue;
    mapping[item.field] = item.bestHeader;
    scores[item.field] = item.bestScore;
    usedHeaders.add(item.bestHeader);
  }

  const missingRequired: VoterFieldKey[] = [];
  if (!mapping.voterId) missingRequired.push("voterId");

  return { mapping, scores, missingRequired };
}

export function getFieldLabel(field: VoterFieldKey): string {
  return FIELD_LABELS[field];
}

export function getAllFieldKeys(): VoterFieldKey[] {
  return Object.keys(FIELD_LABELS) as VoterFieldKey[];
}

export function mappingToDisplay(mapping: ColumnMapping): Array<{
  field: VoterFieldKey;
  label: string;
  column: string | null;
}> {
  return getAllFieldKeys().map((field) => ({
    field,
    label: FIELD_LABELS[field],
    column: mapping[field] ?? null,
  }));
}
