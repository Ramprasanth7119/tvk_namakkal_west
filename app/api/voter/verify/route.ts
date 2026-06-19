import { NextResponse } from "next/server";
import { lookupVoter } from "@/lib/voterLookup";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { voterId } = body;

    if (!voterId) {
      return NextResponse.json(
        { error: "வாக்காளர் அடையாள எண் தேவை" },
        { status: 400 }
      );
    }

    const voter = await lookupVoter(voterId);

    if (!voter) {
      return NextResponse.json(
        { found: false, message: "வாக்காளர் அடையாளம் கண்டறியப்படவில்லை" },
        { status: 200 }
      );
    }

    return NextResponse.json({
      found: true,
      message: "வாக்காளர் அடையாளம் சரிபார்க்கப்பட்டது",
      voter,
    });
  } catch (error) {
    console.error("Error in voter verification API:", error);
    return NextResponse.json(
      { error: "உள் சேவையகப் பிழை" },
      { status: 500 }
    );
  }
}
