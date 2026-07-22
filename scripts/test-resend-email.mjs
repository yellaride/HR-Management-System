/**
 * Send a test email via Resend using .env credentials.
 *
 * Usage:
 *   npm run test:email
 *   TEST_EMAIL=you@example.com npm run test:email
 */

import fs from "fs";
import path from "path";
import { Resend } from "resend";

function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim().replace(/\r$/, "");
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

function getFromAddress() {
  const configured = process.env.RESEND_FROM_EMAIL?.trim();
  if (configured) return configured;
  return "HR System <onboarding@resend.dev>";
}

loadEnvFile();

const apiKey = process.env.RESEND_API_KEY?.trim();
const from = getFromAddress();
const to = process.env.TEST_EMAIL?.trim() || process.env.SEED_ADMIN_EMAIL?.trim();

if (!apiKey) {
  console.error("❌ RESEND_API_KEY is missing in .env");
  process.exit(1);
}

if (!to) {
  console.error("❌ Set TEST_EMAIL or SEED_ADMIN_EMAIL in .env / command");
  process.exit(1);
}

console.log("Sending Resend test email...");
console.log("  From:", from);
console.log("  To:  ", to);

const resend = new Resend(apiKey);

try {
  const result = await resend.emails.send({
    from,
    to: [to],
    subject: "HR System — Resend test email",
    html: `
      <p>This is a test email from the HR Management System.</p>
      <p>If you received this, Resend is configured correctly.</p>
    `,
  });

  if (result.error) {
    console.error("❌ Resend rejected the email:");
    console.error(JSON.stringify(result.error, null, 2));
    process.exit(1);
  }

  console.log("✅ Email sent successfully");
  console.log("   Message ID:", result.data?.id ?? "(none)");
  console.log("   Check inbox/spam for:", to);
} catch (error) {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
}
