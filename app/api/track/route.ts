import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getClientIp, validateRequestHeaders, checkRateLimit } from "@/lib/security";
import { getStatusLabel, normalizeStatus } from "@/lib/complaintStatus";

export async function GET(request: Request) {
  const ip = getClientIp(request);

  try {
    const headerCheck = validateRequestHeaders(request);
    if (!headerCheck.valid) {
      return NextResponse.json({ error: headerCheck.error }, { status: 400 });
    }

    const rateLimit = await checkRateLimit(ip, "public_track", 30, 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "அதிகப்படியான கோரிக்கைகள்" }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const trackingId = (searchParams.get("trackingId") || "").trim().toUpperCase();

    if (!trackingId) {
      return NextResponse.json({ error: "கண்காணிப்பு எண் தேவை (Tracking ID required)" }, { status: 400 });
    }

    if (!/^ETT-\d{4}-\d{5}$/.test(trackingId)) {
      return NextResponse.json({ error: "தவறான கண்காணிப்பு எண் வடிவம் (Invalid tracking ID format)" }, { status: 400 });
    }

    const db = await getDb();
    const complaint = await db.collection("citizenComplaints").findOne(
      { trackingId },
      {
        projection: {
          trackingId: 1,
          constituency: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          timeline: 1,
          "complaintDetails.category": 1,
          "complaintDetails.subcategory": 1,
        },
      }
    );

    if (!complaint) {
      return NextResponse.json({ error: "மனு கண்டறியப்படவில்லை (Complaint not found)" }, { status: 404 });
    }

    const status = normalizeStatus(complaint.status);
    const timeline = Array.isArray(complaint.timeline) && complaint.timeline.length > 0
      ? complaint.timeline.map((entry: any) => ({
          status: normalizeStatus(entry.status),
          label: getStatusLabel(entry.status),
          updatedAt: entry.updatedAt,
        }))
      : [{ status: "pend", label: getStatusLabel("pend"), updatedAt: complaint.createdAt }];

    return NextResponse.json({
      trackingId: complaint.trackingId,
      category: complaint.complaintDetails?.category || "பிற",
      subcategory: complaint.complaintDetails?.subcategory || "",
      constituency: complaint.constituency,
      status,
      statusLabel: getStatusLabel(status),
      createdAt: complaint.createdAt,
      updatedAt: complaint.updatedAt || complaint.createdAt,
      timeline,
    });
  } catch (error) {
    console.error("Track API error:", error);
    return NextResponse.json({ error: "மனு நிலையைப் பெறுவதில் பிழை" }, { status: 500 });
  }
}
