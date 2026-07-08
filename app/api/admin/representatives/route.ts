import { getBackendT } from "@/lib/backendI18n";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/mongodb";
import { verifySession, hashPassword } from "@/lib/session";
import { logAuditEvent } from "@/lib/auditLog";
import { getClientIp, logSecurityEvent, sanitizeInput } from "@/lib/security";
import { CONSTITUENCIES, isConstituency } from "@/lib/constituencies";

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
  const t = await getBackendT();
  const ip = getClientIp(request);
  try {
    const session = await verifySuperAdminSession();
    if (!session) {
      return NextResponse.json({ error: t("api.unauthorized_access") }, { status: 401 });
    }

    const db = await getDb();
    const reps = await db
      .collection("users")
      .find({ role: "REPRESENTATIVE", constituency: { $in: [...CONSTITUENCIES] } })
      .sort({ createdAt: -1 })
      .toArray();

    // Map and sanitize before sending to client (do not send password hash)
    const sanitizedReps = reps.map((r: any) => ({
      _id: r._id,
      username: r.username,
      name: r.name || "",
      phone: r.phone || "",
      constituency: r.constituency || "",
      role: r.role,
      active: r.active === true,
      createdAt: r.createdAt,
    }));

    return NextResponse.json(sanitizedReps);
  } catch (error) {
    console.error("Error fetching representatives:", error);
    return NextResponse.json({ error: t("api.server_error") }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const t = await getBackendT();
  const ip = getClientIp(request);
  try {
    const session = await verifySuperAdminSession();
    if (!session) {
      return NextResponse.json({ error: t("api.unauthorized_access") }, { status: 401 });
    }

    const rawBody = await request.json();
    const body = sanitizeInput(rawBody);
    const { username, password, name, phone, constituency, active } = body;

    if (!username || !password || !constituency) {
      return NextResponse.json({ error: t("api.all_fields_req_const") }, { status: 400 });
    }

    if (!isConstituency(constituency)) {
      return NextResponse.json({ error: t("api.invalid_const") }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();
    const db = await getDb();

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ username: cleanUsername });
    if (existingUser) {
      return NextResponse.json({ error: t("api.username_exists") }, { status: 400 });
    }

    const isActive = active === true;

    // Validate strictly one representative per constituency rule
    const existingRep = await db.collection("users").findOne({
      role: "REPRESENTATIVE",
      constituency,
    });

    if (existingRep) {
      return NextResponse.json({
        error: `${constituency} தொகுதிக்கு ஏற்கனவே ஒரு பிரதிநிதி உள்ளார். (There is already a representative available in ${constituency})`,
      }, { status: 400 });
    }

    const newUser = {
      username: cleanUsername,
      passwordHash: hashPassword(password),
      name: name ? name.trim() : "",
      phone: phone ? phone.trim() : "",
      constituency,
      role: "REPRESENTATIVE",
      active: isActive,
      createdAt: new Date(),
    };

    await db.collection("users").insertOne(newUser);
    await logSecurityEvent(ip, "REPRESENTATIVE_CREATED", { createdBy: session.username, targetRep: cleanUsername, constituency });
    await logAuditEvent({
      username: session.username,
      role: session.role,
      constituency: session.constituency,
      action: "REPRESENTATIVE_CREATED",
      metadata: { targetRep: cleanUsername, constituency },
    });

    return NextResponse.json({ success: true, message: t("api.rep_created") });
  } catch (error) {
    console.error("Error creating representative:", error);
    return NextResponse.json({ error: t("api.rep_create_fail") }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const t = await getBackendT();
  const ip = getClientIp(request);
  try {
    const session = await verifySuperAdminSession();
    if (!session) {
      return NextResponse.json({ error: t("api.unauthorized_access") }, { status: 401 });
    }

    const rawBody = await request.json();
    const body = sanitizeInput(rawBody);
    const { username, name, phone, constituency, active, password } = body;

    if (!username) {
      return NextResponse.json({ error: t("api.username_req") }, { status: 400 });
    }

    if (constituency !== undefined && !isConstituency(constituency)) {
      return NextResponse.json({ error: t("api.invalid_const") }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();
    const db = await getDb();

    const targetUser = await db.collection("users").findOne({ username: cleanUsername });
    if (!targetUser) {
      return NextResponse.json({ error: t("api.user_not_found") }, { status: 404 });
    }

    const isActive = active === true;

    // Validate strictly one representative per constituency rule
    if (constituency !== undefined) {
      const existingRep = await db.collection("users").findOne({
        role: "REPRESENTATIVE",
        constituency,
        username: { $ne: cleanUsername }, // exclude self
      });

      if (existingRep) {
        return NextResponse.json({
          error: `${constituency} தொகுதிக்கு ஏற்கனவே ஒரு பிரதிநிதி உள்ளார். (There is already a representative available in ${constituency})`,
        }, { status: 400 });
      }
    }

    const updateFields: any = {
      name: name !== undefined ? name.trim() : targetUser.name,
      phone: phone !== undefined ? phone.trim() : targetUser.phone,
      constituency: constituency !== undefined ? constituency : targetUser.constituency,
      active: isActive,
    };

    if (password && password.trim() !== "") {
      updateFields.passwordHash = hashPassword(password);
    }

    await db.collection("users").updateOne(
      { username: cleanUsername },
      { $set: updateFields }
    );

    await logSecurityEvent(ip, "REPRESENTATIVE_UPDATED", { updatedBy: session.username, targetRep: cleanUsername, constituency });
    await logAuditEvent({
      username: session.username,
      role: session.role,
      constituency: session.constituency,
      action: password && password.trim() !== "" ? "PASSWORD_RESET" : "REPRESENTATIVE_UPDATED",
      metadata: { targetRep: cleanUsername, constituency: updateFields.constituency, active: isActive },
    });

    return NextResponse.json({ success: true, message: t("api.rep_updated") });
  } catch (error) {
    console.error("Error updating representative:", error);
    return NextResponse.json({ error: t("api.rep_update_fail") }, { status: 500 });
  }
}
