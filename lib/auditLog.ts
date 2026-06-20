import { getDb } from "./mongodb";

export interface AuditLogEntry {
  username: string;
  role: string;
  constituency: string | null;
  action: string;
  trackingId?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export async function logAuditEvent(params: {
  username: string;
  role: string;
  constituency?: string | null;
  action: string;
  trackingId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const db = await getDb();
    await db.collection("auditLogs").insertOne({
      username: params.username,
      role: params.role,
      constituency: params.constituency ?? null,
      action: params.action,
      trackingId: params.trackingId || null,
      timestamp: new Date(),
      metadata: params.metadata || {},
    });
  } catch (err) {
    console.error("Audit log error:", err);
  }
}
