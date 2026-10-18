interface BookingConfirmationEmailProps {
  userName: string;
  mentorName: string;
  topic: string;
  date: string;
  startTime: string;
  endTime: string;
  bookingId: string;
}

export function renderBookingConfirmationEmail({
  userName,
  mentorName,
  topic,
  date,
  startTime,
  endTime,
  bookingId,
}: BookingConfirmationEmailProps): string {
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
  <title>Booking Confirmed</title>
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background-color:#ffffff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-block;padding:8px 16px;background-color:#dcfce7;border-radius:20px;font-size:13px;font-weight:600;color:#166534;">
          ✓ Booking Confirmed
        </div>
      </div>
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;text-align:center;">Session Booked Successfully</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;text-align:center;">Hi ${userName}, your mentoring session is confirmed.</p>

      <div style="background-color:#f9fafb;border-radius:8px;padding:20px;margin-bottom:24px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#6b7280;vertical-align:top;">Mentor</td>
            <td style="padding:8px 0;font-size:14px;color:#111827;font-weight:600;text-align:right;">${mentorName}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#6b7280;vertical-align:top;">Topic</td>
            <td style="padding:8px 0;font-size:14px;color:#111827;text-align:right;">${topic}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#6b7280;">Date</td>
            <td style="padding:8px 0;font-size:14px;color:#111827;text-align:right;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#6b7280;">Time</td>
            <td style="padding:8px 0;font-size:14px;color:#111827;text-align:right;">${formatTime(startTime)} - ${formatTime(endTime)}</td>
          </tr>
        </table>
      </div>

      <div style="text-align:center;">
        <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/bookings/${bookingId}"
          style="display:inline-block;padding:12px 24px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
          View Booking Details
        </a>
      </div>

      <hr style="margin:32px 0;border:none;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
        SBV Mentor — Connecting startups with experienced mentors.
      </p>
    </div>
  </div>
</body>
</html>`;
}
