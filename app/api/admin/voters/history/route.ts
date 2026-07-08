import { getBackendT } from "@/lib/backendI18n";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { verifySuperAdminSession } from "@/lib/adminSession";

export async function GET(request: Request) {
  const t = await getBackendT();
  try {
    const session = await verifySuperAdminSession();
    if (!session) {
      return NextResponse.json({ error: t("api.unauthorized_simple") }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    const db = await getDb();
    const history = await db
      .collection("importHistory")
      .find({})
      .sort({ importedAt: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json(
      history.map((h) => ({
        _id: h._id,
        fileName: h.fileName,
        totalRows: h.totalRows,
        imported: h.imported,
        updated: h.updated,
        skipped: h.skipped,
        importedBy: h.importedBy,
        importedAt: h.importedAt,
        sheetName: h.sheetName || "",
        skipReasons: h.skipReasons || {},
      }))
    );
  } catch (error) {
    console.error("Import history error:", error);
    return NextResponse.json({ error: t("api.server_error") }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const t = await getBackendT();
  try {
    const session = await verifySuperAdminSession();
    if (!session) {
      return NextResponse.json({ error: t("api.unauthorized_simple") }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const id = String(body.id || "").trim();
    if (!id) {
      return NextResponse.json({ error: t("api.import_id_req") }, { status: 400 });
    }

    let oid: ObjectId;
    try {
      oid = new ObjectId(id);
    } catch {
      return NextResponse.json({ error: t("api.invalid_import_id") }, { status: 400 });
    }

    const db = await getDb();
    const historyCol = db.collection("importHistory");
    const voterCol = db.collection("voterRegistry");

    const history = await historyCol.findOne({ _id: oid });
    if (!history) {
      return NextResponse.json({ error: t("api.import_not_found") }, { status: 404 });
    }

    const batchId = oid.toString();
    let voterResult = await voterCol.deleteMany({ importBatchId: batchId });

    if (voterResult.deletedCount === 0 && history.fileName) {
      voterResult = await voterCol.deleteMany({ sourceFile: history.fileName });
    }

    await historyCol.deleteOne({ _id: oid });

    return NextResponse.json({
      ok: true,
      deletedVoters: voterResult.deletedCount,
      fileName: history.fileName,
    });
  } catch (error) {
    console.error("Import history delete error:", error);
    return NextResponse.json({ error: t("api.server_error") }, { status: 500 });
  }
}
