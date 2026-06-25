const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

console.log("MONGODB_URI:", process.env.MONGODB_URI);
console.log("MONGODB_DB_NAME:", process.env.MONGODB_DB_NAME);
console.log("System Environment MONGODB_DB_NAME:", process.env.MONGODB_DB_NAME || "not set in process.env");
