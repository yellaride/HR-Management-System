import { Resend } from "resend";

// Initialize Resend securely using the environment key
export const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Generates a clean, professional, and responsive welcome HTML template.
 */
function getWelcomeEmailTemplate(name: string, email: string, temporaryPassword: string): string {
  const portalUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const currentYear = new Date().getFullYear();

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to the Team</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9f8fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f9f8fc; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="600px" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e0e8; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
              
              <!-- Branding Header Banner -->
              <tr>
                <td style="background-color: #7c3aed; padding: 40px 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">Welcome to the Team!</h1>
                  <p style="color: #ede9fe; margin: 8px 0 0 0; font-size: 14px;">Your official workspace account has been configured.</p>
                </td>
              </tr>

              <!-- Body Message -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="color: #181124; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">Hello <strong>${name}</strong>,</p>
                  <p style="color: #534a60; font-size: 14px; line-height: 22px; margin: 0 0 24px 0;">
                    We are thrilled to welcome you. Your official profile is registered in our directories. Below are your temporary credentials to log in and access your workspace dashboard.
                  </p>

                  <!-- Credentials Block -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f9f8fc; border-radius: 12px; margin-bottom: 28px; border: 1px solid #e2e0e8;">
                    <tr>
                      <td style="padding: 20px;">
                        <table width="100%" border="0" cellspacing="0" cellpadding="8">
                          <tr>
                            <td width="35%" style="color: #8e859c; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; padding-bottom: 4px;">Portal URL</td>
                            <td width="65%" style="color: #181124; font-size: 14px; font-weight: 600; padding-bottom: 4px;">
                              <a href="${portalUrl}" style="color: #7c3aed; text-decoration: none;">Go to Portal</a>
                            </td>
                          </tr>
                          <tr>
                            <td style="color: #8e859c; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; padding-top: 4px; padding-bottom: 4px;">Username</td>
                            <td style="color: #181124; font-size: 14px; font-weight: 600; padding-top: 4px; padding-bottom: 4px;">${email}</td>
                          </tr>
                          <tr>
                            <td style="color: #8e859c; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; padding-top: 4px;">Temp Password</td>
                            <td style="color: #7c3aed; font-size: 14px; font-weight: 700; font-family: Courier, monospace; letter-spacing: 0.05em; padding-top: 4px;">${temporaryPassword}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Login Action Button -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 30px; text-align: center;">
                    <tr>
                      <td align="center">
                        <a href="${portalUrl}" target="_blank" style="display: inline-block; background-color: #7c3aed; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 30px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.25);">
                          Log In to Workspace
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- Security Protocol Alert -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top: 1px solid #e2e0e8; padding-top: 24px;">
                    <tr>
                      <td>
                        <p style="color: #7c3aed; font-size: 13px; line-height: 20px; font-weight: 600; margin: 0 0 6px 0;">🔑 Security Protocol:</p>
                        <p style="color: #534a60; font-size: 13px; line-height: 20px; margin: 0;">
                          This temporary password is only valid for your initial log in. For data protection compliance, please set a new personalized password immediately upon accessing your account dashboard.
                        </p>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9f8fc; padding: 24px 30px; border-top: 1px solid #e2e0e8; text-align: center;">
                  <p style="color: #8e859c; font-size: 11px; line-height: 18px; margin: 0 0 4px 0;">This email is auto-generated by your internal HR platform. Please do not reply directly to this message.</p>
                  <p style="color: #8e859c; font-size: 11px; line-height: 18px; margin: 0;">&copy; ${currentYear} Internal Corporate Directory.</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Dispatches a welcome email to the specified recipient safely.
 */
export async function sendWelcomeEmail(name: string, email: string, tempPassword: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.error("Resend API Key (RESEND_API_KEY) is missing. Email skipped.");
    return false;
  }

  try {
    // In production, configure your verified domain address, e.g., "HR Team <hr@yourdomain.com>"
    const fromAddress = process.env.NODE_ENV === "production"
      ? "HR Team <hr@yourverifieddomain.com>"
      : "onboarding@resend.dev";

    const htmlContent = getWelcomeEmailTemplate(name, email, tempPassword);

    const emailResponse = await resend.emails.send({
      from: fromAddress,
      to: [email],
      subject: "Welcome to the Team - Your Workspace Account Credentials",
      html: htmlContent,
    });

    if (emailResponse.error) {
      console.error("Resend delivery failed:", emailResponse.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("An unexpected error occurred during email delivery:", error);
    return false;
  }
}