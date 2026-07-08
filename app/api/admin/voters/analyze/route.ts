import { getBackendT } from "@/lib/backendI18n";
import { NextResponse } from "next/server";
import { verifySuperAdminSession } from "@/lib/adminSession";
import { analyzeVoterFile } from "@/lib/voterImport";
import { ColumnMapping } from "@/lib/voterColumnMap";
import { getFieldLabel } from "@/lib/voterColumnMap";

export async function POST(request: Request) {
  const t = await getBackendT();
  try {
    const session = await verifySuperAdminSession();
    if (!session) {
      return NextResponse.json({ error: t("api.unauthorized_simple") }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const sheetName = String(formData.get("sheetName") || "").trim() || undefined;
    const mappingRaw = String(formData.get("mapping") || "").trim();

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: t("api.file_req") }, { status: 400 });
    }

    let overrideMapping: ColumnMapping | undefined;
    if (mappingRaw) {
      try {
        overrideMapping = JSON.parse(mappingRaw) as ColumnMapping;
      } catch {
        return NextResponse.json({ error: t("api.invalid_mapping") }, { status: 400 });
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
      { error: error instanceof Error ? error.message : t("api.file_parse_fail") },
      { status: 400 }
    );
  }
}
