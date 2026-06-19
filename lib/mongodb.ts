  import { MongoClient } from "mongodb";

  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/tvk_west";
  const options = {
    maxPoolSize: 10,
  };

  let client: MongoClient;
  let clientPromise: Promise<MongoClient>;

  declare global {
    var _mongoClientPromise: Promise<MongoClient> | undefined;
  }

  if (!process.env.MONGODB_URI) {
    console.warn("Please define the MONGODB_URI environment variable inside .env.local");
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

  export async function getDb() {
    const client = await clientPromise;
    return client.db();
  }
