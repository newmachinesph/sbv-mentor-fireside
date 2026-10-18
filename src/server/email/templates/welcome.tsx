interface WelcomeEmailProps {
  name: string;
}

export function renderWelcomeEmail({ name }: WelcomeEmailProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to SBV Mentor</title>
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background-color:#ffffff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;">Welcome to SBV Mentor</h1>
      <p style="margin:0 0 24px;font-size:16px;color:#6b7280;">Hi ${name}, we're excited to have you!</p>
      <p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.6;">
        You now have access to our community of experienced mentors across various fields including technology, product, business, growth, design, and fundraising.
      </p>
      <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.6;">
        Here's how to get started:
      </p>
      <ol style="margin:0 0 24px;padding-left:20px;font-size:14px;color:#374151;line-height:1.8;">
        <li>Browse our mentor directory to find the right match</li>
        <li>Check available time slots and book a session</li>
        <li>Join the video call at the scheduled time</li>
        <li>Review session notes and track your action items</li>
      </ol>
      <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/mentors"
        style="display:inline-block;padding:12px 24px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
        Browse Mentors
      </a>
      <hr style="margin:32px 0;border:none;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">
        SBV Mentor — Connecting startups with experienced mentors.
      </p>
    </div>
  </div>
</body>
</html>`;
}
