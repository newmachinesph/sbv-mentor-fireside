import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { bookings, mentorProfiles, users, sessionNotes, availabilitySlots } from "@/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/server/auth";
import { updateBookingSchema } from "@/lib/validations/booking";
import { sendMail } from "@/server/email";
import { renderBookingCancelledEmail } from "@/server/email/templates/booking-cancelled";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [booking] = await db
      .select({
        id: bookings.id,
        mentorProfileId: bookings.mentorProfileId,
        userId: bookings.userId,
        date: bookings.date,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        topic: bookings.topic,
        description: bookings.description,
        status: bookings.status,
        rating: bookings.rating,
        notes: bookings.notes,
        meetingLink: bookings.meetingLink,
        createdAt: bookings.createdAt,
        mentorName: users.name,
        mentorTitle: mentorProfiles.title,
        mentorCompany: mentorProfiles.company,
        mentorAvatar: users.avatar,
      })
      .from(bookings)
      .innerJoin(mentorProfiles, eq(bookings.mentorProfileId, mentorProfiles.id))
      .innerJoin(users, eq(mentorProfiles.userId, users.id))
      .where(eq(bookings.id, id))
      .limit(1);

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Only the booking owner or admin can view
    const isOwner = booking.userId === session.user.id;
    const isAdmin = session.user.role === "admin" || session.user.role === "moderator";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get session notes
    const notes = await db
      .select()
      .from(sessionNotes)
      .where(eq(sessionNotes.bookingId, id))
      .limit(1);

    return NextResponse.json({
      booking,
      sessionNotes: notes[0] || null,
    });
  } catch (error) {
    console.error("GET /api/bookings/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get existing booking with mentor info for email
    const [existing] = await db
      .select({
        id: bookings.id,
        userId: bookings.userId,
        availabilitySlotId: bookings.availabilitySlotId,
        status: bookings.status,
        topic: bookings.topic,
        date: bookings.date,
        startTime: bookings.startTime,
        mentorName: users.name,
      })
      .from(bookings)
      .innerJoin(mentorProfiles, eq(bookings.mentorProfileId, mentorProfiles.id))
      .innerJoin(users, eq(mentorProfiles.userId, users.id))
      .where(eq(bookings.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const isOwner = existing.userId === session.user.id;
    const isAdmin = session.user.role === "admin" || session.user.role === "moderator";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updateData = parsed.data;

    // Validate status transitions
    if (updateData.status) {
      const validTransitions: Record<string, string[]> = {
        upcoming: ["completed", "cancelled"],
        completed: [],
        cancelled: [],
      };
      if (!validTransitions[existing.status]?.includes(updateData.status)) {
        return NextResponse.json(
          { error: `Cannot transition from '${existing.status}' to '${updateData.status}'` },
          { status: 400 }
        );
      }
    }

    // If cancelling, free the availability slot
    if (updateData.status === "cancelled" && existing.status === "upcoming") {
      if (existing.availabilitySlotId) {
        await db
          .update(availabilitySlots)
          .set({ booked: false, bookedByUserId: null })
          .where(eq(availabilitySlots.id, existing.availabilitySlotId));
      }
    }

    const [updated] = await db
      .update(bookings)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();

    // If completing with a rating, update mentor stats
    if (updateData.status === "completed" && updateData.rating) {
      const mentorProfileId = existing.availabilitySlotId
        ? (await db.select({ mpId: bookings.mentorProfileId }).from(bookings).where(eq(bookings.id, id)).limit(1))[0]?.mpId
        : null;
      if (mentorProfileId) {
        await db
          .update(mentorProfiles)
          .set({
            totalSessions: sql`${mentorProfiles.totalSessions} + 1`,
            rating: sql`(${mentorProfiles.rating} * ${mentorProfiles.totalSessions} + ${updateData.rating}) / (${mentorProfiles.totalSessions} + 1)`,
          })
          .where(eq(mentorProfiles.id, mentorProfileId));
      }
    }

    // Send cancellation email (non-blocking)
    if (updateData.status === "cancelled" && session.user.email) {
      sendMail({
        to: session.user.email,
        subject: "Session Cancelled — SBV Mentor",
        html: renderBookingCancelledEmail({
          userName: session.user.name || "there",
          mentorName: existing.mentorName || "your mentor",
          topic: existing.topic,
          date: existing.date,
          startTime: existing.startTime,
        }),
      }).catch((err) => console.error("Cancellation email failed:", err));
    }

    return NextResponse.json({ success: true, booking: updated });
  } catch (error) {
    console.error("PUT /api/bookings/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // Get booking to find slot before deleting
    const [booking] = await db
      .select({ id: bookings.id, availabilitySlotId: bookings.availabilitySlotId })
      .from(bookings)
      .where(eq(bookings.id, id))
      .limit(1);

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Free the availability slot
    if (booking.availabilitySlotId) {
      await db
        .update(availabilitySlots)
        .set({ booked: false, bookedByUserId: null })
        .where(eq(availabilitySlots.id, booking.availabilitySlotId));
    }

    await db.delete(bookings).where(eq(bookings.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/bookings/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
