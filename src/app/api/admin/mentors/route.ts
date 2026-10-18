import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { mentorProfiles, users } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/server/auth";
import { createMentorSchema } from "@/lib/validations/mentor";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== "admin" && session.user.role !== "moderator")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allMentors = await db
      .select({
        id: mentorProfiles.id,
        userId: mentorProfiles.userId,
        title: mentorProfiles.title,
        company: mentorProfiles.company,
        expertise: mentorProfiles.expertise,
        rating: mentorProfiles.rating,
        totalSessions: mentorProfiles.totalSessions,
        featured: mentorProfiles.featured,
        createdAt: mentorProfiles.createdAt,
        userName: users.name,
        userEmail: users.email,
        userAvatar: users.avatar,
      })
      .from(mentorProfiles)
      .innerJoin(users, eq(mentorProfiles.userId, users.id))
      .orderBy(desc(mentorProfiles.createdAt));

    return NextResponse.json({ mentors: allMentors });
  } catch (error) {
    console.error("GET /api/admin/mentors error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createMentorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check user exists and doesn't already have a mentor profile
    const [user] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, data.userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [existingProfile] = await db
      .select({ id: mentorProfiles.id })
      .from(mentorProfiles)
      .where(eq(mentorProfiles.userId, data.userId))
      .limit(1);

    if (existingProfile) {
      return NextResponse.json({ error: "User already has a mentor profile" }, { status: 409 });
    }

    // Create mentor profile
    const [newProfile] = await db
      .insert(mentorProfiles)
      .values({
        userId: data.userId,
        title: data.title,
        company: data.company,
        bio: data.bio,
        expertise: data.expertise,
        skills: data.skills,
        featured: data.featured,
        socialLinks: data.socialLinks || {},
        location: data.location,
        languages: data.languages,
        sessionFormat: data.sessionFormat,
      })
      .returning();

    // Update user role to mentor
    await db
      .update(users)
      .set({ role: "mentor", updatedAt: new Date() })
      .where(eq(users.id, data.userId));

    return NextResponse.json(
      { success: true, mentorProfile: newProfile },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/mentors error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
