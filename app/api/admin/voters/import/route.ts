import { getBackendT } from "@/lib/backendI18n";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { verifySuperAdminSession } from "@/lib/adminSession";
import { importVoterFile } from "@/lib/voterImport";
import { ColumnMapping } from "@/lib/voterColumnMap";

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

    let mapping: ColumnMapping | undefined;
    if (mappingRaw) {
      try {
        mapping = JSON.parse(mappingRaw) as ColumnMapping;
      } catch {
        return NextResponse.json({ error: t("api.invalid_mapping") }, { status: 400 });
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
      { error: error instanceof Error ? error.message : t("api.import_fail") },
      { status: 400 }
    );
  }
}
