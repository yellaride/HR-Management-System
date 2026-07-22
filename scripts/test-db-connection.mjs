/**
 * Quick check: can this project reach MongoDB with MONGODB_URI from .env?
 * Run: npm run db:test
 */

import fs from "fs";
import path from "path";
import mongoose from "mongoose";

function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("❌ MONGODB_URI missing in .env");
  process.exit(1);
}

try {
  await mongoose.connect(uri, { bufferCommands: false });
  const dbName = mongoose.connection.db?.databaseName;
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log(`✅ MongoDB connection OK`);
  console.log(`   Database: ${dbName}`);
  console.log(`   Collections: ${collections.length === 0 ? "(empty — fresh database)" : collections.map((c) => c.name).join(", ")}`);
  await mongoose.disconnect();
} catch (err) {
  console.error("❌ Connection failed:", err.message || err);
  process.exit(1);
}
