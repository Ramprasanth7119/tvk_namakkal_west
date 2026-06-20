import path from "path";
import fs from "fs";
import { Db } from "mongodb";
import { hashPassword } from "./session";
import { CONSTITUENCIES } from "./constituencies";
import { ensureVoterRegistryIndexes } from "./voterRegistry";
import { seedVotersFromBuffer } from "./voterImport";

// Keep track of seeding state
let seedingInProgress = false;
let seedingCompleted = false;
let constituencySyncCompleted = false;

/** Remove representative accounts tied to obsolete constituencies. */
export async function syncRepresentativeConstituencies(db: Db) {
  if (constituencySyncCompleted) return;
  constituencySyncCompleted = true;

  const obsoleteReps = await db.collection("users").deleteMany({
    role: "REPRESENTATIVE",
    constituency: { $nin: [...CONSTITUENCIES] },
  });
  if (obsoleteReps.deletedCount > 0) {
    console.log(`Removed ${obsoleteReps.deletedCount} obsolete representative account(s).`);
  }
}

export async function seedDatabase(db: Db) {
  if (seedingInProgress || seedingCompleted) return;
  seedingInProgress = true;

  try {
    console.log("Database seeding starting...");

    // 1. Create collections indexes
    console.log("Creating indexes...");
    
    // users
    await db.collection("users").createIndex({ username: 1 }, { unique: true });
    await db.collection("users").createIndex({ constituency: 1 });

    // voterRegistry + importHistory indexes
    await ensureVoterRegistryIndexes(db);

    // citizenComplaints
    await db.collection("citizenComplaints").createIndex({ voterId: 1 });
    await db.collection("citizenComplaints").createIndex({ constituency: 1 });
    await db.collection("citizenComplaints").createIndex({ trackingId: 1 }, { unique: true });
    await db.collection("citizenComplaints").createIndex({ status: 1 });
    await db.collection("citizenComplaints").createIndex({ createdAt: -1 });
    await db.collection("citizenComplaints").createIndex({ approvalStatus: 1 });

    // auditLogs
    await db.collection("auditLogs").createIndex({ timestamp: -1 });
    await db.collection("auditLogs").createIndex({ username: 1 });

    // security logs (TTL index - 30 days)
    await db.collection("security_logs").createIndex({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });
    
    // rate limits (TTL index)
    await db.collection("rate_limits").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

    // 2. Seed Users
    const usersCount = await db.collection("users").countDocuments();
    if (usersCount === 0) {
      console.log("Seeding users...");
      const defaultUsers = [
        {
          username: "admin",
          passwordHash: hashPassword("thalapathy"),
          role: "SUPER_ADMIN",
          constituency: null,
          active: true,
          createdAt: new Date(),
        },
        // Representatives for each constituency (order matches CONSTITUENCIES)
        ...[
          { username: "rep_komarapalayam", constituency: CONSTITUENCIES[0] },
          { username: "rep_namakkal", constituency: CONSTITUENCIES[1] },
          { username: "rep_velur", constituency: CONSTITUENCIES[2] },
        ].map((rep) => ({
          username: rep.username,
          passwordHash: hashPassword("password123"),
          role: "REPRESENTATIVE",
          constituency: rep.constituency,
          active: true,
          createdAt: new Date(),
        })),
      ];

      await db.collection("users").insertMany(defaultUsers);
      console.log("Users seeded successfully.");
    } else {
      console.log("Users already exist.");
    }

    // Remove legacy representatives outside the current constituency list
    await syncRepresentativeConstituencies(db);

    // 3. Seed Voter Registry from Voter_List.xlsx (only when empty)
    const filePath = path.join(process.cwd(), "lib", "Voter_List.xlsx");
    if (fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath);
      await seedVotersFromBuffer(db, fileBuffer, "Voter_List.xlsx");
    } else {
      console.error("Voter_List.xlsx not found at:", filePath);
    }

    seedingCompleted = true;
    console.log("Database seeding completed successfully.");
  } catch (error) {
    console.error("Database seeding failed:", error);
  } finally {
    seedingInProgress = false;
  }
}
