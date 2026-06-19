import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();
    const complaints = await db
      .collection("citizenComplaints")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(complaints);
  } catch (error) {
    console.error("Error fetching complaints:", error);
    return NextResponse.json(
      { error: "புகார்களைப் பெறுவதில் பிழை ஏற்பட்டது" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const db = await getDb();
    const body = await request.json();

    const {
      voterId,
      voterVerified,
      ward,
      constituency,
      citizenDetails,
      complaintDetails,
      mediaUrls,
      geolocation,
    } = body;

    if (!voterVerified || !voterId) {
      return NextResponse.json(
        { error: "வாக்காளர் அடையாளம் சரிபார்க்கப்பட வேண்டும்" },
        { status: 400 }
      );
    }

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
      voterId,
      ward,
      constituency,
      citizenDetails,
      complaintDetails,
      mediaUrls,
      geolocation,
      createdAt: new Date(),
    };

    await db.collection("citizenComplaints").insertOne(newComplaint);

    return NextResponse.json({
      success: true,
      trackingId,
      message: "புகார் வெற்றிகரமாகப் பதிவு செய்யப்பட்டது",
    });
  } catch (error) {
    console.error("Error saving complaint:", error);
    return NextResponse.json(
      { error: "புகாரைப் பதிவு செய்வதில் பிழை ஏற்பட்டது" },
      { status: 500 }
    );
  }
}
