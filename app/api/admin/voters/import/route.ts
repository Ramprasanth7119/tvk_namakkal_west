import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { verifySuperAdminSession } from "@/lib/adminSession";
import { importVoterFile } from "@/lib/voterImport";
import { ColumnMapping } from "@/lib/voterColumnMap";

export async function POST(request: Request) {
  try {
    const session = await verifySuperAdminSession();
    if (!session) {
      return NextResponse.json({ error: "அங்கீகரிக்கப்படாத அணுகல்" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const sheetName = String(formData.get("sheetName") || "").trim() || undefined;
    const mappingRaw = String(formData.get("mapping") || "").trim();

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "கோப்பு தேவை" }, { status: 400 });
    }

    let mapping: ColumnMapping | undefined;
    if (mappingRaw) {
      try {
        mapping = JSON.parse(mappingRaw) as ColumnMapping;
      } catch {
        return NextResponse.json({ error: "தவறான mapping JSON" }, { status: 400 });
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const db = await getDb();
    const summary = await importVoterFile(db, buffer, file.name, session.username, {
      sheetName,
      mapping,
    });

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error("Voter import error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import தோல்வி" },
      { status: 400 }
    );
  }
}
