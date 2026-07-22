import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY?.trim();

if (!apiKey) {
  console.warn("RESEND_API_KEY is not set. Resend client will be unusable until configured.");
}

export const resend = new Resend(apiKey);