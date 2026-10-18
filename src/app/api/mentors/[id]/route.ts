import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { mentorProfiles, users, availabilitySlots } from "@/server/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { auth } from "@/server/auth";
import { updateMentorSchema } from "@/lib/validations/mentor";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [mentor] = await db
      .select({
        id: mentorProfiles.id,
        userId: mentorProfiles.userId,
        title: mentorProfiles.title,
        company: mentorProfiles.company,
        bio: mentorProfiles.bio,
        expertise: mentorProfiles.expertise,
        skills: mentorProfiles.skills,
        rating: mentorProfiles.rating,
        totalSessions: mentorProfiles.totalSessions,
        featured: mentorProfiles.featured,
        socialLinks: mentorProfiles.socialLinks,
        location: mentorProfiles.location,
        languages: mentorProfiles.languages,
        sessionFormat: mentorProfiles.sessionFormat,
        name: users.name,
        avatar: users.avatar,
      })
      .from(mentorProfiles)
      .innerJoin(users, eq(mentorProfiles.userId, users.id))
      .where(eq(mentorProfiles.id, id))
      .limit(1);

    if (!mentor) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    // Get future availability slots (not booked)
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

    return NextResponse.json({ mentor, availabilitySlots: slots });
  } catch (error) {
    console.error("GET /api/mentors/[id] error:", error);
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

    // Check mentor exists and user has permission
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
    const parsed = updateMentorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(mentorProfiles)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(mentorProfiles.id, id))
      .returning();

    return NextResponse.json({ success: true, mentorProfile: updated });
  } catch (error) {
    console.error("PUT /api/mentors/[id] error:", error);
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
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const [deleted] = await db
      .delete(mentorProfiles)
      .where(eq(mentorProfiles.id, id))
      .returning({ id: mentorProfiles.id, userId: mentorProfiles.userId });

    if (!deleted) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    // Reset user role to member
    await db
      .update(users)
      .set({ role: "member", updatedAt: new Date() })
      .where(eq(users.id, deleted.userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/mentors/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
