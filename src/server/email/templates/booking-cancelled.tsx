interface BookingCancelledEmailProps {
  userName: string;
  mentorName: string;
  topic: string;
  date: string;
  startTime: string;
}

export function renderBookingCancelledEmail({
  userName,
  mentorName,
  topic,
  date,
  startTime,
}: BookingCancelledEmailProps): string {
  const formattedDate = new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  function formatTime(timeStr: string): string {
    const [h, m] = timeStr.split(":");
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Session Cancelled</title>
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background-color:#ffffff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Session Cancelled</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">Hi ${userName}, your session has been cancelled.</p>

      <div style="background-color:#fef2f2;border-radius:8px;padding:20px;margin-bottom:24px;border-left:4px solid #ef4444;">
        <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#111827;">${topic}</p>
        <p style="margin:0;font-size:13px;color:#6b7280;">with ${mentorName} on ${formattedDate} at ${formatTime(startTime)}</p>
      </div>

      <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.6;">
        The time slot has been freed up. You can book a new session with ${mentorName} or browse other available mentors.
      </p>

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
