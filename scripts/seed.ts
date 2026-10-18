import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/server/db/schema";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  console.log("Seeding database...");

  // Clear existing data (order matters for FK constraints)
  await db.delete(schema.sessionNotes);
  await db.delete(schema.bookings);
  await db.delete(schema.availabilitySlots);
  await db.delete(schema.mentorProfiles);
  await db.delete(schema.users);

  const seedPassword = process.env.SEED_PASSWORD;
  if (!seedPassword) throw new Error("Set SEED_PASSWORD to the password for the demo accounts");
  const passwordHash = await bcrypt.hash(seedPassword, 12);

  // ============ USERS ============
  const adminUser = {
    id: nanoid(),
    name: "Lino Velosa",
    email: "admin@example.com",
    passwordHash,
    role: "admin" as const,
    avatar: null,
    bio: "Platform administrator for SBV Mentor.",
  };

  const mentorUsers = [
    {
      id: nanoid(),
      name: "Sarah Chen",
      email: "sarah.chen@example.com",
      passwordHash,
      role: "mentor" as const,
      avatar: null,
      bio: "Former CTO at a YC-backed startup. 15+ years in software engineering.",
    },
    {
      id: nanoid(),
      name: "Marcus Johnson",
      email: "marcus.j@example.com",
      passwordHash,
      role: "mentor" as const,
      avatar: null,
      bio: "Product leader who has shipped products used by millions.",
    },
    {
      id: nanoid(),
      name: "Aisha Patel",
      email: "aisha.patel@example.com",
      passwordHash,
      role: "mentor" as const,
      avatar: null,
      bio: "Growth marketing expert who scaled 3 startups from 0 to 1M users.",
    },
    {
      id: nanoid(),
      name: "David Kim",
      email: "david.kim@example.com",
      passwordHash,
      role: "mentor" as const,
      avatar: null,
      bio: "Serial entrepreneur and angel investor with 4 successful exits.",
    },
    {
      id: nanoid(),
      name: "Elena Rodriguez",
      email: "elena.r@example.com",
      passwordHash,
      role: "mentor" as const,
      avatar: null,
      bio: "UX/UI designer who has led design teams at Fortune 500 companies.",
    },
    {
      id: nanoid(),
      name: "James Wright",
      email: "james.wright@example.com",
      passwordHash,
      role: "mentor" as const,
      avatar: null,
      bio: "Raised $50M+ across multiple funding rounds. Partner at Seed Capital.",
    },
    {
      id: nanoid(),
      name: "Priya Sharma",
      email: "priya.sharma@example.com",
      passwordHash,
      role: "mentor" as const,
      avatar: null,
      bio: "Full-stack engineer specializing in scalable SaaS architectures.",
    },
    {
      id: nanoid(),
      name: "Tom Anderson",
      email: "tom.anderson@example.com",
      passwordHash,
      role: "mentor" as const,
      avatar: null,
      bio: "Business strategist with 20 years of consulting experience at McKinsey.",
    },
  ];

  const memberUsers = [
    {
      id: nanoid(),
      name: "Alex Rivera",
      email: "alex@example.com",
      passwordHash,
      role: "member" as const,
      avatar: null,
      bio: "Building an AI-powered content platform.",
    },
    {
      id: nanoid(),
      name: "Jordan Lee",
      email: "jordan@example.com",
      passwordHash,
      role: "member" as const,
      avatar: null,
      bio: "Working on a fintech solution for freelancers.",
    },
    {
      id: nanoid(),
      name: "Sam Taylor",
      email: "sam@example.com",
      passwordHash,
      role: "member" as const,
      avatar: null,
      bio: "Building a marketplace for sustainable products.",
    },
  ];

  const allUsers = [adminUser, ...mentorUsers, ...memberUsers];
  await db.insert(schema.users).values(allUsers);
  console.log(`Inserted ${allUsers.length} users`);

  // ============ MENTOR PROFILES ============
  const mentorProfilesData = [
    {
      id: nanoid(),
      userId: mentorUsers[0].id,
      title: "CTO & Technical Advisor",
      company: "TechVentures",
      bio: mentorUsers[0].bio,
      expertise: ["technical"] as string[],
      skills: ["System Architecture", "Cloud Infrastructure", "Team Leadership", "React", "Node.js", "AWS"],
      rating: 4.9,
      totalSessions: 47,
      featured: true,
      socialLinks: { linkedin: "https://linkedin.com/in/sarahchen", twitter: "https://x.com/sarahchen" },
      location: "San Francisco, CA",
      languages: ["English", "Mandarin"],
      sessionFormat: "30-min Video Call",
    },
    {
      id: nanoid(),
      userId: mentorUsers[1].id,
      title: "VP of Product",
      company: "ScaleUp Inc.",
      bio: mentorUsers[1].bio,
      expertise: ["product"] as string[],
      skills: ["Product Strategy", "User Research", "Roadmapping", "Agile", "Analytics", "A/B Testing"],
      rating: 4.8,
      totalSessions: 35,
      featured: true,
      socialLinks: { linkedin: "https://linkedin.com/in/marcusjohnson" },
      location: "New York, NY",
      languages: ["English"],
      sessionFormat: "30-min Video Call",
    },
    {
      id: nanoid(),
      userId: mentorUsers[2].id,
      title: "Head of Growth",
      company: "GrowthLab",
      bio: mentorUsers[2].bio,
      expertise: ["growth"] as string[],
      skills: ["SEO", "Paid Acquisition", "Content Marketing", "Conversion Optimization", "Analytics"],
      rating: 4.7,
      totalSessions: 29,
      featured: true,
      socialLinks: { linkedin: "https://linkedin.com/in/aishapatel", website: "https://aishapatel.com" },
      location: "London, UK",
      languages: ["English", "Hindi"],
      sessionFormat: "30-min Video Call",
    },
    {
      id: nanoid(),
      userId: mentorUsers[3].id,
      title: "Founder & Angel Investor",
      company: "Kim Ventures",
      bio: mentorUsers[3].bio,
      expertise: ["business", "fundraising"] as string[],
      skills: ["Business Strategy", "Fundraising", "Pitch Coaching", "Market Validation", "Financial Modeling"],
      rating: 4.9,
      totalSessions: 52,
      featured: true,
      socialLinks: { linkedin: "https://linkedin.com/in/davidkim", twitter: "https://x.com/davidkim" },
      location: "Austin, TX",
      languages: ["English", "Korean"],
      sessionFormat: "30-min Video Call",
    },
    {
      id: nanoid(),
      userId: mentorUsers[4].id,
      title: "Design Director",
      company: "DesignForward",
      bio: mentorUsers[4].bio,
      expertise: ["design"] as string[],
      skills: ["UI/UX Design", "Design Systems", "Figma", "User Research", "Prototyping", "Brand Design"],
      rating: 4.6,
      totalSessions: 22,
      featured: false,
      socialLinks: { linkedin: "https://linkedin.com/in/elenarodriguez", website: "https://elenarodriguez.design" },
      location: "Barcelona, Spain",
      languages: ["English", "Spanish"],
      sessionFormat: "30-min Video Call",
    },
    {
      id: nanoid(),
      userId: mentorUsers[5].id,
      title: "Partner",
      company: "Seed Capital Fund",
      bio: mentorUsers[5].bio,
      expertise: ["fundraising"] as string[],
      skills: ["Fundraising Strategy", "Investor Relations", "Due Diligence", "Term Sheets", "Cap Tables"],
      rating: 4.8,
      totalSessions: 41,
      featured: true,
      socialLinks: { linkedin: "https://linkedin.com/in/jameswright" },
      location: "Boston, MA",
      languages: ["English"],
      sessionFormat: "45-min Video Call",
    },
    {
      id: nanoid(),
      userId: mentorUsers[6].id,
      title: "Senior Staff Engineer",
      company: "CloudScale",
      bio: mentorUsers[6].bio,
      expertise: ["technical"] as string[],
      skills: ["TypeScript", "PostgreSQL", "Kubernetes", "Microservices", "CI/CD", "Performance Optimization"],
      rating: 4.7,
      totalSessions: 18,
      featured: false,
      socialLinks: { linkedin: "https://linkedin.com/in/priyasharma", website: "https://priyasharma.dev" },
      location: "Bangalore, India",
      languages: ["English", "Hindi", "Tamil"],
      sessionFormat: "30-min Video Call",
    },
    {
      id: nanoid(),
      userId: mentorUsers[7].id,
      title: "Management Consultant",
      company: "McKinsey & Company (former)",
      bio: mentorUsers[7].bio,
      expertise: ["business"] as string[],
      skills: ["Strategy", "Market Analysis", "Operations", "Financial Planning", "Go-to-Market"],
      rating: 4.5,
      totalSessions: 31,
      featured: false,
      socialLinks: { linkedin: "https://linkedin.com/in/tomanderson" },
      location: "Chicago, IL",
      languages: ["English"],
      sessionFormat: "30-min Video Call",
    },
  ];

  await db.insert(schema.mentorProfiles).values(mentorProfilesData);
  console.log(`Inserted ${mentorProfilesData.length} mentor profiles`);

  // ============ AVAILABILITY SLOTS ============
  const slotsData: (typeof schema.availabilitySlots.$inferInsert)[] = [];
  const today = new Date();

  for (const profile of mentorProfilesData) {
    // Add slots for the next 14 days
    for (let dayOffset = 1; dayOffset <= 14; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() + dayOffset);

      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      const dateStr = date.toISOString().split("T")[0];
      const slotTimes = [
        { start: "09:00:00", end: "09:30:00" },
        { start: "10:00:00", end: "10:30:00" },
        { start: "14:00:00", end: "14:30:00" },
        { start: "15:00:00", end: "15:30:00" },
      ];

      // Each mentor gets 2-4 slots per day
      const numSlots = 2 + Math.floor(Math.random() * 3);
      const selectedSlots = slotTimes.slice(0, numSlots);

      for (const slot of selectedSlots) {
        slotsData.push({
          id: nanoid(),
          mentorProfileId: profile.id,
          date: dateStr,
          startTime: slot.start,
          endTime: slot.end,
          booked: false,
          bookedByUserId: null,
        });
      }
    }
  }

  await db.insert(schema.availabilitySlots).values(slotsData);
  console.log(`Inserted ${slotsData.length} availability slots`);

  // ============ BOOKINGS ============
  // Create some completed and upcoming bookings for demo members
  const bookingsData: (typeof schema.bookings.$inferInsert)[] = [];

  // Past completed bookings for Alex
  const pastDates = [
    { date: "2026-02-10", start: "09:00:00", end: "09:30:00" },
    { date: "2026-02-17", start: "14:00:00", end: "14:30:00" },
    { date: "2026-02-24", start: "10:00:00", end: "10:30:00" },
  ];

  for (let i = 0; i < 3; i++) {
    bookingsData.push({
      id: nanoid(),
      mentorProfileId: mentorProfilesData[i].id,
      userId: memberUsers[0].id,
      date: pastDates[i].date,
      startTime: pastDates[i].start,
      endTime: pastDates[i].end,
      topic: ["Building a scalable API architecture", "Product-market fit validation", "Growth hacking strategies"][i],
      description: "Discussion on key challenges and next steps.",
      status: "completed",
      rating: [5, 4, 5][i],
      meetingLink: "https://meet.google.com/abc-defg-hij",
    });
  }

  // Upcoming bookings
  const futureDate1 = new Date(today);
  futureDate1.setDate(futureDate1.getDate() + 3);
  const futureDate2 = new Date(today);
  futureDate2.setDate(futureDate2.getDate() + 7);

  bookingsData.push({
    id: nanoid(),
    mentorProfileId: mentorProfilesData[3].id,
    userId: memberUsers[0].id,
    date: futureDate1.toISOString().split("T")[0],
    startTime: "10:00:00",
    endTime: "10:30:00",
    topic: "Fundraising pitch deck review",
    description: "Review my Series A pitch deck and get feedback.",
    status: "upcoming",
    meetingLink: "https://meet.google.com/xyz-abcd-efg",
  });

  bookingsData.push({
    id: nanoid(),
    mentorProfileId: mentorProfilesData[0].id,
    userId: memberUsers[1].id,
    date: futureDate2.toISOString().split("T")[0],
    startTime: "14:00:00",
    endTime: "14:30:00",
    topic: "Technical architecture review for fintech app",
    description: "Need advice on payment processing architecture.",
    status: "upcoming",
    meetingLink: "https://meet.google.com/lmn-opqr-stu",
  });

  await db.insert(schema.bookings).values(bookingsData);
  console.log(`Inserted ${bookingsData.length} bookings`);

  // ============ SESSION NOTES ============
  const notesData = [
    {
      id: nanoid(),
      bookingId: bookingsData[0].id!,
      content:
        "Discussed microservices vs monolith for our current stage. Sarah recommended starting monolithic and extracting services as we scale. Key insight: premature optimization is the root of all evil. Focus on shipping fast first.",
      actionItems: [
        { text: "Set up a modular monolith with clear domain boundaries", completed: true },
        { text: "Add database connection pooling with PgBouncer", completed: true },
        { text: "Create a tech debt tracking board in Linear", completed: false },
        { text: "Research Redis caching for hot paths", completed: false },
      ],
    },
    {
      id: nanoid(),
      bookingId: bookingsData[1].id!,
      content:
        "Marcus helped validate our PMF hypothesis. We need to run 20 more customer interviews before committing to the pivot. The key metric should be weekly active usage, not signups.",
      actionItems: [
        { text: "Schedule 20 customer discovery interviews", completed: true },
        { text: "Define WAU metric and set up tracking", completed: false },
        { text: "Create a competitive analysis spreadsheet", completed: true },
        { text: "Draft revised value proposition based on feedback", completed: false },
      ],
    },
    {
      id: nanoid(),
      bookingId: bookingsData[2].id!,
      content:
        "Aisha shared her framework for viral loops. Our product has natural sharing mechanics we haven't explored. Recommended focusing on referral program before paid acquisition.",
      actionItems: [
        { text: "Design referral reward system (give $10, get $10)", completed: false },
        { text: "Implement sharing feature for key content", completed: false },
        { text: "Set up UTM tracking for all channels", completed: true },
      ],
    },
  ];

  await db.insert(schema.sessionNotes).values(notesData);
  console.log(`Inserted ${notesData.length} session notes`);

  console.log("\nSeed completed successfully!");
  console.log("\nDemo accounts (password: value of SEED_PASSWORD):");
  console.log("  Admin:  admin@example.com");
  console.log("  Member: alex@example.com");
  console.log("  Member: jordan@example.com");
  console.log("  Member: sam@example.com");
  console.log("  Mentor: sarah.chen@example.com");
  console.log("  Mentor: marcus.j@example.com");
  console.log("  ... and 6 more mentors");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
