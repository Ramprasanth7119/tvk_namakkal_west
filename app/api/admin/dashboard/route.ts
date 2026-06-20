import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/mongodb";
import { verifySession } from "@/lib/session";
import { getClientIp } from "@/lib/security";
import { CONSTITUENCIES } from "@/lib/constituencies";

// Helper function to verify super admin session
async function verifySuperAdminSession() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("site_auth");
  if (!authCookie) return null;

  const session = verifySession(authCookie.value);
  if (!session || session.role !== "SUPER_ADMIN") return null;

  return session;
}

export async function GET(request: Request) {
  const ip = getClientIp(request);
  try {
    const session = await verifySuperAdminSession();
    if (!session) {
      return NextResponse.json({ error: "அங்கீகரிக்கப்படாத அணுகல் (Unauthorized access)" }, { status: 401 });
    }

    const db = await getDb();

    // 1. Calculate General Stats (valid constituencies only)
    const repFilter = { role: "REPRESENTATIVE", constituency: { $in: [...CONSTITUENCIES] } };
    const totalReps = await db.collection("users").countDocuments(repFilter);
    const activeReps = await db.collection("users").countDocuments({ ...repFilter, active: true });
    const totalComplaints = await db.collection("citizenComplaints").countDocuments();
    const resolvedComplaints = await db.collection("citizenComplaints").countDocuments({ status: { $in: ["ok", "resolved"] } });
    const pendingComplaints = totalComplaints - resolvedComplaints; // Includes "pend", "warn", or undefined

    // 2. Calculate Stats per Constituency
    const constituencyOverview = [];
    
    // Fetch all active representatives in one query to optimize
    const activeRepresentativesList = await db
      .collection("users")
      .find({ role: "REPRESENTATIVE", active: true, constituency: { $in: [...CONSTITUENCIES] } })
      .toArray();

    // Map by constituency for quick lookup
    const repMap: Record<string, string> = {};
    activeRepresentativesList.forEach((r: any) => {
      repMap[r.constituency] = r.name ? `${r.name} (@${r.username})` : r.username;
    });

    for (const c of CONSTITUENCIES) {
      const cTotal = await db.collection("citizenComplaints").countDocuments({ constituency: c });
      const cResolved = await db.collection("citizenComplaints").countDocuments({ constituency: c, status: { $in: ["ok", "resolved"] } });
      const cPending = cTotal - cResolved;
      const repName = repMap[c] || "பிரதிநிதி நியமிக்கப்படவில்லை (No Representative)";

      constituencyOverview.push({
        constituency: c,
        total: cTotal,
        pending: cPending,
        resolved: cResolved,
        representative: repName,
      });
    }

    return NextResponse.json({
      stats: {
        totalReps,
        activeReps,
        totalComplaints,
        pendingComplaints,
        resolvedComplaints,
      },
      constituencyOverview,
    });
  } catch (error) {
    console.error("Error fetching admin dashboard data:", error);
    return NextResponse.json({ error: "சேவையக பிழை" }, { status: 500 });
  }
}
