import { MongoClient } from "mongodb";
import { seedDatabase, syncRepresentativeConstituencies } from "./dbSeed";

const uri = "mongodb://localhost:27017/tvk-west";
const options = {
  maxPoolSize: 10,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (!uri) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

let seeded = false;

export async function getDb() {
  const client = await clientPromise;
  const db = client.db();
  
  if (!seeded) {
    seeded = true;
    // Perform database seeding and constituency sync in background
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
