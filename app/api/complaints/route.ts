import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import {
  getClientIp,
  validateRequestHeaders,
  checkRateLimit,
  sanitizeInput,
  validateBase64File,
  checkDuplicateComplaint,
  logSecurityEvent,
} from "@/lib/security";

export async function GET(request: Request) {
  const ip = getClientIp(request);

  try {
    // 1. Validate request headers
    const headerCheck = validateRequestHeaders(request);
    if (!headerCheck.valid) {
      return NextResponse.json({ error: headerCheck.error }, { status: 400 });
    }

    // 2. Rate limiting (Analytics APIs: 60 requests per minute)
    const rateLimit = await checkRateLimit(ip, "analytics_api_get", 60, 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "அதிகப்படியான கோரிக்கைகள். ஒரு நிமிடம் கழித்து மீண்டும் முயற்சிக்கவும். (Too many requests. Please try again in a minute.)",
        },
        { status: 429 }
      );
    }

    const db = await getDb();
    const complaints = await db
      .collection("citizenComplaints")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(complaints);
  } catch (error) {
    console.error("Error fetching complaints:", error);
    await logSecurityEvent(ip, "ANALYTICS_API_ERROR", { error: String(error) });
    return NextResponse.json(
      { error: "புகார்களைப் பெறுவதில் பிழை ஏற்பட்டது" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request);

  try {
    // 1. Validate request headers
    const headerCheck = validateRequestHeaders(request);
    if (!headerCheck.valid) {
      return NextResponse.json({ error: headerCheck.error }, { status: 400 });
    }

    // 2. Rate limiting (Complaint Submission: 5 requests per hour per IP)
    const rateLimit = await checkRateLimit(ip, "complaint_submit", 5, 60 * 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: "அதிகப்படியான புகார்கள். ஒரு மணி நேரம் கழித்து மீண்டும் முயற்சிக்கவும். (Too many complaint submissions. Please try again in an hour.)",
        },
        { status: 429 }
      );
    }

    // 3. Sanitize and parse body
    const rawBody = await request.json();
    const body = sanitizeInput(rawBody);

    const {
      voterId,
      voterVerified,
      ward,
      constituency,
      citizenDetails,
      complaintDetails,
      mediaUrls,
      geolocation,
      email_honeypot,
      website_honeypot,
    } = body;

    // 4. Honeypot Validation for bot protection
    if (email_honeypot || website_honeypot) {
      await logSecurityEvent(ip, "BOT_SUBMISSION_BLOCKED", { email_honeypot, website_honeypot });
      return NextResponse.json(
        { error: "தானியங்கி சமர்ப்பிப்பு தடுக்கப்பட்டது (Automated submission blocked)" },
        { status: 400 }
      );
    }

    // 5. Schema and payload validation
    if (!voterVerified || !voterId) {
      return NextResponse.json(
        { error: "வாக்காளர் அடையாளம் சரிபார்க்கப்பட வேண்டும்" },
        { status: 400 }
      );
    }

    if (!complaintDetails?.description || complaintDetails.description.trim() === "") {
      return NextResponse.json(
        { error: "புகார் விளக்கம் தேவை (Complaint description is required)" },
        { status: 400 }
      );
    }

    // 6. Anti-Spam: Duplicate submission detection
    const dupCheck = await checkDuplicateComplaint(voterId, complaintDetails.description);
    if (dupCheck.isDuplicate) {
      return NextResponse.json(
        {
          error: `ஒரே மாதிரியான புகார் ஏற்கனவே சமர்ப்பிக்கப்பட்டுள்ளது. தயவுசெய்து ${dupCheck.cooldownRemaining} வினாடிகள் காத்திருக்கவும். (Duplicate complaint detected. Please wait.)`,
        },
        { status: 409 }
      );
    }

    // 7. File Upload Security & Rate Limiting (Max 10 uploads per hour per IP)
    const photosList = mediaUrls?.photos || [];
    const videoFile = mediaUrls?.video;
    const totalUploadsInPayload = photosList.length + (videoFile ? 1 : 0);

    if (totalUploadsInPayload > 0) {
      // Check file upload rate limit
      const uploadLimit = await checkRateLimit(ip, "file_upload", 10, 60 * 60 * 1000);
      if (!uploadLimit.success) {
        return NextResponse.json(
          {
            error: "அதிகப்படியான கோப்பு பதிவேற்றங்கள். ஒரு மணி நேரம் கழித்து மீண்டும் முயற்சிக்கவும். (Too many file uploads. Please try again in an hour.)",
          },
          { status: 429 }
        );
      }

      // Validate photos
      for (const photo of photosList) {
        const fileCheck = validateBase64File(photo);
        if (!fileCheck.valid) {
          return NextResponse.json({ error: fileCheck.error }, { status: 400 });
        }
      }

      // Validate video
      if (videoFile) {
        const fileCheck = validateBase64File(videoFile);
        if (!fileCheck.valid) {
          return NextResponse.json({ error: fileCheck.error }, { status: 400 });
        }
      }
    }

    const db = await getDb();

    // Generate sequential tracking ID: ETT-YYYY-XXXXX
    const currentYear = new Date().getFullYear(); // 2026
    const prefix = `ETT-${currentYear}-`;

    // Find the latest complaint for this year to increment the sequence
    const latestComplaint = await db
      .collection("citizenComplaints")
      .findOne(
        { trackingId: { $regex: `^${prefix}` } },
        { sort: { trackingId: -1 } }
      );

    let nextNum = 1;
    if (latestComplaint && latestComplaint.trackingId) {
      const lastPart = latestComplaint.trackingId.split("-")[2];
      const parsedNum = parseInt(lastPart, 10);
      if (!isNaN(parsedNum)) {
        nextNum = parsedNum + 1;
      }
    }

    const trackingId = `${prefix}${String(nextNum).padStart(5, "0")}`;

    const newComplaint = {
      trackingId,
      voterVerified,
      voterId: String(voterId).trim().toUpperCase(),
      ward: sanitizeInput(ward),
      constituency: sanitizeInput(constituency),
      citizenDetails: sanitizeInput(citizenDetails),
      complaintDetails: sanitizeInput(complaintDetails),
      mediaUrls: sanitizeInput(mediaUrls),
      geolocation: sanitizeInput(geolocation),
      createdAt: new Date(),
    };

    await db.collection("citizenComplaints").insertOne(newComplaint);

    await logSecurityEvent(ip, "COMPLAINT_SUBMISSION_SUCCESS", { trackingId, voterId });

    return NextResponse.json({
      success: true,
      trackingId,
      message: "புகார் வெற்றிகரமாகப் பதிவு செய்யப்பட்டது",
    });
  } catch (error) {
    console.error("Error saving complaint:", error);
    await logSecurityEvent(ip, "COMPLAINT_SUBMISSION_ERROR", { error: String(error) });
    return NextResponse.json(
      { error: "புகாரைப் பதிவு செய்வதில் பிழை ஏற்பட்டது" },
      { status: 500 }
    );
  }
}
