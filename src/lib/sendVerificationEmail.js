import resend from "@/lib/resend";

export async function sendVerificationEmail({ email, name, token }) {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL;

  const verifyUrl = `${appUrl}/verify-email?token=${token}`;

  const { data, error } = await resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: "Verify your email",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Email Verification</h2>
        <p>Hello ${name || "User"},</p>
        <p>Thanks for registering. Click the button below to verify your email:</p>
        <p>
          <a href="${verifyUrl}" style="display:inline-block;padding:10px 16px;background:#111;color:#fff;text-decoration:none;border-radius:6px;">
            Verify Email
          </a>
        </p>
        <p>Or open this link:</p>
        <p>${verifyUrl}</p>
        <p>This link will expire in 1 hour.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message || "Failed to send verification email");
  }

  return data;
}