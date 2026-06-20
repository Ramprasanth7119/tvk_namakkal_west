import { NextResponse } from "next/server";
import { verifySuperAdminSession } from "@/lib/adminSession";
import { analyzeVoterFile } from "@/lib/voterImport";
import { ColumnMapping } from "@/lib/voterColumnMap";
import { getFieldLabel } from "@/lib/voterColumnMap";

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

    let overrideMapping: ColumnMapping | undefined;
    if (mappingRaw) {
      try {
        overrideMapping = JSON.parse(mappingRaw) as ColumnMapping;
      } catch {
        return NextResponse.json({ error: "தவறான mapping JSON" }, { status: 400 });
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = analyzeVoterFile(buffer, file.name, sheetName, overrideMapping);

    return NextResponse.json({
      ...result,
      mappingDisplay: result.mappingDisplay.map((m) => ({
        ...m,
        label: getFieldLabel(m.field),
      })),
      canImport: result.missingRequired.length === 0,
    });
  } catch (error) {
    console.error("Voter analyze error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "கோப்பு பகுப்பாய்வு தோல்வி" },
      { status: 400 }
    );
  }
}
