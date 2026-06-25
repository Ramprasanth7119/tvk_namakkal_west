const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

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
  const client = new MongoClient(rawUri);
  try {
    await client.connect();
    const db = client.db(getDatabaseName());
    
    const voters = await db.collection('voterRegistry').find({ name: /Nainamalai/i }).toArray();
    console.log("Matching Voters:", JSON.stringify(voters, null, 2));
    
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

main();
