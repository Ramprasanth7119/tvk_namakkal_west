import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getClientIp, validateRequestHeaders, checkRateLimit } from "@/lib/security";
import { CONSTITUENCIES, isConstituency } from "@/lib/constituencies";
import { normalizeStatus } from "@/lib/complaintStatus";

function categoryToSector(category?: string): string {
  if (category === "மின்சாரம்") return "power";
  if (category === "சாலை" || category === "போக்குவரத்து") return "road";
  if (category === "குடிநீர்") return "water";
  if (category === "கழிவுநீர்" || category === "சுகாதாரம்") return "drain";
  if (category === "தெருவிளக்கு") return "light";
  if (category === "கல்வி") return "edu";
  if (category === "மருத்துவம்" || category === "சுற்றுச்சூழல்") return "health";
  return "civic";
}

export async function GET(request: Request) {
  const ip = getClientIp(request);

  try {
    const headerCheck = validateRequestHeaders(request);
    if (!headerCheck.valid) {
      return NextResponse.json({ error: headerCheck.error }, { status: 400 });
    }

    const rateLimit = await checkRateLimit(ip, "public_analytics", 60, 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "அதிகப்படியான கோரிக்கைகள்" }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const constituency = searchParams.get("constituency");
    const matchStage: Record<string, unknown> = { approvalStatus: { $ne: "REJECTED" } };

    if (constituency && constituency !== "அனைத்தும்" && isConstituency(constituency)) {
      matchStage.constituency = constituency;
    }

    const db = await getDb();
    const collection = db.collection("citizenComplaints");

    const [summaryAgg, constituencyAgg, categoryAgg, monthlyAgg, recentAgg] = await Promise.all([
      collection
        .aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              resolved: { $sum: { $cond: [{ $in: ["$status", ["ok", "resolved"]] }, 1, 0] } },
              inProgress: { $sum: { $cond: [{ $in: ["$status", ["warn", "under_review", "assigned", "work_in_progress", "solution_submitted", "pending_rep_approval", "pending_admin_approval"]] }, 1, 0] } },
              pending: {
                $sum: {
                  $cond: [
                    {
                      $or: [
                        { $eq: ["$status", "pend"] },
                        { $eq: ["$status", "registered"] },
                        { $eq: [{ $ifNull: ["$status", "registered"] }, "registered"] },
                        { $eq: ["$status", null] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: "$constituency",
              total: { $sum: 1 },
              resolved: { $sum: { $cond: [{ $in: ["$status", ["ok", "resolved"]] }, 1, 0] } },
              pending: {
                $sum: { $cond: [{ $not: [{ $in: ["$status", ["ok", "resolved"]] }] }, 1, 0] },
              },
            },
          },
          { $sort: { total: -1 } },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: "$complaintDetails.category",
              total: { $sum: 1 },
              resolved: { $sum: { $cond: [{ $in: ["$status", ["ok", "resolved"]] }, 1, 0] } },
            },
          },
          { $sort: { total: -1 } },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: {
                year: { $year: "$createdAt" },
                month: { $month: "$createdAt" },
              },
              total: { $sum: 1 },
              resolved: { $sum: { $cond: [{ $in: ["$status", ["ok", "resolved"]] }, 1, 0] } },
            },
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } },
          { $limit: 12 },
        ])
        .toArray(),

      collection
        .aggregate([
          { $match: matchStage },
          { $sort: { createdAt: -1 } },
          { $limit: 10 },
          {
            $project: {
              _id: 0,
              trackingId: 1,
              constituency: 1,
              status: 1,
              createdAt: 1,
              category: "$complaintDetails.category",
              subcategory: "$complaintDetails.subcategory",
              description: "$complaintDetails.description",
            },
          },
        ])
        .toArray(),
    ]);

    const summary = summaryAgg[0] || { total: 0, resolved: 0, inProgress: 0, pending: 0 };
    const total = summary.total || 0;
    const resolved = summary.resolved || 0;
    const inProgress = summary.inProgress || 0;
    const pending = summary.pending || Math.max(0, total - resolved - inProgress);
    const resolutionRate = total ? Math.round((resolved / total) * 100) : 0;

    const constituencyStats = CONSTITUENCIES.map((c) => {
      const found = constituencyAgg.find((item: any) => item._id === c);
      const cTotal = found?.total || 0;
      const cResolved = found?.resolved || 0;
      return {
        constituency: c,
        total: cTotal,
        resolved: cResolved,
        pending: found?.pending || Math.max(0, cTotal - cResolved),
        rate: cTotal ? Math.round((cResolved / cTotal) * 100) : 0,
      };
    });

    const categoryStats = categoryAgg.map((item: any) => ({
      category: item._id || "பிற",
      total: item.total,
      resolved: item.resolved,
      sector: categoryToSector(item._id),
    }));

    const monthlyTrends = monthlyAgg.map((item: any) => ({
      year: item._id.year,
      month: item._id.month,
      total: item.total,
      resolved: item.resolved,
    }));

    const recentActivity = recentAgg.map((item: any) => {
      const createdDate = new Date(item.createdAt || Date.now());
      const status = normalizeStatus(item.status);
      return {
        id: item.trackingId,
        sector: categoryToSector(item.category),
        area: item.constituency,
        title: `${item.subcategory || item.category || "புகார்"} — ${(item.description || "").slice(0, 80)}`,
        by: item.constituency,
        month: createdDate.getMonth() % 6,
        date: createdDate.toLocaleDateString("ta-IN"),
        status,
        resolver: status === "ok" ? "தமிழக வெற்றிக் கழகம்" : null,
      };
    });

    return NextResponse.json({
      summary: { total, resolved, inProgress, pending, resolutionRate },
      constituencyStats,
      categoryStats,
      monthlyTrends,
      recentActivity,
    });
  } catch (error) {
    console.error("Public analytics error:", error);
    return NextResponse.json({ error: "பகுப்பாய்வு தரவைப் பெறுவதில் பிழை" }, { status: 500 });
  }
}
