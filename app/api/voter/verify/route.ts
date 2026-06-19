import { NextResponse } from "next/server";
import { lookupVoter } from "@/lib/voterLookup";
import {
  getClientIp,
  validateRequestHeaders,
  checkRateLimit,
  sanitizeInput,
  logSecurityEvent,
} from "@/lib/security";

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
    const { voterId } = body;

    if (!voterId) {
      return NextResponse.json(
        { error: "வாக்காளர் அடையாள எண் தேவை" },
        { status: 400 }
      );
    }

    // Safe query construction: lookupVoter trims and converts to uppercase
    const voter = await lookupVoter(voterId);

    if (!voter) {
      await logSecurityEvent(ip, "VOTER_VERIFICATION_FAILED", { voterId });
      return NextResponse.json({
        found: false,
        message: "வாக்காளர் அடையாளம் கண்டறியப்படவில்லை",
      });
    }

    await logSecurityEvent(ip, "VOTER_VERIFICATION_SUCCESS", { voterId, constituency: voter.AssemblyConstituency });

    return NextResponse.json({
      found: true,
      message: "வாக்காளர் அடையாளம் சரிபார்க்கப்பட்டது",
      voter,
    });
  } catch (error) {
    console.error("Error in voter verification API:", error);
    await logSecurityEvent(ip, "VOTER_VERIFICATION_ERROR", { error: String(error) });
    return NextResponse.json(
      { error: "உள் சேவையகப் பிழை" },
      { status: 500 }
    );
  }
}
