import dns from "node:dns";
import { Resolver } from "node:dns/promises";
import { MongoClient } from "mongodb";
import { seedDatabase, syncRepresentativeConstituencies } from "./dbSeed";

dns.setDefaultResultOrder("ipv4first");

const fallbackUri = "mongodb://localhost:27017/tvk-west";
const rawUri = process.env.MONGODB_URI || fallbackUri;
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 15000,
};

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

/** Database name: env override, path in URI, or MongoDB default `test` for Atlas URIs without a path. */
export function getDatabaseName(): string {
  const fromEnv = process.env.MONGODB_DB_NAME?.trim();
  if (fromEnv) return fromEnv;

  const candidate = process.env.MONGODB_URI_STANDARD || process.env.MONGODB_URI || "";
  try {
    const pseudo = candidate.replace(/^mongodb(\+srv)?:\/\//, "https://");
    const pathname = new URL(pseudo).pathname.replace(/^\//, "");
    const name = pathname.split("/")[0];
    if (name) return decodeURIComponent(name);
  } catch {
    /* ignore malformed URI */
  }

  return "test";
}

/**
 * Node on some Windows/network setups cannot resolve mongodb+srv (querySrv ECONNREFUSED)
 * while system nslookup works. Resolve SRV via public DNS and build a standard URI.
 */
async function resolveMongoUri(uri: string): Promise<string> {
  const standardOverride = process.env.MONGODB_URI_STANDARD?.trim();
  if (standardOverride) return standardOverride;

  if (!uri.startsWith("mongodb+srv://")) return uri;

  const pseudo = uri.replace("mongodb+srv://", "https://");
  const url = new URL(pseudo);
  const srvHost = `_mongodb._tcp.${url.hostname}`;

  const resolver = new Resolver();
  resolver.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);

  let records;
  try {
    records = await resolver.resolveSrv(srvHost);
  } catch (primaryErr) {
    try {
      const { resolveSrv } = await import("node:dns/promises");
      records = await resolveSrv(srvHost);
    } catch {
      console.error("MongoDB SRV resolution failed:", primaryErr);
      throw primaryErr;
    }
  }

  const hosts = records.map((r) => `${r.name}:${r.port}`).join(",");
  const auth =
    url.username.length > 0
      ? `${encodeURIComponent(decodeURIComponent(url.username))}:${encodeURIComponent(decodeURIComponent(url.password))}@`
      : "";

  const dbPath = url.pathname && url.pathname !== "/" ? url.pathname : "";
  const params = new URLSearchParams(url.search.replace(/^\?/, ""));
  if (!params.has("ssl")) params.set("ssl", "true");
  if (!params.has("authSource")) params.set("authSource", "admin");
  if (!params.has("retryWrites")) params.set("retryWrites", "true");
  if (!params.has("w")) params.set("w", "majority");

  return `mongodb://${auth}${hosts}${dbPath}?${params.toString()}`;
}

async function connectClient(): Promise<MongoClient> {
  const resolvedUri = await resolveMongoUri(rawUri);
  const client = new MongoClient(resolvedUri, options);
  return client.connect();
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = connectClient();
  }
  clientPromise = global._mongoClientPromise;
} else {
  clientPromise = connectClient();
}

export default clientPromise;

let seeded = false;

export async function getDb() {
  const client = await clientPromise;
  const db = client.db(getDatabaseName());

  if (!seeded) {
    seeded = true;
    Promise.resolve().then(async () => {
      try {
        await syncRepresentativeConstituencies(db);
        await seedDatabase(db);
      } catch (err) {
        console.error("Lazy database seeding error:", err);
      }
    });
  }

  return db;
}
