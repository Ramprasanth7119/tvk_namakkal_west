import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getClientIp, validateRequestHeaders, checkRateLimit } from "@/lib/security";

export async function GET(request: Request) {
  const ip = getClientIp(request);

  try {
    const headerCheck = validateRequestHeaders(request);
    if (!headerCheck.valid) {
      return NextResponse.json({ error: headerCheck.error }, { status: 400 });
    }

    const rateLimit = await checkRateLimit(ip, "public_resolved", 60, 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "அதிகப்படியான கோரிக்கைகள்" }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "12", 10), 24);

    const db = await getDb();
    const resolved = await db
      .collection("citizenComplaints")
      .aggregate([
        { $match: { status: "ok", approvalStatus: { $ne: "REJECTED" } } },
        { $sort: { updatedAt: -1, createdAt: -1 } },
        { $limit: limit },
        {
          $project: {
            _id: 0,
            trackingId: 1,
            constituency: 1,
            updatedAt: 1,
            createdAt: 1,
            category: "$complaintDetails.category",
            subcategory: "$complaintDetails.subcategory",
            summary: "$complaintDetails.description",
            photoUrls: 1,
            videoUrls: 1,
            "mediaUrls.photos": 1,
          },
        },
      ])
      .toArray();

    const sanitized = resolved.map((item: any) => {
      const photos = item.photoUrls?.length
        ? item.photoUrls
        : item.mediaUrls?.photos?.filter((p: string) => p.startsWith("http")) || [];

      return {
        trackingId: item.trackingId,
        category: item.category || "பிற",
        subcategory: item.subcategory || "",
        constituency: item.constituency,
        resolutionDate: item.updatedAt || item.createdAt,
        summary: (item.summary || "").slice(0, 160),
        beforeImage: photos[0] || null,
        afterImage: photos[1] || photos[0] || null,
      };
    });

    return NextResponse.json(sanitized);
  } catch (error) {
    console.error("Resolved showcase error:", error);
    return NextResponse.json({ error: "தீர்க்கப்பட்ட புகார்களைப் பெறுவதில் பிழை" }, { status: 500 });
  }
}
