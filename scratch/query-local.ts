const { MongoClient } = require('mongodb');

async function main() {
  const uri = "mongodb://127.0.0.1:27017";
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 2000 });
  try {
    await client.connect();
    console.log("Connected to LOCAL MongoDB!");
    const db = client.db('tvk-west');
    const voters = await db.collection('voterRegistry').find({}).toArray();
    console.log("All Local Voter Documents in 'tvk-west':", JSON.stringify(voters, null, 2));
  } catch (err) {
    console.error("Local search failed:", err.message);
  } finally {
    await client.close();
    process.exit(0);
  }
}

main();
