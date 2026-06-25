const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const content = fs.readFileSync(envPath, 'utf8');
let rawUri = '';
for (const line of content.split('\n')) {
  if (line.startsWith('MONGODB_URI=')) {
    rawUri = line.substring('MONGODB_URI='.length).trim();
  }
}

function getDatabaseName() {
  const candidate = rawUri || "";
  try {
    const pseudo = candidate.replace(/^mongodb(\+srv)?:\/\//, "https://");
    const pathname = new URL(pseudo).pathname.replace(/^\//, "");
    const name = pathname.split("/")[0];
    if (name) return decodeURIComponent(name);
  } catch {}
  return "test";
}

async function main() {
  console.log("Using URI:", rawUri);
  console.log("Using DB Name:", getDatabaseName());
  
  const client = new MongoClient(rawUri);
  try {
    await client.connect();
    const db = client.db(getDatabaseName());
    
    // Let's print database list to verify
    const adminDb = client.db().admin();
    const dbs = await adminDb.listDatabases();
    console.log("Available databases:", dbs.databases.map(d => d.name));
    
    const voter = await db.collection('voterRegistry').findOne({ voterId: 'RHB0678557' });
    console.log("Voter Document for RHB0678557:", JSON.stringify(voter, null, 2));
    
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

main();
