import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { sessionNotes, bookings } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/server/auth";
import { createSessionNoteSchema, updateActionItemSchema } from "@/lib/validations/session-notes";

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

    // Verify booking exists and user has access
    const [booking] = await db
      .select({ userId: bookings.userId })
      .from(bookings)
      .where(eq(bookings.id, id))
      .limit(1);

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const isOwner = booking.userId === session.user.id;
    const isAdmin = session.user.role === "admin" || session.user.role === "moderator";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const notes = await db
      .select()
      .from(sessionNotes)
      .where(eq(sessionNotes.bookingId, id));

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("GET /api/bookings/[id]/notes error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify booking exists and belongs to user
    const [booking] = await db
      .select({ id: bookings.id, userId: bookings.userId })
      .from(bookings)
      .where(eq(bookings.id, id))
      .limit(1);

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const isOwner = booking.userId === session.user.id;
    const isAdmin = session.user.role === "admin" || session.user.role === "moderator";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Check if we're updating action items on existing note
    const [existingNote] = await db
      .select()
      .from(sessionNotes)
      .where(eq(sessionNotes.bookingId, id))
      .limit(1);

    if (existingNote) {
      // Update existing note (action items toggle)
      const actionParsed = updateActionItemSchema.safeParse(body);
      if (actionParsed.success) {
        const [updated] = await db
          .update(sessionNotes)
          .set({ actionItems: actionParsed.data.actionItems })
          .where(eq(sessionNotes.id, existingNote.id))
          .returning();

        return NextResponse.json({ success: true, note: updated });
      }

      // Or update content
      const contentParsed = createSessionNoteSchema.safeParse(body);
      if (contentParsed.success) {
        const [updated] = await db
          .update(sessionNotes)
          .set({
            content: contentParsed.data.content,
            actionItems: contentParsed.data.actionItems,
          })
          .where(eq(sessionNotes.id, existingNote.id))
          .returning();

        return NextResponse.json({ success: true, note: updated });
      }

      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Create new note
    const parsed = createSessionNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const [note] = await db
      .insert(sessionNotes)
      .values({
        bookingId: id,
        content: parsed.data.content,
        actionItems: parsed.data.actionItems,
      })
      .returning();

    return NextResponse.json({ success: true, note }, { status: 201 });
  } catch (error) {
    console.error("POST /api/bookings/[id]/notes error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
