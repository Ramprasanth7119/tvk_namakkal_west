import fs from "fs";
import path from "path";
import { getDatabaseName } from "../lib/mongodb";

// Manually load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const content = fs.readFileSync(envPath, 'utf8');
for (const line of content.split('\n')) {
  if (line.startsWith('MONGODB_URI=')) {
    process.env.MONGODB_URI = line.substring('MONGODB_URI='.length).trim();
  }
}

console.log("MONGODB_URI in process.env:", process.env.MONGODB_URI);
console.log("MONGODB_DB_NAME in process.env:", process.env.MONGODB_DB_NAME);
console.log("Database Name resolved by getDatabaseName():", getDatabaseName());
