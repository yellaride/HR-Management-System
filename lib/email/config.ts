/** HR-system Resend sender — isolated from other products (e.g. YalaRide). */
export function getResendFromAddress(): string {
  const configured = process.env.RESEND_FROM_EMAIL?.trim();
  if (configured) {
    return configured;
  }

  // Resend sandbox: only delivers to the account owner's verified email.
  return "HR System <onboarding@resend.dev>";
}

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}
