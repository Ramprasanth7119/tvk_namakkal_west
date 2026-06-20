import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/mongodb";
import { verifySession, hashPassword } from "@/lib/session";
import { logAuditEvent } from "@/lib/auditLog";
import { getClientIp, logSecurityEvent, sanitizeInput } from "@/lib/security";
import { ObjectId } from "mongodb";

// Helper function to verify representative or super admin session
async function verifyRepOrAdminSession() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("site_auth");
  if (!authCookie) return null;

  const session = verifySession(authCookie.value);
  if (!session || (session.role !== "REPRESENTATIVE" && session.role !== "SUPER_ADMIN")) return null;

  return session;
}

// 1. GET ALL FIELD OFFICERS FOR THE REPRESENTATIVE'S CONSTITUENCY
export async function GET(request: Request) {
  const ip = getClientIp(request);
  try {
    const session = await verifyRepOrAdminSession();
    if (!session) {
      return NextResponse.json({ error: "அங்கீகரிக்கப்படாத அணுகல் (Unauthorized access)" }, { status: 401 });
    }

    const db = await getDb();
    
    // Super Admins see all officers, Representatives see only their constituency's officers
    const filter: any = { role: "FIELD_OFFICER" };
    if (session.role === "REPRESENTATIVE") {
      filter.constituency = session.constituency;
    }

    const officers = await db
      .collection("users")
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    const sanitizedOfficers = officers.map((off: any) => ({
      _id: off._id,
      username: off.username,
      name: off.name || "",
      phone: off.phone || "",
      constituency: off.constituency || "",
      active: off.active === true,
      createdAt: off.createdAt,
    }));

    return NextResponse.json(sanitizedOfficers);
  } catch (error) {
    console.error("Error fetching field officers:", error);
    return NextResponse.json({ error: "சேவையக பிழை" }, { status: 500 });
  }
}

// 2. CREATE FIELD OFFICER
export async function POST(request: Request) {
  const ip = getClientIp(request);
  try {
    const session = await verifyRepOrAdminSession();
    if (!session) {
      return NextResponse.json({ error: "அங்கீகரிக்கப்படாத அணுகல் (Unauthorized access)" }, { status: 401 });
    }

    const rawBody = await request.json();
    const body = sanitizeInput(rawBody);
    const { username, password, name, phone, active } = body;

    if (!username || !password || !name) {
      return NextResponse.json({ error: "அனைத்து கட்டாய புலங்களையும் நிரப்பவும் (Username, password, and name are required)" }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();
    const db = await getDb();

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ username: cleanUsername });
    if (existingUser) {
      return NextResponse.json({ error: "இந்த பயனர் பெயர் ஏற்கனவே உள்ளது (Username already exists)" }, { status: 400 });
    }

    // Inherit representative constituency
    const constituency = session.constituency;
    if (!constituency && session.role === "REPRESENTATIVE") {
      return NextResponse.json({ error: "பிரதிநிதியின் தொகுதி கண்டறியப்படவில்லை" }, { status: 400 });
    }

    const newUser = {
      username: cleanUsername,
      passwordHash: hashPassword(password),
      name: name.trim(),
      phone: phone ? phone.trim() : "",
      constituency: session.role === "SUPER_ADMIN" ? body.constituency : constituency, // Super Admin can assign manually
      role: "FIELD_OFFICER" as const,
      active: active === true,
      createdBy: session.username,
      createdAt: new Date(),
    };

    await db.collection("users").insertOne(newUser);
    await logSecurityEvent(ip, "FIELD_OFFICER_CREATED", { createdBy: session.username, targetOfficer: cleanUsername, constituency: newUser.constituency });
    await logAuditEvent({
      username: session.username,
      role: session.role,
      constituency: session.constituency,
      action: "FIELD_OFFICER_CREATED",
      metadata: { targetOfficer: cleanUsername, constituency: newUser.constituency },
    });

    return NextResponse.json({ success: true, message: "களப்பணியாளர் வெற்றிகரமாக உருவாக்கப்பட்டார் (Field officer created successfully)" });
  } catch (error) {
    console.error("Error creating field officer:", error);
    return NextResponse.json({ error: "களப்பணியாளர் உருவாக்குவதில் பிழை ஏற்பட்டது" }, { status: 500 });
  }
}

// 3. EDIT / DISABLE / RESET PASSWORD FIELD OFFICER
export async function PATCH(request: Request) {
  const ip = getClientIp(request);
  try {
    const session = await verifyRepOrAdminSession();
    if (!session) {
      return NextResponse.json({ error: "அங்கீகரிக்கப்படாத அணுகல் (Unauthorized access)" }, { status: 401 });
    }

    const rawBody = await request.json();
    const body = sanitizeInput(rawBody);
    const { username, name, phone, active, password } = body;

    if (!username) {
      return NextResponse.json({ error: "பயனர் பெயர் தேவை (Username is required)" }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();
    const db = await getDb();

    const targetUser = await db.collection("users").findOne({ username: cleanUsername, role: "FIELD_OFFICER" });
    if (!targetUser) {
      return NextResponse.json({ error: "களப்பணியாளர் கண்டறியப்படவில்லை (Field officer not found)" }, { status: 404 });
    }

    // Check constituency permission for Representative
    if (session.role === "REPRESENTATIVE" && targetUser.constituency !== session.constituency) {
      return NextResponse.json({ error: "அனுமதி மறுக்கப்பட்டது (Access Forbidden)" }, { status: 403 });
    }

    const updateFields: any = {
      name: name !== undefined ? name.trim() : targetUser.name,
      phone: phone !== undefined ? phone.trim() : targetUser.phone,
      active: active !== undefined ? active === true : targetUser.active,
    };

    if (session.role === "SUPER_ADMIN" && body.constituency !== undefined) {
      updateFields.constituency = body.constituency;
    }

    if (password && password.trim() !== "") {
      updateFields.passwordHash = hashPassword(password);
    }

    await db.collection("users").updateOne(
      { username: cleanUsername, role: "FIELD_OFFICER" },
      { $set: updateFields }
    );

    await logSecurityEvent(ip, "FIELD_OFFICER_UPDATED", { updatedBy: session.username, targetOfficer: cleanUsername });
    await logAuditEvent({
      username: session.username,
      role: session.role,
      constituency: session.constituency,
      action: password && password.trim() !== "" ? "FIELD_OFFICER_PASSWORD_RESET" : "FIELD_OFFICER_UPDATED",
      metadata: { targetOfficer: cleanUsername, active: updateFields.active },
    });

    return NextResponse.json({ success: true, message: "களப்பணியாளர் விவரங்கள் வெற்றிகரமாக புதுப்பிக்கப்பட்டது" });
  } catch (error) {
    console.error("Error updating field officer:", error);
    return NextResponse.json({ error: "களப்பணியாளர் விவரங்களை புதுப்பிப்பதில் பிழை ஏற்பட்டது" }, { status: 500 });
  }
}
