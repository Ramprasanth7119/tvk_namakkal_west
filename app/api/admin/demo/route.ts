import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { verifySession } from "@/lib/session";

async function verifyAdminOrRepSession() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("site_auth");
  if (!authCookie) return null;
  const session = verifySession(authCookie.value);
  if (!session) return null;
  if (session.role !== "SUPER_ADMIN" && session.role !== "REPRESENTATIVE") return null;
  return session;
}

export async function GET(request: Request) {
  try {
    const session = await verifyAdminOrRepSession();
    if (!session) {
      return NextResponse.json({ error: "அங்கீகரிக்கப்படாத அணுகல்" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const constituency = searchParams.get("constituency");

    const db = await getDb();
    const filter: Record<string, unknown> = {};

    if (session.role === "REPRESENTATIVE" && session.constituency) {
      filter.constituency = session.constituency;
    } else if (constituency) {
      filter.constituency = constituency;
    }

    const entries = await db
      .collection("demoComplaints")
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(entries.map((e) => ({ ...e, _id: e._id.toString() })));
  } catch (err) {
    console.error("Demo GET error:", err);
    return NextResponse.json({ error: "சேவையகப் பிழை" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await verifyAdminOrRepSession();
    if (!session) {
      return NextResponse.json({ error: "அங்கீகரிக்கப்படாத அணுகல்" }, { status: 401 });
    }

    const body = await request.json();
    const { constituency, sector, title, by: byField, date, month, status, resolver } = body;

    if (!constituency || !sector || !title) {
      return NextResponse.json({ error: "தொகுதி, துறை மற்றும் தலைப்பு தேவை" }, { status: 400 });
    }

    // REP can only add for their own constituency
    if (session.role === "REPRESENTATIVE" && session.constituency && session.constituency !== constituency) {
      return NextResponse.json({ error: "உங்கள் தொகுதிக்கு மட்டுமே சேர்க்க முடியும்" }, { status: 403 });
    }

    const db = await getDb();
    const now = new Date();

    const doc = {
      constituency,
      sector,
      title,
      by: byField || "பொது",
      date: date || `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getFullYear()).slice(-2)}`,
      month: typeof month === "number" ? month : now.getMonth() % 6,
      status: status || "pend",
      resolver: resolver || null,
      createdBy: session.username || "admin",
      createdAt: now,
    };

    const result = await db.collection("demoComplaints").insertOne(doc);
    return NextResponse.json({ success: true, id: result.insertedId.toString() });
  } catch (err) {
    console.error("Demo POST error:", err);
    return NextResponse.json({ error: "சேவையகப் பிழை" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await verifyAdminOrRepSession();
    if (!session) {
      return NextResponse.json({ error: "அங்கீகரிக்கப்படாத அணுகல்" }, { status: 401 });
    }

    const body = await request.json();
    const { id, constituency } = body;

    if (!id) {
      return NextResponse.json({ error: "ஐடி தேவை" }, { status: 400 });
    }

    const db = await getDb();
    const filter: Record<string, unknown> = { _id: new ObjectId(id) };

    // REPRESENTATIVE can only delete their own constituency's entries
    if (session.role === "REPRESENTATIVE" && session.constituency) {
      filter.constituency = session.constituency;
    } else if (constituency) {
      filter.constituency = constituency;
    }

    const result = await db.collection("demoComplaints").deleteOne(filter);
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "பதிவு காணப்படவில்லை அல்லது அனுமதி மறுக்கப்பட்டது" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Demo DELETE error:", err);
    return NextResponse.json({ error: "சேவையகப் பிழை" }, { status: 500 });
  }
}
