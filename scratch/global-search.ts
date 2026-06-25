import clientPromise from "../lib/mongodb";

async function main() {
  try {
    const client = await clientPromise;
    const adminDb = client.db().admin();
    const dbs = await adminDb.listDatabases();
    
    for (const dbInfo of dbs.databases) {
      const db = client.db(dbInfo.name);
      const collections = await db.listCollections().toArray();
      for (const collInfo of collections) {
        // Skip system collections
        if (collInfo.name.startsWith("system.")) continue;
        
        try {
          const count = await db.collection(collInfo.name).countDocuments();
          if (count === 0) continue;
          
          // Find document containing "Nainamalai" or "RHB0678557" in any field (using text search or simple key regex)
          const results = await db.collection(collInfo.name).find({
            $or: [
              { voterId: "RHB0678557" },
              { voterId: /RHB0678557/i },
              { name: /Nainamalai/i },
              { VoterName: /Nainamalai/i }
            ]
          }).toArray();
          
          if (results.length > 0) {
            console.log(`FOUND in database '${dbInfo.name}', collection '${collInfo.name}':`, JSON.stringify(results, null, 2));
          }
        } catch (err) {
          // Ignore failures on system/admin collections
        }
      }
    }
    console.log("Search finished.");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
