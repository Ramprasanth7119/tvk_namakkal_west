import { getBackendT } from "@/lib/backendI18n";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/mongodb";
import { verifySession } from "@/lib/session";
import { logAuditEvent } from "@/lib/auditLog";
import { buildInitialTimeline, normalizeStatus, getStatusLabel } from "@/lib/complaintStatus";
import { isCloudinaryConfigured, uploadMediaListToCloudinary } from "@/lib/cloudinary";
import { normalizeComplaintMedia } from "@/lib/complaintMedia";
import {
  getClientIp,
  validateRequestHeaders,
  checkRateLimit,
  sanitizeInput,
  validateBase64File,
  checkDuplicateComplaint,
  logSecurityEvent,
} from "@/lib/security";

export async function GET(request: Request) {
  const t = await getBackendT();
  const ip = getClientIp(request);

  try {
    // 1. Validate request headers
    const headerCheck = validateRequestHeaders(request);
    if (!headerCheck.valid) {
      return NextResponse.json({ error: headerCheck.error }, { status: 400 });
    }

    // 2. Rate limiting (Analytics APIs: 60 requests per minute)
    const rateLimit = await checkRateLimit(ip, "analytics_api_get", 60, 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: t("api.rate_limit_minute"),
        },
        { status: 429 }
      );
    }

    // 3. Authenticate and authorize session
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("site_auth");
    let filter: any = {};

    if (authCookie) {
      const session = verifySession(authCookie.value);
      if (!session) {
        return NextResponse.json(
          { error: t("api.unauthorized_access") },
          { status: 401 }
        );
      }

      if (session.role === "REPRESENTATIVE") {
        if (session.constituency) {
          filter.constituency = session.constituency;
        } else {
          // Representative with no constituency gets no data
          return NextResponse.json([]);
        }
      } else if (session.role === "FIELD_OFFICER") {
        filter.assignedTo = session.username;
      }
    } else {
      return NextResponse.json(
        { error: t("api.unauthorized_access") },
        { status: 401 }
      );
    }

    const db = await getDb();
    const complaints = await db
      .collection("citizenComplaints")
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    const normalized = complaints.map((complaint) => {
      const media = normalizeComplaintMedia(complaint as Parameters<typeof normalizeComplaintMedia>[0]);
      return {
        ...complaint,
        photoUrls: media.photos,
        videoUrls: media.video ? [media.video] : [],
        mediaUrls: media.mediaUrls,
      };
    });

    return NextResponse.json(normalized);
  } catch (error) {
    console.error("Error fetching complaints:", error);
    await logSecurityEvent(ip, "ANALYTICS_API_ERROR", { error: String(error) });
    return NextResponse.json(
      { error: t("api.complaint_fetch_fail") },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const t = await getBackendT();
  const ip = getClientIp(request);

  try {
    // 1. Validate request headers
    const headerCheck = validateRequestHeaders(request);
    if (!headerCheck.valid) {
      return NextResponse.json({ error: headerCheck.error }, { status: 400 });
    }

    // 2. Rate limiting (Complaint Submission: 5 requests per hour per IP)
    const rateLimit = await checkRateLimit(ip, "complaint_submit", 5, 60 * 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: t("api.rate_limit_complaints"),
        },
        { status: 429 }
      );
    }

    // 3. Sanitize and parse body
    const rawBody = await request.json();
    const body = sanitizeInput(rawBody);

    const {
      voterId,
      voterVerified,
      verificationMethod,
      locationAttempts,
      latitude,
      longitude,
      locationTimestamp,
      ward,
      constituency,
      citizenDetails,
      complaintDetails,
      mediaUrls,
      geolocation,
      email_honeypot,
      website_honeypot,
      panchayat,
      taluk,
      district,
    } = body;

    // 4. Honeypot Validation for bot protection
    if (email_honeypot || website_honeypot) {
      await logSecurityEvent(ip, "BOT_SUBMISSION_BLOCKED", { email_honeypot, website_honeypot });
      return NextResponse.json(
        { error: t("api.bot_blocked") },
        { status: 400 }
      );
    }

    // 5. Schema and payload validation
    if (!voterVerified || !voterId) {
      return NextResponse.json(
        { error: t("api.voter_id_required") },
        { status: 400 }
      );
    }

    if (!complaintDetails?.description || complaintDetails.description.trim() === "") {
      return NextResponse.json(
        { error: t("api.desc_required") },
        { status: 400 }
      );
    }

    // 6. Anti-Spam: Duplicate submission detection
    const dupCheck = await checkDuplicateComplaint(voterId, complaintDetails.description);
    if (dupCheck.isDuplicate) {
      return NextResponse.json(
        {
          error: `ஒரே மாதிரியான புகார் ஏற்கனவே சமர்ப்பிக்கப்பட்டுள்ளது. தயவுசெய்து ${dupCheck.cooldownRemaining} வினாடிகள் காத்திருக்கவும். (Duplicate complaint detected. Please wait.)`,
        },
        { status: 409 }
      );
    }

    // 7. File Upload Security & Rate Limiting (Max 10 uploads per hour per IP)
    const photosList = mediaUrls?.photos || [];
    const videoFile = mediaUrls?.video;
    const totalUploadsInPayload = photosList.length + (videoFile ? 1 : 0);

    if (totalUploadsInPayload > 0) {
      // Check file upload rate limit
      const uploadLimit = await checkRateLimit(ip, "file_upload", 10, 60 * 60 * 1000);
      if (!uploadLimit.success) {
        return NextResponse.json(
          {
            error: t("api.rate_limit_uploads"),
          },
          { status: 429 }
        );
      }

      // Validate photos
      for (const photo of photosList) {
        const fileCheck = validateBase64File(photo);
        if (!fileCheck.valid) {
          return NextResponse.json({ error: fileCheck.error }, { status: 400 });
        }
      }

      // Validate video
      if (videoFile) {
        const fileCheck = validateBase64File(videoFile);
        if (!fileCheck.valid) {
          return NextResponse.json({ error: fileCheck.error }, { status: 400 });
        }
      }
    }

    const db = await getDb();

    // Generate sequential tracking ID: ETT-YYYY-XXXXX
    const currentYear = new Date().getFullYear(); // 2026
    const prefix = `ETT-${currentYear}-`;

    // Generate a unique sequential tracking ID atomically to avoid collisions under
    // concurrent submissions. A per-year counter in `counters` is incremented atomically;
    // it is lazily seeded from the current max so it stays consistent with existing IDs.
    const counters = db.collection("counters");
    const counterId = `complaint-${currentYear}`;

    const existingCounter = await counters.findOne({ _id: counterId as any });
    if (!existingCounter) {
      const latestComplaint = await db
        .collection("citizenComplaints")
        .findOne(
          { trackingId: { $regex: `^${prefix}` } },
          { sort: { trackingId: -1 } }
        );
      let seed = 0;
      if (latestComplaint && latestComplaint.trackingId) {
        const parsed = parseInt(String(latestComplaint.trackingId).split("-")[2], 10);
        if (!isNaN(parsed)) seed = parsed;
      }
      // Seed the counter to the current max — $setOnInsert is a no-op if another
      // concurrent request already created it, so we never double-seed.
      await counters.updateOne(
        { _id: counterId as any },
        { $setOnInsert: { seq: seed } },
        { upsert: true }
      );
    }

    const counterDoc = await counters.findOneAndUpdate(
      { _id: counterId as any },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: "after" }
    );
    const nextNum = (counterDoc && (counterDoc as any).seq) || 1;
    const trackingId = `${prefix}${String(nextNum).padStart(5, "0")}`;

    // Upload media to Cloudinary (do not store base64 in MongoDB)
    let photoUrls: string[] = [];
    let videoUrls: string[] = [];

    if (totalUploadsInPayload > 0) {
      if (!isCloudinaryConfigured()) {
        return NextResponse.json(
          { error: t("api.cloudinary_error") },
          { status: 503 }
        );
      }

      try {
        if (photosList.length > 0) {
          photoUrls = await uploadMediaListToCloudinary(photosList, "complaints/photos", "image");
        }
        if (videoFile) {
          videoUrls = await uploadMediaListToCloudinary([videoFile], "complaints/videos", "video");
        }
      } catch (uploadErr) {
        console.error("Cloudinary upload error:", uploadErr);
        return NextResponse.json({ error: t("api.media_upload_error") }, { status: 500 });
      }
    }

    const newComplaint = {
      trackingId,
      voterVerified,
      voterId: String(voterId).trim().toUpperCase(),
      verificationMethod: verificationMethod || "VOTER_ID",
      locationAttempts: typeof locationAttempts === 'number' ? locationAttempts : 0,
      latitude: latitude != null ? Number(latitude) : (geolocation?.latitude != null ? Number(geolocation.latitude) : null),
      longitude: longitude != null ? Number(longitude) : (geolocation?.longitude != null ? Number(geolocation.longitude) : null),
      locationTimestamp: locationTimestamp ? new Date(locationTimestamp) : null,
      ward: sanitizeInput(ward),
      constituency: sanitizeInput(constituency),
      panchayat: sanitizeInput(panchayat),
      taluk: sanitizeInput(taluk),
      district: sanitizeInput(district),
      citizenDetails: sanitizeInput(citizenDetails),
      complaintDetails: sanitizeInput(complaintDetails),
      photoUrls,
      videoUrls,
      mediaUrls: {
        photos: photoUrls,
        video: videoUrls[0] || undefined,
      },
      geolocation: sanitizeInput(geolocation),
      status: "pend",
      approvalStatus: "APPROVED",
      timeline: buildInitialTimeline(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection("citizenComplaints").insertOne(newComplaint);

    await logSecurityEvent(ip, "COMPLAINT_SUBMISSION_SUCCESS", { trackingId, voterId });

    return NextResponse.json({
      success: true,
      trackingId,
      photoUrls,
      videoUrls,
      message: t("api.complaint_success"),
    });
  } catch (error) {
    console.error("Error saving complaint:", error);
    await logSecurityEvent(ip, "COMPLAINT_SUBMISSION_ERROR", { error: String(error) });
    return NextResponse.json(
      { error: t("api.complaint_fail") },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const t = await getBackendT();
  const ip = getClientIp(request);
  try {
    const rawBody = await request.json();
    const body = sanitizeInput(rawBody);
    const { trackingId, action, status } = body;

    if (!trackingId) {
      return NextResponse.json({ error: t("api.tracking_id_req") }, { status: 400 });
    }

    const cookieStore = await cookies();
    const authCookie = cookieStore.get("site_auth");
    if (!authCookie) {
      return NextResponse.json({ error: t("api.unauthorized") }, { status: 401 });
    }
    const session = verifySession(authCookie.value);
    if (!session) {
      return NextResponse.json({ error: t("api.unauthorized") }, { status: 401 });
    }

    const db = await getDb();
    const complaint = await db.collection("citizenComplaints").findOne({ trackingId });
    if (!complaint) {
      return NextResponse.json({ error: t("api.complaint_not_found") }, { status: 404 });
    }

    // Role-based constituency access check
    if (session.role === "REPRESENTATIVE" && complaint.constituency !== session.constituency) {
      return NextResponse.json({ error: t("api.forbidden_access") }, { status: 403 });
    }
    if (session.role === "FIELD_OFFICER" && complaint.assignedTo !== session.username) {
      return NextResponse.json({ error: t("api.forbidden_access") }, { status: 403 });
    }

    const now = new Date();
    const updateFields: any = { updatedAt: now };
    let timelineNote = "";
    let nextStatus = complaint.status;

    // Standardize Workflow Actions
    if (action === "assign") {
      // Representative assigns to Field Officer
      if (session.role !== "REPRESENTATIVE" && session.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: t("api.forbidden") }, { status: 403 });
      }
      const { assignedTo } = body;
      if (!assignedTo) {
        return NextResponse.json({ error: t("api.fo_required") }, { status: 400 });
      }
      
      const officer = await db.collection("users").findOne({ username: assignedTo, role: "FIELD_OFFICER" });
      if (!officer) {
        return NextResponse.json({ error: t("api.fo_not_found") }, { status: 404 });
      }

      nextStatus = "assigned";
      updateFields.status = "assigned";
      updateFields.assignedTo = officer.username;
      updateFields.assignedToName = officer.name || officer.username;
      updateFields.assignedBy = session.username;
      updateFields.assignedAt = now;
      timelineNote = `களப்பணியாளர் ${officer.name || officer.username}க்கு மனு ஒதுக்கப்பட்டது`;

    } else if (action === "start_work") {
      // Field Officer claims work
      if (session.role !== "FIELD_OFFICER") {
        return NextResponse.json({ error: t("api.forbidden") }, { status: 403 });
      }
      nextStatus = "work_in_progress";
      updateFields.status = "work_in_progress";
      timelineNote = `களப்பணியாளர் ${session.username} பணியைத் தொடங்கினார்`;

    } else if (action === "submit_solution") {
      // Field Officer uploads evidence and finishes task
      if (session.role !== "FIELD_OFFICER") {
        return NextResponse.json({ error: t("api.forbidden") }, { status: 403 });
      }
      const { beforeImages, afterImages, videos, workNotes } = body;

      let uploadedBefore: string[] = [];
      let uploadedAfter: string[] = [];
      let uploadedVideos: string[] = [];

      if (isCloudinaryConfigured()) {
        try {
          if (Array.isArray(beforeImages) && beforeImages.length > 0) {
            uploadedBefore = await uploadMediaListToCloudinary(beforeImages, "evidence/before", "image");
          }
          if (Array.isArray(afterImages) && afterImages.length > 0) {
            uploadedAfter = await uploadMediaListToCloudinary(afterImages, "evidence/after", "image");
          }
          if (Array.isArray(videos) && videos.length > 0) {
            uploadedVideos = await uploadMediaListToCloudinary(videos, "evidence/videos", "video");
          }
        } catch (uploadErr) {
          console.error("Cloudinary upload error inside submit_solution:", uploadErr);
          return NextResponse.json({ error: t("api.evidence_upload_error") }, { status: 500 });
        }
      }

      nextStatus = "solution_submitted";
      updateFields.status = "solution_submitted";
      updateFields.beforeImages = uploadedBefore;
      updateFields.afterImages = uploadedAfter;
      updateFields.videos = uploadedVideos;
      updateFields.workNotes = workNotes || "";
      updateFields.solvedBy = session.username;
      timelineNote = `களப்பணியாளர் ${session.username} தீர்வு சமர்ப்பித்தார்`;

    } else if (action === "rep_approve") {
      // Representative approves field work
      if (session.role !== "REPRESENTATIVE" && session.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: t("api.forbidden") }, { status: 403 });
      }
      nextStatus = "pending_admin_approval";
      updateFields.status = "pending_admin_approval";
      updateFields.representativeApproval = "APPROVED";
      updateFields.representativeApprovedAt = now;
      updateFields.verifiedBy = session.username;
      timelineNote = `பிரதிநிதி ${session.username} ஒப்புதல் அளித்தார்`;

    } else if (action === "rep_reject") {
      // Representative rejects field work, sends back
      if (session.role !== "REPRESENTATIVE" && session.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: t("api.forbidden") }, { status: 403 });
      }
      const { rejectionReason } = body;
      if (!rejectionReason) {
        return NextResponse.json({ error: t("api.reject_reason_req") }, { status: 400 });
      }
      nextStatus = "work_in_progress";
      updateFields.status = "work_in_progress";
      updateFields.representativeApproval = "REJECTED";
      updateFields.rejectionReason = rejectionReason;
      timelineNote = `பிரதிநிதி ${session.username} தீர்வினை நிராகரித்தார்: ${rejectionReason}`;

    } else if (action === "admin_approve") {
      // Super Admin resolves finally
      if (session.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: t("api.forbidden") }, { status: 403 });
      }
      nextStatus = "resolved";
      updateFields.status = "resolved";
      updateFields.adminApproval = "APPROVED";
      updateFields.adminApprovedAt = now;
      updateFields.approvedBy = "SUPER_ADMIN";
      timelineNote = t("api.admin_approved");

    } else if (action === "admin_reject") {
      // Super Admin rejects and sends back to work_in_progress
      if (session.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: t("api.forbidden") }, { status: 403 });
      }
      const { rejectionReason } = body;
      nextStatus = "work_in_progress";
      updateFields.status = "work_in_progress";
      updateFields.adminApproval = "REJECTED";
      updateFields.adminRejectionReason = rejectionReason || t("api.admin_dissatisfied");
      timelineNote = `நிர்வாகி தீர்வினை மீண்டும் அனுப்பினார்: ${rejectionReason || "மதிப்பாய்வுக்காக"}`;

    } else {
      // Fallback to legacy single status updates
      if (!status) {
        return NextResponse.json({ error: t("api.invalid_action") }, { status: 400 });
      }
      nextStatus = normalizeStatus(status);
      updateFields.status = nextStatus;
      timelineNote = `மனுவின் நிலை ${getStatusLabel(nextStatus)} என மாற்றப்பட்டது`;
    }

    const timelineEntry = {
      status: nextStatus,
      updatedAt: now,
      updatedBy: session.username,
      notes: timelineNote,
    };

    await db.collection("citizenComplaints").updateOne(
      { trackingId },
      {
        $set: updateFields,
        $push: { timeline: timelineEntry } as any,
      }
    );

    await logSecurityEvent(ip, "COMPLAINT_STATUS_UPDATED", { trackingId, status: nextStatus, updatedBy: session.username, action });
    await logAuditEvent({
      username: session.username,
      role: session.role,
      constituency: session.constituency,
      action: action ? `COMPLAINT_${action.toUpperCase()}` : "COMPLAINT_STATUS_CHANGE",
      trackingId,
      metadata: { status: nextStatus, notes: timelineNote },
    });

    return NextResponse.json({ success: true, message: t("api.update_success") });
  } catch (error) {
    console.error("Error updating complaint status:", error);
    return NextResponse.json({ error: t("api.update_fail") }, { status: 500 });
  }
}
