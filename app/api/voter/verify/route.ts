import { NextResponse } from "next/server";
import { lookupVoter } from "@/lib/voterLookup";
import { getDb } from "@/lib/mongodb";
import { readWardNo, formatVoterDob } from "@/lib/voterRegistry";
import {
  getClientIp,
  validateRequestHeaders,
  checkRateLimit,
  sanitizeInput,
  logSecurityEvent,
} from "@/lib/security";

// Helper to normalize Tamil/English name for exact and phonetic similarity comparison
function normalizeName(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "") // remove all spaces
    .replace(/[^a-zA-Z\u0B80-\u0BFF0-9]/g, ""); // keep only alphanumeric and Tamil characters
}

// Standard Levenshtein distance implementation
function getLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function getSimilarity(s1: string, s2: string): number {
  const n1 = normalizeName(s1);
  const n2 = normalizeName(s2);
  if (!n1 || !n2) return 0;
  if (n1 === n2) return 1.0;

  const maxLength = Math.max(n1.length, n2.length);
  const distance = getLevenshteinDistance(n1, n2);
  return (maxLength - distance) / maxLength;
}

export async function POST(request: Request) {
  const ip = getClientIp(request);

  try {
    // 1. Validate request headers
    const headerCheck = validateRequestHeaders(request);
    if (!headerCheck.valid) {
      return NextResponse.json({ error: headerCheck.error }, { status: 400 });
    }

    // 2. Rate limiting (Voter Verification: 10 requests per hour per IP)
    const rateLimit = await checkRateLimit(ip, "voter_verify", 10, 60 * 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "அதிகப்படியான முயற்சிகள். ஒரு மணி நேரம் கழித்து மீண்டும் முயற்சிக்கவும். (Too many verification attempts. Please try again in an hour.)",
        },
        { status: 429 }
      );
    }

    // 3. Sanitize input
    const rawBody = await request.json();
    const body = sanitizeInput(rawBody);
    
    const { voterId, isFallback, name, doorNo, dob, wardNo } = body;

    // --- STANDARD VOTER ID FLOW ---
    if (!isFallback) {
      if (!voterId) {
        return NextResponse.json(
          { error: "வாக்காளர் அடையாள எண் தேவை" },
          { status: 400 }
        );
      }

      const voter = await lookupVoter(voterId);

      if (!voter) {
        await logSecurityEvent(ip, "VOTER_VERIFICATION_FAILED", { voterId });
        return NextResponse.json({
          found: false,
          case: 4,
          message: "❌ உள்ளிடப்பட்ட விவரங்களுடன் எந்த வாக்காளர் பதிவும் கண்டறியப்படவில்லை.",
        });
      }

      await logSecurityEvent(ip, "VOTER_VERIFICATION_SUCCESS", { voterId, constituency: voter.Constituency });

      return NextResponse.json({
        found: true,
        message: "வாக்காளர் விவரங்கள் சரிபார்க்கப்பட்டன",
        voter,
        verificationMethod: "VOTER_ID",
      });
    }

    // --- FALLBACK DETAIL-MATCH VERIFICATION FLOW ---
    if (!name || !doorNo || !dob || !wardNo) {
      return NextResponse.json(
        { error: "பெயர், கதவு எண், பிறந்த தேதி மற்றும் வார்டு எண் அனைத்தும் தேவை." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const collection = db.collection("voterRegistry");

    // 1. Build DB query for DOB, Ward, and Door Number
    const query: any = {};

    // Match DOB (supporting UTC/local Date ranges)
    const d = new Date(dob);
    if (!isNaN(d.getTime())) {
      const utcStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
      const utcEnd = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
      
      const localStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const localEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

      query.$or = [
        { dob: { $gte: utcStart, $lte: utcEnd } },
        { dob: { $gte: localStart, $lte: localEnd } }
      ];
    } else {
      return NextResponse.json(
        { error: "முறையற்ற பிறந்த தேதி வடிவம்." },
        { status: 400 }
      );
    }

    // Match Ward No
    const wardNum = Number(wardNo);
    const wardMatches = [String(wardNo).trim()];
    if (!isNaN(wardNum)) {
      wardMatches.push(wardNum as any);
    }

    // Match Door No
    const cleanDoor = String(doorNo).trim();
    const doorRegex = new RegExp("^" + cleanDoor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i");

    query.$and = [
      { $or: [ { wardNo: { $in: wardMatches } }, { ward: { $in: wardMatches } } ] },
      { $or: [ { doorNo: cleanDoor }, { doorNo: { $regex: doorRegex } } ] }
    ];

    // Search the voter registry for matches on Ward, DOB, and Door No
    const matchingVoters = await collection.find(query).toArray();

    // Case 4: No household matches Ward + DOB + Door No at all
    if (matchingVoters.length === 0) {
      await logSecurityEvent(ip, "FALLBACK_VERIFICATION_FAILED_NO_HOUSEHOLD", { name, doorNo, dob, wardNo });
      return NextResponse.json({
        found: false,
        case: 4,
        message: "❌ உள்ளிடப்பட்ட விவரங்களுடன் எந்த வாக்காளர் பதிவும் கண்டறியப்படவில்லை.",
      });
    }

    // Evaluate name similarity among those living at this household
    const candidates = matchingVoters.map((doc) => {
      const similarity = getSimilarity(name, doc.name || "");
      const wardNumber = readWardNo(doc as Record<string, unknown>);
      return {
        voter: {
          VoterID: doc.voterId,
          VoterName: doc.name || "",
          DOB: formatVoterDob(doc.dob),
          WardNo: wardNumber,
          WardName: doc.wardName || "",
          Constituency: doc.constituency || "",
          Mobile: doc.mobile || "",
          Address: doc.address || "",
          DoorNo: doc.doorNo || "",
        },
        similarity,
      };
    });

    // Exact name matches
    const exactMatches = candidates.filter((c) => c.similarity === 1.0);
    // Similar name matches (similarity >= 75%)
    const similarMatches = candidates.filter((c) => c.similarity >= 0.75 && c.similarity < 1.0);

    // Case 5: Exactly one confident, single match (Exact Match)
    if (exactMatches.length === 1) {
      const verifiedVoter = exactMatches[0].voter;
      await logSecurityEvent(ip, "FALLBACK_VERIFICATION_SUCCESS_EXACT", { voterId: verifiedVoter.VoterID });
      return NextResponse.json({
        found: true,
        message: "வாக்காளர் விவரங்கள் சரிபார்க்கப்பட்டன",
        voter: verifiedVoter,
        verificationMethod: "DETAIL_MATCH",
      });
    }

    // Case 3: Multiple matching voters found (Multiple exact matches OR multiple similar matches)
    if (exactMatches.length > 1 || (exactMatches.length === 0 && similarMatches.length > 1)) {
      await logSecurityEvent(ip, "FALLBACK_VERIFICATION_MULTIPLE_FOUND", { name, doorNo, dob, wardNo });
      return NextResponse.json({
        found: false,
        case: 3,
        message: "ஒரே மாதிரியான பல பதிவுகள் கண்டறியப்பட்டுள்ளன. தயவுசெய்து வாக்காளர் அடையாள எண்ணைப் பயன்படுத்தவும்.",
      });
    }

    // Case 2: One similar, but not exact name match (similarity >= 75%)
    if (exactMatches.length === 0 && similarMatches.length === 1) {
      // If we are extremely confident (like space normalization only), can we treat it as success?
      // No, the prompt says:
      // Show: "பெயர் சரிபார்ப்பில் சிறிய வேறுபாடு கண்டறியப்பட்டுள்ளது. வாக்காளர் பட்டியலில் உள்ள பெயரை சரியாக உள்ளிட்டு மீண்டும் முயற்சிக்கவும்."
      await logSecurityEvent(ip, "FALLBACK_VERIFICATION_SIMILAR_NAME_WARNING", { name, doorNo, dob, wardNo });
      return NextResponse.json({
        found: false,
        case: 2,
        message: "பெயர் சரிபார்ப்பில் சிறிய வேறுபாடு கண்டறியப்பட்டுள்ளது. வாக்காளர் பட்டியலில் உள்ள பெயரை சரியாக உள்ளிட்டு மீண்டும் முயற்சிக்கவும்.",
      });
    }

    // Case 1: Door No + DOB + Ward match BUT name does not match (0 matches >= 75%)
    await logSecurityEvent(ip, "FALLBACK_VERIFICATION_NAME_MISMATCH", { name, doorNo, dob, wardNo });
    return NextResponse.json({
      found: false,
      case: 1,
      message: "⚠️ விவரங்கள் பகுதியளவில் பொருந்துகின்றன. தயவுசெய்து வாக்காளர் பட்டியலில் உள்ள பெயரை சரியாக உள்ளிடவும்.",
    });

  } catch (error) {
    console.error("Error in fallback voter verification API:", error);
    await logSecurityEvent(ip, "VOTER_VERIFICATION_ERROR", { error: String(error) });
    return NextResponse.json(
      { error: "உள் சேவையகப் பிழை" },
      { status: 500 }
    );
  }
}
