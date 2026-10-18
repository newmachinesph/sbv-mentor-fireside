import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { bookings, availabilitySlots, mentorProfiles, users } from "@/server/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/server/auth";
import { createBookingSchema } from "@/lib/validations/booking";
import { sendMail } from "@/server/email";
import { renderBookingConfirmationEmail } from "@/server/email/templates/booking-confirmation";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");

    const conditions = [eq(bookings.userId, session.user.id)];
    if (status === "upcoming" || status === "completed" || status === "cancelled") {
      conditions.push(eq(bookings.status, status));
    }

    const userBookings = await db
      .select({
        id: bookings.id,
        mentorProfileId: bookings.mentorProfileId,
        date: bookings.date,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        topic: bookings.topic,
        description: bookings.description,
        status: bookings.status,
        rating: bookings.rating,
        meetingLink: bookings.meetingLink,
        notes: bookings.notes,
        createdAt: bookings.createdAt,
        mentorName: users.name,
        mentorTitle: mentorProfiles.title,
        mentorCompany: mentorProfiles.company,
        mentorAvatar: users.avatar,
      })
      .from(bookings)
      .innerJoin(mentorProfiles, eq(bookings.mentorProfileId, mentorProfiles.id))
      .innerJoin(users, eq(mentorProfiles.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(bookings.date));

    return NextResponse.json({ bookings: userBookings });
  } catch (error) {
    console.error("GET /api/bookings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Verify mentor profile exists and check self-booking
    const [mentor] = await db
      .select({ id: mentorProfiles.id, userId: mentorProfiles.userId })
      .from(mentorProfiles)
      .where(eq(mentorProfiles.id, data.mentorProfileId))
      .limit(1);

    if (!mentor) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    // Prevent self-booking
    if (mentor.userId === session.user.id) {
      return NextResponse.json({ error: "You cannot book a session with yourself" }, { status: 400 });
    }

    // Verify and atomically mark slot as booked
    const [slot] = await db
      .update(availabilitySlots)
      .set({ booked: true, bookedByUserId: session.user.id })
      .where(
        and(
          eq(availabilitySlots.id, data.availabilitySlotId),
          eq(availabilitySlots.mentorProfileId, data.mentorProfileId),
          eq(availabilitySlots.booked, false)
        )
      )
      .returning();

    if (!slot) {
      return NextResponse.json(
        { error: "Slot is no longer available" },
        { status: 409 }
      );
    }

    // Get mentor name for email
    const [mentorUser] = await db
      .select({ name: users.name })
      .from(mentorProfiles)
      .innerJoin(users, eq(mentorProfiles.userId, users.id))
      .where(eq(mentorProfiles.id, data.mentorProfileId))
      .limit(1);

    // Create booking
    const [newBooking] = await db
      .insert(bookings)
      .values({
        mentorProfileId: data.mentorProfileId,
        userId: session.user.id,
        availabilitySlotId: data.availabilitySlotId,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        topic: data.topic,
        description: data.description,
      })
      .returning();

    // Send confirmation email (non-blocking)
    if (session.user.email) {
      sendMail({
        to: session.user.email,
        subject: "Booking Confirmed — SBV Mentor",
        html: renderBookingConfirmationEmail({
          userName: session.user.name || "there",
          mentorName: mentorUser?.name || "your mentor",
          topic: data.topic,
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          bookingId: newBooking.id,
        }),
      }).catch((err) => console.error("Booking confirmation email failed:", err));
    }

    return NextResponse.json(
      { success: true, booking: newBooking },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/bookings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
