import { getBackendT } from "@/lib/backendI18n";
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
  const t = await getBackendT();
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
          error: t("api.rate_limit_verify"),
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
          { error: t("api.voter_id_needed") },
          { status: 400 }
        );
      }

      const voter = await lookupVoter(voterId);

      if (!voter) {
        await logSecurityEvent(ip, "VOTER_VERIFICATION_FAILED", { voterId });
        return NextResponse.json({
          found: false,
          case: 4,
          message: t("api.voter_not_found"),
        });
      }

      await logSecurityEvent(ip, "VOTER_VERIFICATION_SUCCESS", { voterId, constituency: voter.Constituency });

      return NextResponse.json({
        found: true,
        message: t("api.voter_verified"),
        voter,
        verificationMethod: "VOTER_ID",
      });
    }

    // --- FALLBACK DETAIL-MATCH VERIFICATION FLOW ---
    const cleanName = String(name || "").trim();
    const cleanDoor = String(doorNo || "").trim();

    if (!cleanName || !cleanDoor) {
      return NextResponse.json(
        { error: t("api.name_door_req") },
        { status: 400 }
      );
    }

    const db = await getDb();
    const collection = db.collection("voterRegistry");

    // 1. Build DB query
    const andClauses: any[] = [];

    // Match Door No (Required)
    const doorRegex = new RegExp("^" + cleanDoor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i");
    andClauses.push({
      $or: [ { doorNo: cleanDoor }, { doorNo: { $regex: doorRegex } } ]
    });

    // Match DOB (Optional)
    if (dob) {
      const d = new Date(dob);
      if (!isNaN(d.getTime())) {
        const utcStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
        const utcEnd = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
        
        const localStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const localEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

        andClauses.push({
          $or: [
            { dob: { $gte: utcStart, $lte: utcEnd } },
            { dob: { $gte: localStart, $lte: localEnd } }
          ]
        });
      } else {
        return NextResponse.json(
          { error: t("api.invalid_dob") },
          { status: 400 }
        );
      }
    }

    // Match Ward No (Optional)
    if (wardNo) {
      const wardNum = Number(wardNo);
      const wardMatches = [String(wardNo).trim()];
      if (!isNaN(wardNum)) {
        wardMatches.push(wardNum as any);
      }
      andClauses.push({
        $or: [ { wardNo: { $in: wardMatches } }, { ward: { $in: wardMatches } } ]
      });
    }

    const query = { $and: andClauses };

    // Search the voter registry
    const matchingVoters = await collection.find(query).toArray();

    // Case 1: No household matches found in DB at all
    if (matchingVoters.length === 0) {
      await logSecurityEvent(ip, "FALLBACK_VERIFICATION_FAILED_NO_HOUSEHOLD", { name: cleanName, doorNo: cleanDoor, dob, wardNo });
      return NextResponse.json({
        found: false,
        case: 1,
        message: "No matching voter record found.",
      });
    }

    // Evaluate name similarity among those living at this household
    const candidates = matchingVoters.map((doc) => {
      const similarity = getSimilarity(cleanName, doc.name || "");
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
          Panchayat: doc.panchayat || "",
          Taluk: doc.taluk || "",
          District: doc.district || "",
          Gender: doc.gender || "",
          Age: doc.age || "",
        },
        similarity,
      };
    });

    // Exact name matches
    const exactMatches = candidates.filter((c) => c.similarity === 1.0);
    // Similar name matches (similarity >= 75% and < 1.0)
    const similarMatches = candidates.filter((c) => c.similarity >= 0.75 && c.similarity < 1.0);

    let verifiedVoter = null;

    if (exactMatches.length === 1) {
      // Exactly one exact name match
      verifiedVoter = exactMatches[0].voter;
    } else if (exactMatches.length === 0 && similarMatches.length === 1) {
      // Exactly one similar name match (no exact matches)
      verifiedVoter = similarMatches[0].voter;
    } else if (exactMatches.length > 1 || (exactMatches.length === 0 && similarMatches.length > 1)) {
      // Case 2: Multiple matching voters found (Multiple exact matches OR multiple similar matches)
      await logSecurityEvent(ip, "FALLBACK_VERIFICATION_MULTIPLE_FOUND", { name: cleanName, doorNo: cleanDoor, dob, wardNo });
      return NextResponse.json({
        found: false,
        case: 2,
        message: "Multiple records found. Please provide additional details such as DOB or Ward Number.",
      });
    }

    if (verifiedVoter) {
      // Case 3: Single record found
      await logSecurityEvent(ip, "FALLBACK_VERIFICATION_SUCCESS", { voterId: verifiedVoter.VoterID });
      return NextResponse.json({
        found: true,
        message: t("api.voter_verified"),
        voter: verifiedVoter,
        verificationMethod: "DETAIL_MATCH",
      });
    }

    // Case 1: No match found (0 candidates >= 75%)
    await logSecurityEvent(ip, "FALLBACK_VERIFICATION_FAILED_NO_MATCH", { name: cleanName, doorNo: cleanDoor, dob, wardNo });
    return NextResponse.json({
      found: false,
      case: 1,
      message: "No matching voter record found.",
    });

  } catch (error) {
    console.error("Error in fallback voter verification API:", error);
    await logSecurityEvent(ip, "VOTER_VERIFICATION_ERROR", { error: String(error) });
    return NextResponse.json(
      { error: t("api.internal_server_error_simple") },
      { status: 500 }
    );
  }
}
