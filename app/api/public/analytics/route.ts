import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getClientIp, validateRequestHeaders, checkRateLimit } from "@/lib/security";
import { CONSTITUENCIES, isConstituency } from "@/lib/constituencies";
import { categoryToSector, mapComplaintToPublicRecord } from "@/lib/analyticsDisplay";

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
    const baseMatchStage: Record<string, unknown> = { approvalStatus: { $ne: "REJECTED" } };
    const matchStage: Record<string, unknown> = { ...baseMatchStage };

    if (constituency && constituency !== "அனைத்தும்" && isConstituency(constituency)) {
      matchStage.constituency = constituency;
    }

    const db = await getDb();
    const collection = db.collection("citizenComplaints");

    const recordProjection = {
      _id: 0,
      trackingId: 1,
      constituency: 1,
      status: 1,
      createdAt: 1,
      complaintDetails: { category: 1, subcategory: 1 },
    };

    const [summaryAgg, constituencyAgg, categoryAgg, monthlyAgg, recentAgg, recordsAgg] =
      await Promise.all([
        collection
          .aggregate([
            { $match: matchStage },
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                resolved: {
                  $sum: { $cond: [{ $in: ["$status", ["ok", "resolved"]] }, 1, 0] },
                },
                inProgress: {
                  $sum: {
                    $cond: [
                      {
                        $in: [
                          "$status",
                          [
                            "warn",
                            "under_review",
                            "assigned",
                            "work_in_progress",
                            "solution_submitted",
                            "pending_rep_approval",
                            "pending_admin_approval",
                          ],
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
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
            { $match: baseMatchStage },
            {
              $group: {
                _id: "$constituency",
                total: { $sum: 1 },
                resolved: {
                  $sum: { $cond: [{ $in: ["$status", ["ok", "resolved"]] }, 1, 0] },
                },
                inProgress: {
                  $sum: {
                    $cond: [
                      {
                        $in: [
                          "$status",
                          [
                            "warn",
                            "under_review",
                            "assigned",
                            "work_in_progress",
                            "solution_submitted",
                            "pending_rep_approval",
                            "pending_admin_approval",
                          ],
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
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
                resolved: {
                  $sum: { $cond: [{ $in: ["$status", ["ok", "resolved"]] }, 1, 0] },
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
                _id: {
                  year: { $year: "$createdAt" },
                  month: { $month: "$createdAt" },
                },
                total: { $sum: 1 },
                resolved: {
                  $sum: { $cond: [{ $in: ["$status", ["ok", "resolved"]] }, 1, 0] },
                },
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
            { $limit: 8 },
            { $project: recordProjection },
          ])
          .toArray(),

        collection
          .aggregate([
            { $match: matchStage },
            { $sort: { createdAt: -1 } },
            { $limit: 500 },
            { $project: recordProjection },
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
      const found = constituencyAgg.find((item: { _id?: string }) => item._id === c);
      const cTotal = found?.total || 0;
      const cResolved = found?.resolved || 0;
      const cInProgress = found?.inProgress || 0;
      const cPending =
        found?.pending || Math.max(0, cTotal - cResolved - cInProgress);
      return {
        constituency: c,
        total: cTotal,
        resolved: cResolved,
        inProgress: cInProgress,
        pending: cPending,
        rate: cTotal ? Math.round((cResolved / cTotal) * 100) : 0,
      };
    });

    const categoryStats = categoryAgg.map(
      (item: { _id?: string; total?: number; resolved?: number }) => ({
        category: item._id || "பிற",
        total: item.total,
        resolved: item.resolved,
        sector: categoryToSector(item._id),
      })
    );

    const monthlyTrends = monthlyAgg.map((item) => {
      const row = item as { _id: { year: number; month: number }; total: number; resolved: number };
      return {
        year: row._id.year,
        month: row._id.month,
        total: row.total,
        resolved: row.resolved,
      };
    });

    const mapRecord = (item: {
      trackingId?: string;
      constituency?: string;
      status?: string | null;
      createdAt?: Date | string;
      complaintDetails?: { category?: string; subcategory?: string };
    }) => mapComplaintToPublicRecord(item);

    const records = recordsAgg.map(mapRecord);
    const recentActivity = recentAgg.map(mapRecord);

    return NextResponse.json({
      summary: { total, resolved, inProgress, pending, resolutionRate },
      constituencyStats,
      categoryStats,
      monthlyTrends,
      recentActivity,
      records,
      filteredConstituency:
        constituency && constituency !== "அனைத்தும்" && isConstituency(constituency)
          ? constituency
          : null,
    });
  } catch (error) {
    console.error("Public analytics error:", error);
    return NextResponse.json({ error: "பகுப்பாய்வு தரவைப் பெறுவதில் பிழை" }, { status: 500 });
  }
}
