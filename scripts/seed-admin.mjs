/**
 * One-time script: create the first admin login for the HR portal.
 *
 * Usage:
 *   1. Add to .env (temporarily):
 *        SEED_ADMIN_EMAIL=admin@syncup.com
 *        SEED_ADMIN_PASSWORD=YourPortalLoginPassword
 *   2. Run: npm run seed:admin
 *   3. Remove SEED_ADMIN_PASSWORD from .env after success.
 *
 * Note: SEED_ADMIN_PASSWORD is the app login password — NOT the MongoDB Atlas DB user password.
 */

import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

const MONGODB_URI = process.env.MONGODB_URI;
const email = (process.env.SEED_ADMIN_EMAIL || "admin@syncup.com").toLowerCase().trim();
const password = process.env.SEED_ADMIN_PASSWORD;
const name = process.env.SEED_ADMIN_NAME || "Admin";

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is missing in .env");
  process.exit(1);
}

if (!password || password.length < 8) {
  console.error("❌ Set SEED_ADMIN_PASSWORD in .env (min 8 characters) — this is the portal login password.");
  process.exit(1);
}

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: false },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    role: { type: String, enum: ["employee", "admin"], default: "employee" },
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI, { bufferCommands: false });

  const dbName = mongoose.connection.db?.databaseName;
  console.log(`✅ Connected to database: ${dbName}`);

  const existing = await User.findOne({ email });

  if (existing) {
    let changed = false;

    if (existing.role !== "admin") {
      existing.role = "admin";
      changed = true;
    }

    if (process.env.SEED_ADMIN_RESET_PASSWORD === "true") {
      existing.password = await bcrypt.hash(password, 10);
      existing.tokenVersion = (existing.tokenVersion || 0) + 1;
      changed = true;
      console.log("🔑 Password reset for existing user.");
    }

    if (changed) {
      await existing.save();
      console.log(`✅ Updated admin user: ${email}`);
    } else {
      console.log(`ℹ️  Admin already exists: ${email}`);
      console.log("   To reset password, run with SEED_ADMIN_RESET_PASSWORD=true");
    }
  } else {
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
      tokenVersion: 0,
    });

    console.log(`✅ Admin user created: ${email}`);
    console.log(`   Name: ${name}`);
    console.log(`   Role: admin`);
  }

  await mongoose.disconnect();
  console.log("Done. You can now sign in at http://localhost:3000");
}

main().catch((err) => {
  console.error("❌ Seed failed:", err.message || err);
  process.exit(1);
});
