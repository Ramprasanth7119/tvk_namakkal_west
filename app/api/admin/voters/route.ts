import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { verifySuperAdminSession } from "@/lib/adminSession";
import { readWardNo, formatVoterDob } from "@/lib/voterRegistry";

export async function GET(request: Request) {
  try {
    const session = await verifySuperAdminSession();
    if (!session) {
      return NextResponse.json({ error: "அங்கீகரிக்கப்படாத அணுகல்" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const search = (searchParams.get("search") || "").trim();
    const constituency = (searchParams.get("constituency") || "").trim();
    const ward = (searchParams.get("ward") || "").trim();

    const filter: Record<string, unknown> = {};

    if (constituency && constituency !== "அனைத்தும்") {
      filter.constituency = constituency;
    }

    if (ward) {
      const wardNum = Number(ward);
      filter.wardNo = Number.isFinite(wardNum) ? wardNum : ward;
    }

    if (search) {
      const regex = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
      filter.$or = [
        { voterId: search.toUpperCase() },
        { name: regex },
        { mobile: regex },
        { constituency: regex },
        { doorNo: regex },
      ];
    }

    const db = await getDb();
    const collection = db.collection("voterRegistry");

    const [total, docs] = await Promise.all([
      collection.countDocuments(filter),
      collection
        .find(filter)
        .sort({ updatedAt: -1, voterId: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
    ]);

    const voters = docs.map((doc) => ({
      voterId: doc.voterId,
      name: doc.name || "",
      dob: formatVoterDob(doc.dob),
      doorNo: doc.doorNo || "",
      mobile: doc.mobile || "",
      gender: doc.gender || "",
      age: doc.age != null ? String(doc.age) : "",
      address: doc.address || "",
      constituency: doc.constituency || "",
      wardNo: readWardNo(doc as Record<string, unknown>),
      wardName: doc.wardName || "",
      panchayat: doc.panchayat || "",
      taluk: doc.taluk || "",
      district: doc.district || "",
      sourceFile: doc.sourceFile || "",
      importedAt: doc.importedAt || doc.createdAt || null,
      updatedAt: doc.updatedAt || null,
    }));

    return NextResponse.json({
      voters,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error("Voter list error:", error);
    return NextResponse.json({ error: "சேவையக பிழை" }, { status: 500 });
  }
}
