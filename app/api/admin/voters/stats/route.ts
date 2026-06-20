import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { verifySuperAdminSession } from "@/lib/adminSession";

export async function GET() {
  try {
    const session = await verifySuperAdminSession();
    if (!session) {
      return NextResponse.json({ error: "அங்கீகரிக்கப்படாத அணுகல்" }, { status: 401 });
    }

    const db = await getDb();
    const collection = db.collection("voterRegistry");

    const [totalVoters, constituencyAgg, lastImport] = await Promise.all([
      collection.countDocuments(),
      collection
        .aggregate([{ $group: { _id: "$constituency", count: { $sum: 1 } } }, { $sort: { count: -1 } }])
        .toArray(),
      db
        .collection("importHistory")
        .find({})
        .sort({ importedAt: -1 })
        .limit(1)
        .toArray(),
    ]);

    return NextResponse.json({
      totalVoters,
      byConstituency: constituencyAgg.map((c) => ({
        constituency: String((c as { _id?: string })._id || "—"),
        count: Number((c as { count?: number }).count || 0),
      })),
      lastImport: lastImport[0]
        ? {
            fileName: lastImport[0].fileName,
            importedAt: lastImport[0].importedAt,
            imported: lastImport[0].imported,
            updated: lastImport[0].updated,
            skipped: lastImport[0].skipped,
          }
        : null,
    });
  } catch (error) {
    console.error("Voter stats error:", error);
    return NextResponse.json({ error: "சேவையக பிழை" }, { status: 500 });
  }
}
