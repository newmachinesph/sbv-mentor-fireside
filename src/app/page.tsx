import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import {
  ArrowRight,
  Wrench,
  Package,
  Briefcase,
  Rocket,
  Palette,
  DollarSign,
  Star,
  Clock,
  CalendarCheck,
  MessageSquare,
  Users,
  TrendingUp,
} from "lucide-react";
import { db } from "@/server/db";
import { mentorProfiles, bookings } from "@/server/db/schema";
import { count, eq } from "drizzle-orm";

export const revalidate = 300;

const expertiseCategoryDefs = [
  {
    key: "technical",
    icon: Wrench,
    emoji: "🔧",
    label: "Technical",
    description: "Architecture, databases, DevOps, APIs, security, performance",
  },
  {
    key: "product",
    icon: Package,
    emoji: "📦",
    label: "Product",
    description: "Roadmap, feature prioritization, PMF, scoping",
  },
  {
    key: "business",
    icon: Briefcase,
    emoji: "💼",
    label: "Business",
    description: "Revenue models, pricing strategy, legal, operations",
  },
  {
    key: "growth",
    icon: Rocket,
    emoji: "🚀",
    label: "Growth",
    description: "Launch strategy, user acquisition, community, retention",
  },
  {
    key: "design",
    icon: Palette,
    emoji: "🎨",
    label: "Design & Brand",
    description: "Brand strategy, content marketing, social media, storytelling",
  },
  {
    key: "fundraising",
    icon: DollarSign,
    emoji: "💰",
    label: "Fundraising",
    description: "Pitch deck review, investor intros, accelerators, SAFE/equity",
  },
];

const features = [
  {
    icon: Star,
    title: "Smart Matching",
    description:
      "AI-powered matching based on team needs, mentor expertise, and session history.",
  },
  {
    icon: CalendarCheck,
    title: "Easy Booking",
    description:
      "Browse availability, book slots with calendar sync. Automatic timezone handling.",
  },
  {
    icon: Clock,
    title: "30-Min Sessions",
    description:
      "Focused video calls or async Slack threads. The right format for the right question.",
  },
  {
    icon: MessageSquare,
    title: "Session Notes",
    description:
      "Shared notes and action items after every session. Track progress over time.",
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    description:
      "Dashboards track sessions, milestones, and development goals for both sides.",
  },
  {
    icon: Users,
    title: "Unlimited Access",
    description:
      "Teams book as many sessions as mentors have available. No limits, no barriers.",
  },
];

async function getHomeStats() {
  const [allMentors, totalBookingsResult, cancelledBookingsResult] =
    await Promise.all([
      db.select({ expertise: mentorProfiles.expertise }).from(mentorProfiles),
      db.select({ count: count() }).from(bookings),
      db
        .select({ count: count() })
        .from(bookings)
        .where(eq(bookings.status, "cancelled")),
    ]);

  const mentorCount = allMentors.length;

  // Count mentors per expertise category
  const categoryCounts: Record<string, number> = {};
  const allCategories = new Set<string>();
  for (const mentor of allMentors) {
    const expertise = mentor.expertise ?? [];
    for (const cat of expertise) {
      allCategories.add(cat);
      categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
    }
  }

  const totalBookings = totalBookingsResult[0]?.count ?? 0;
  const cancelledBookings = cancelledBookingsResult[0]?.count ?? 0;
  const successRate =
    totalBookings > 0
      ? Math.round(((totalBookings - cancelledBookings) / totalBookings) * 100)
      : 0;

  return {
    mentorCount,
    expertiseAreaCount: allCategories.size,
    successRate,
    categoryCounts,
  };
}

export default async function MentorHomePage() {
  const { mentorCount, expertiseAreaCount, successRate, categoryCounts } =
    await getHomeStats();

  const stats = [
    {
      value: mentorCount > 0 ? `${mentorCount}+` : "0",
      label: "Expert Mentors",
    },
    { value: String(expertiseAreaCount), label: "Expertise Areas" },
    { value: "30min", label: "Session Format" },
    {
      value: successRate > 0 ? `${successRate}%` : "0%",
      label: "Match Success",
    },
  ];

  const expertiseCategories = expertiseCategoryDefs.map((cat) => ({
    ...cat,
    mentorCount: categoryCounts[cat.key] ?? 0,
  }));
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-4">
              SBV Mentor Network
            </Badge>
            <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              The Right Expert.
              <br />
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                At the Right Time.
              </span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Book sessions with renowned experts in tech, product, business,
              growth, design, and fundraising. Specialists on tap for your
              startup journey.
            </p>
            <Button size="lg" asChild>
              <Link href="/mentors">
                Browse Mentors <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b">
        <div className="container mx-auto grid grid-cols-2 gap-0 divide-x md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="px-4 py-8 text-center">
              <p className="text-3xl font-bold md:text-4xl">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Expertise Categories */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Expertise Categories
            </h2>
            <p className="text-muted-foreground">
              Whatever your team needs this week, there&apos;s a mentor for
              that.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {expertiseCategories.map((cat) => (
              <Card key={cat.label} className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="mb-2 text-3xl">{cat.emoji}</div>
                  <CardTitle className="text-lg">{cat.label}</CardTitle>
                  <CardDescription>{cat.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary">
                    {cat.mentorCount} mentor{cat.mentorCount > 1 ? "s" : ""}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-y bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              How It Works
            </h2>
            <p className="text-muted-foreground">
              From browsing to booking to breakthrough — in three simple steps.
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Browse & Match",
                desc: "Search mentors by expertise, check ratings, and find the perfect match for your team's current challenge.",
              },
              {
                step: "2",
                title: "Book a Session",
                desc: "Pick an available time slot, describe your topic, and get a calendar invite with video link automatically.",
              },
              {
                step: "3",
                title: "Learn & Ship",
                desc: "Have your 30-minute session, capture action items, and apply what you learned to ship faster.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                  {item.step}
                </div>
                <h3 className="mb-2 font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Platform Features
            </h2>
            <p className="text-muted-foreground">
              Built for busy builders and generous mentors.
            </p>
          </div>
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <feature.icon className="mb-2 h-6 w-6 text-primary" />
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Ready to Learn from the Best?
            </h2>
            <p className="mb-8 text-muted-foreground">
              Our mentors have built, scaled, and invested in startups across
              Southeast Asia. Book your first session today.
            </p>
            <Button size="lg" asChild>
              <Link href="/mentors">
                Find a Mentor <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
