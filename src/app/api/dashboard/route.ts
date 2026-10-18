import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { bookings, mentorProfiles, users, sessionNotes } from "@/server/db/schema";
import { eq, and, desc, sql, count } from "drizzle-orm";
import { auth } from "@/server/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Parallelize independent queries
    const [
      [totalResult],
      [upcomingResult],
      [ratingResult],
      [mentorsResult],
      upcomingSessions,
      recentNotes,
      expertiseRows,
      bookedMentorIds,
      allFeatured,
    ] = await Promise.all([
      db
        .select({ count: count() })
        .from(bookings)
        .where(and(eq(bookings.userId, userId), eq(bookings.status, "completed"))),

      db
        .select({ count: count() })
        .from(bookings)
        .where(and(eq(bookings.userId, userId), eq(bookings.status, "upcoming"))),

      db
        .select({
          avg: sql<number>`coalesce(avg(${bookings.rating}), 0)`,
        })
        .from(bookings)
        .where(
          and(
            eq(bookings.userId, userId),
            sql`${bookings.rating} is not null`
          )
        ),

      db
        .select({
          count: sql<number>`count(distinct ${bookings.mentorProfileId})`,
        })
        .from(bookings)
        .where(eq(bookings.userId, userId)),

      db
        .select({
          id: bookings.id,
          date: bookings.date,
          startTime: bookings.startTime,
          endTime: bookings.endTime,
          topic: bookings.topic,
          meetingLink: bookings.meetingLink,
          mentorName: users.name,
          mentorTitle: mentorProfiles.title,
          mentorCompany: mentorProfiles.company,
          mentorAvatar: users.avatar,
          expertise: mentorProfiles.expertise,
        })
        .from(bookings)
        .innerJoin(mentorProfiles, eq(bookings.mentorProfileId, mentorProfiles.id))
        .innerJoin(users, eq(mentorProfiles.userId, users.id))
        .where(and(eq(bookings.userId, userId), eq(bookings.status, "upcoming")))
        .orderBy(bookings.date, bookings.startTime)
        .limit(3),

      db
        .select({
          id: sessionNotes.id,
          bookingId: sessionNotes.bookingId,
          content: sessionNotes.content,
          actionItems: sessionNotes.actionItems,
          createdAt: sessionNotes.createdAt,
          topic: bookings.topic,
          date: bookings.date,
          mentorName: users.name,
        })
        .from(sessionNotes)
        .innerJoin(bookings, eq(sessionNotes.bookingId, bookings.id))
        .innerJoin(mentorProfiles, eq(bookings.mentorProfileId, mentorProfiles.id))
        .innerJoin(users, eq(mentorProfiles.userId, users.id))
        .where(eq(bookings.userId, userId))
        .orderBy(desc(sessionNotes.createdAt))
        .limit(3),

      db
        .select({ expertise: mentorProfiles.expertise })
        .from(bookings)
        .innerJoin(mentorProfiles, eq(bookings.mentorProfileId, mentorProfiles.id))
        .where(eq(bookings.userId, userId)),

      db
        .select({ mentorProfileId: bookings.mentorProfileId })
        .from(bookings)
        .where(eq(bookings.userId, userId)),

      db
        .select({
          id: mentorProfiles.id,
          name: users.name,
          title: mentorProfiles.title,
          company: mentorProfiles.company,
          expertise: mentorProfiles.expertise,
          rating: mentorProfiles.rating,
          avatar: users.avatar,
        })
        .from(mentorProfiles)
        .innerJoin(users, eq(mentorProfiles.userId, users.id))
        .where(eq(mentorProfiles.featured, true))
        .orderBy(desc(mentorProfiles.rating))
        .limit(10),
    ]);

    const totalSessions = totalResult?.count ?? 0;
    const upcomingCount = upcomingResult?.count ?? 0;
    const avgRating = ratingResult?.avg ? Math.round(ratingResult.avg * 10) / 10 : 0;
    const mentorsConnected = mentorsResult?.count ?? 0;

    const coveredExpertise = new Set<string>();
    for (const row of expertiseRows) {
      if (Array.isArray(row.expertise)) {
        for (const e of row.expertise) coveredExpertise.add(e);
      }
    }

    const allExpertise = ["technical", "product", "business", "growth", "design", "fundraising"];
    const uncoveredExpertise = allExpertise.filter((e) => !coveredExpertise.has(e));

    let totalActionItems = 0;
    let completedActionItems = 0;
    for (const note of recentNotes) {
      if (Array.isArray(note.actionItems)) {
        totalActionItems += note.actionItems.length;
        completedActionItems += note.actionItems.filter((a) => a.completed).length;
      }
    }

    const bookedIds = new Set(bookedMentorIds.map((b) => b.mentorProfileId));
    const recommendedMentors = allFeatured
      .filter((m) => !bookedIds.has(m.id))
      .slice(0, 3);

    return NextResponse.json({
      stats: {
        totalSessions,
        upcomingCount,
        avgRating,
        mentorsConnected,
      },
      upcomingSessions,
      recentNotes: recentNotes.map((note) => ({
        ...note,
        excerpt: note.content.substring(0, 200),
        actionItemsTotal: Array.isArray(note.actionItems) ? note.actionItems.length : 0,
        actionItemsCompleted: Array.isArray(note.actionItems)
          ? note.actionItems.filter((a) => a.completed).length
          : 0,
      })),
      progress: {
        expertiseCovered: coveredExpertise.size,
        expertiseTotal: allExpertise.length,
        uncoveredExpertise,
        actionItemsTotal: totalActionItems,
        actionItemsCompleted: completedActionItems,
      },
      recommendedMentors,
      userName: session.user.name || "User",
    });
  } catch (error) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
