import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { mentorProfiles, users } from "@/server/db/schema";
import { eq, ilike, or, sql } from "drizzle-orm";
import { auth } from "@/server/auth";
import { createMentorSchema } from "@/lib/validations/mentor";

function escapeLike(str: string): string {
  return str.replace(/[%_\\]/g, "\\$&");
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const expertise = searchParams.get("expertise");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12")));
    const featured = searchParams.get("featured");

    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const conditions = [];

    if (expertise && expertise !== "all") {
      // JSON array contains check for PostgreSQL
      conditions.push(sql`${mentorProfiles.expertise}::jsonb @> ${JSON.stringify([expertise])}::jsonb`);
    }

    if (featured === "true") {
      conditions.push(eq(mentorProfiles.featured, true));
    }

    if (search) {
      const searchPattern = `%${escapeLike(search)}%`;
      conditions.push(
        or(
          ilike(users.name, searchPattern),
          ilike(mentorProfiles.title, searchPattern),
          ilike(mentorProfiles.company, searchPattern),
          ilike(mentorProfiles.bio, searchPattern),
        )!
      );
    }

    const whereClause = conditions.length > 0
      ? sql`${sql.join(conditions, sql` AND `)}`
      : undefined;

    // Query mentors with user info
    const mentorsQuery = db
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
      .innerJoin(users, eq(mentorProfiles.userId, users.id));

    // Apply where conditions
    const baseQuery = whereClause
      ? mentorsQuery.where(whereClause)
      : mentorsQuery;

    const [mentorsList, countResult] = await Promise.all([
      baseQuery.limit(limit).offset(offset).orderBy(sql`${mentorProfiles.featured} DESC, ${mentorProfiles.rating} DESC`),
      db
        .select({ count: sql<number>`count(*)` })
        .from(mentorProfiles)
        .innerJoin(users, eq(mentorProfiles.userId, users.id))
        .where(whereClause),
    ]);

    const totalCount = Number(countResult[0]?.count || 0);

    return NextResponse.json({
      mentors: mentorsList,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error("GET /api/mentors error:", error);
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
    if (session.user.role !== "admin" && session.user.role !== "moderator") {
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

    // Verify user exists
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, data.userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if mentor profile already exists for this user
    const [existing] = await db
      .select({ id: mentorProfiles.id })
      .from(mentorProfiles)
      .where(eq(mentorProfiles.userId, data.userId))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "Mentor profile already exists for this user" },
        { status: 409 }
      );
    }

    // Update user role to mentor
    await db
      .update(users)
      .set({ role: "mentor" })
      .where(eq(users.id, data.userId));

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
        languages: data.languages || [],
        sessionFormat: data.sessionFormat || "30-min Video Call",
      })
      .returning();

    return NextResponse.json(
      { success: true, mentorProfile: newProfile },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/mentors error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
