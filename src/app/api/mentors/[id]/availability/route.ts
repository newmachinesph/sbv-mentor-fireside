import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { availabilitySlots, mentorProfiles } from "@/server/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { auth } from "@/server/auth";
import { addAvailabilitySchema } from "@/lib/validations/mentor";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const today = new Date().toISOString().split("T")[0];

    const slots = await db
      .select()
      .from(availabilitySlots)
      .where(
        and(
          eq(availabilitySlots.mentorProfileId, id),
          eq(availabilitySlots.booked, false),
          gte(availabilitySlots.date, today)
        )
      )
      .orderBy(availabilitySlots.date, availabilitySlots.startTime);

    return NextResponse.json({ slots });
  } catch (error) {
    console.error("GET /api/mentors/[id]/availability error:", error);
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

    // Verify mentor exists and user has permission
    const [mentor] = await db
      .select({ id: mentorProfiles.id, userId: mentorProfiles.userId })
      .from(mentorProfiles)
      .where(eq(mentorProfiles.id, id))
      .limit(1);

    if (!mentor) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    const isOwner = mentor.userId === session.user.id;
    const isAdmin = session.user.role === "admin" || session.user.role === "moderator";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = addAvailabilitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const [slot] = await db
      .insert(availabilitySlots)
      .values({
        mentorProfileId: id,
        date: parsed.data.date,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
      })
      .returning();

    return NextResponse.json({ success: true, slot }, { status: 201 });
  } catch (error) {
    console.error("POST /api/mentors/[id]/availability error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = request.nextUrl;
    const slotId = searchParams.get("slotId");

    if (!slotId) {
      return NextResponse.json({ error: "slotId is required" }, { status: 400 });
    }

    // Verify mentor exists and user has permission
    const [mentor] = await db
      .select({ id: mentorProfiles.id, userId: mentorProfiles.userId })
      .from(mentorProfiles)
      .where(eq(mentorProfiles.id, id))
      .limit(1);

    if (!mentor) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    const isOwner = mentor.userId === session.user.id;
    const isAdmin = session.user.role === "admin" || session.user.role === "moderator";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [deleted] = await db
      .delete(availabilitySlots)
      .where(
        and(
          eq(availabilitySlots.id, slotId),
          eq(availabilitySlots.mentorProfileId, id),
          eq(availabilitySlots.booked, false)
        )
      )
      .returning({ id: availabilitySlots.id });

    if (!deleted) {
      return NextResponse.json(
        { error: "Slot not found or already booked" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/mentors/[id]/availability error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
