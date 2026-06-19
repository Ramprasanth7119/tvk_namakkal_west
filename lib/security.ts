import { getDb } from "./mongodb";

// Cache index creation state
let indexCreated = false;

/**
 * Ensures that all necessary security indexes are created in MongoDB.
 * This runs lazily on the first security check.
 */
async function ensureIndexes() {
  if (indexCreated) return;
  try {
    const db = await getDb();
    // TTL index for rate limits (automatically delete expired limits)
    await db.collection("rate_limits").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    // Index for duplicate complaint checks
    await db.collection("citizenComplaints").createIndex({ voterId: 1, createdAt: -1 });
    // TTL index for security logs (keep logs for 30 days)
    await db.collection("security_logs").createIndex({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });
    indexCreated = true;
  } catch (err) {
    console.error("Error creating security indexes:", err);
  }
}

/**
 * Extracts the client's IP address from request headers.
 */
export function getClientIp(request: Request): string {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }
  return "127.0.0.1";
}

/**
 * Validates request headers for basic bot and scraper protection.
 */
export function validateRequestHeaders(request: Request): { valid: boolean; error?: string } {
  const userAgent = request.headers.get("user-agent") || "";
  
  // Block known malicious bots, scrapers, and empty user agents
  if (!userAgent || userAgent.trim() === "") {
    return { valid: false, error: "அங்கீகரிக்கப்படாத அணுகல் (Empty User-Agent)" };
  }

  const suspiciousAgents = [
    "curl", "wget", "python-requests", "libwww-perl", "scrapy", 
    "postmanruntime", "headlesschrome", "selenium", "puppeteer"
  ];

  const agentLower = userAgent.toLowerCase();
  for (const bot of suspiciousAgents) {
    if (agentLower.includes(bot)) {
      return { valid: false, error: "அங்கீகரிக்கப்படாத அணுகல் (Automated Request Blocked)" };
    }
  }

  return { valid: true };
}

/**
 * Sliding window rate limiter backed by MongoDB.
 * Works perfectly across serverless cold starts and Vercel deployments.
 */
export async function checkRateLimit(
  ip: string,
  action: string,
  limit: number,
  windowMs: number
): Promise<{ success: boolean; count: number; limit: number; remaining: number; reset: Date }> {
  await ensureIndexes();
  const db = await getDb();
  const limitsCollection = db.collection("rate_limits");

  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const key = `${ip}:${action}:${windowStart}`;
  const resetTime = new Date(windowStart + windowMs);

  try {
    const result = await limitsCollection.findOneAndUpdate(
      { _id: key as any },
      {
        $inc: { count: 1 },
        $setOnInsert: {
          ip,
          action,
          windowStart: new Date(windowStart),
          expiresAt: resetTime,
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    const count = result?.count || 1;
    const remaining = Math.max(0, limit - count);
    const success = count <= limit;

    if (!success) {
      await logSecurityEvent(ip, "RATE_LIMIT_VIOLATION", { action, count, limit });
    }

    return {
      success,
      count,
      limit,
      remaining,
      reset: resetTime,
    };
  } catch (error) {
    console.error("Rate limiting error:", error);
    // Fallback to allow request in case of DB issues to avoid crashing the app
    return {
      success: true,
      count: 1,
      limit,
      remaining: limit - 1,
      reset: new Date(now + windowMs),
    };
  }
}

/**
 * Sanitizes input to prevent NoSQL injection.
 * Recursively removes keys starting with $ or containing dots.
 */
export function sanitizeInput(val: any): any {
  if (val === null || val === undefined) return val;

  if (Array.isArray(val)) {
    return val.map(sanitizeInput);
  }

  if (typeof val === "object") {
    const clean: Record<string, any> = {};
    for (const key of Object.keys(val)) {
      // Strip NoSQL operators and invalid keys
      if (key.startsWith("$") || key.includes(".")) {
        continue;
      }
      clean[key] = sanitizeInput(val[key]);
    }
    return clean;
  }

  return val;
}

/**
 * Validates a base64 file attachment (image or video).
 */
export function validateBase64File(dataUrl: string): {
  valid: boolean;
  error?: string;
  mimeType?: string;
  sizeBytes?: number;
} {
  if (!dataUrl || typeof dataUrl !== "string") {
    return { valid: false, error: "செல்லாத கோப்பு வடிவம் (Invalid file format)" };
  }

  const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
  if (!match) {
    return { valid: false, error: "செல்லாத கோப்பு வடிவம் (Invalid base64 format)" };
  }

  const mimeType = match[1];
  const base64Data = match[2];
  
  // Calculate size in bytes
  const sizeBytes = Math.round((base64Data.length * 3) / 4);

  // Allowed mime types
  const allowedImages = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const allowedVideos = ["video/mp4", "video/quicktime", "video/3gpp", "video/webm"];

  const isImage = allowedImages.includes(mimeType);
  const isVideo = allowedVideos.includes(mimeType);

  if (!isImage && !isVideo) {
    return {
      valid: false,
      error: "அனுமதிக்கப்படாத கோப்பு வகை. படங்கள் (JPG, PNG, WebP) மற்றும் வீடியோக்கள் (MP4, WebM) மட்டுமே அனுமதிக்கப்படும்.",
    };
  }

  // Size limits
  const maxImageSize = 10 * 1024 * 1024; // 10MB
  const maxVideoSize = 50 * 1024 * 1024; // 50MB

  if (isImage && sizeBytes > maxImageSize) {
    return { valid: false, error: "படம் 10MB-க்கு மிகாமல் இருக்க வேண்டும் (Image must be under 10MB)" };
  }

  if (isVideo && sizeBytes > maxVideoSize) {
    return { valid: false, error: "வீடியோ 50MB-க்கு மிகாமல் இருக்க வேண்டும் (Video must be under 50MB)" };
  }

  return {
    valid: true,
    mimeType,
    sizeBytes,
  };
}

/**
 * Checks for duplicate complaint submissions within a cooldown period.
 */
export async function checkDuplicateComplaint(
  voterId: string,
  description: string
): Promise<{ isDuplicate: boolean; cooldownRemaining?: number }> {
  await ensureIndexes();
  const db = await getDb();
  
  // 10 minutes cooldown for identical complaints
  const cooldownMs = 10 * 60 * 1000;
  const cutoffTime = new Date(Date.now() - cooldownMs);

  try {
    const recentComplaints = await db
      .collection("citizenComplaints")
      .find({
        voterId: String(voterId),
        createdAt: { $gte: cutoffTime },
      })
      .toArray();

    const cleanDesc = description.trim().toLowerCase().replace(/\s+/g, "");

    for (const comp of recentComplaints) {
      const existingDesc = (comp.complaintDetails?.description || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "");

      if (cleanDesc === existingDesc) {
        const ageMs = Date.now() - new Date(comp.createdAt).getTime();
        const remainingSec = Math.ceil((cooldownMs - ageMs) / 1000);
        return {
          isDuplicate: true,
          cooldownRemaining: remainingSec,
        };
      }
    }
  } catch (error) {
    console.error("Duplicate complaint check error:", error);
  }

  return { isDuplicate: false };
}

/**
 * Logs a security event to MongoDB for auditing and abuse tracking.
 */
export async function logSecurityEvent(
  ip: string,
  eventType: string,
  details: any
): Promise<void> {
  try {
    const db = await getDb();
    await db.collection("security_logs").insertOne({
      ip,
      eventType,
      details: sanitizeInput(details),
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Failed to log security event:", error);
  }
}
