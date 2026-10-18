"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Star, CalendarCheck, Clock, Users, TrendingUp, ArrowRight, Video, FileText,
  Rocket, Target, Wrench, Package, Briefcase, Palette, DollarSign, Loader2,
} from "lucide-react";

type ExpertiseCategory = "technical" | "product" | "business" | "growth" | "design" | "fundraising";

const expertiseColors: Record<ExpertiseCategory, string> = {
  technical: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  product: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  business: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  growth: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  design: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  fundraising: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
};

const expertiseIcons: Record<ExpertiseCategory, React.ElementType> = {
  technical: Wrench, product: Package, business: Briefcase,
  growth: Rocket, design: Palette, fundraising: DollarSign,
};

interface DashboardData {
  stats: { totalSessions: number; upcomingCount: number; avgRating: number; mentorsConnected: number };
  upcomingSessions: {
    id: string; date: string; startTime: string; endTime: string; topic: string;
    meetingLink: string | null; mentorName: string; mentorTitle: string;
    mentorCompany: string; mentorAvatar: string | null; expertise: string[];
  }[];
  recentNotes: {
    id: string; bookingId: string; content: string; excerpt: string; topic: string;
    date: string; mentorName: string; actionItemsTotal: number; actionItemsCompleted: number;
  }[];
  progress: {
    expertiseCovered: number; expertiseTotal: number; uncoveredExpertise: string[];
    actionItemsTotal: number; actionItemsCompleted: number;
  };
  recommendedMentors: {
    id: string; name: string; title: string; company: string;
    expertise: string[]; rating: number; avatar: string | null;
  }[];
  userName: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

function formatDateRelative(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`;
  return formatDate(dateStr);
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) setData(await res.json());
      } catch (e) { console.error("Failed to fetch dashboard:", e); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return (
    <div className="min-h-screen"><Navbar />
      <div className="container mx-auto flex items-center justify-center px-4 py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    <Footer /></div>
  );

  if (!data) return (
    <div className="min-h-screen"><Navbar />
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="mb-4 text-2xl font-bold">Unable to load dashboard</h1>
        <p className="mb-6 text-muted-foreground">Please try again later.</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    <Footer /></div>
  );

  const overviewStats = [
    { title: "Total Sessions", value: String(data.stats.totalSessions), change: `${data.stats.upcomingCount} upcoming`, icon: CalendarCheck, color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-100 dark:bg-blue-900/50" },
    { title: "Upcoming Sessions", value: String(data.stats.upcomingCount), change: data.upcomingSessions.length > 0 ? `Next: ${formatDate(data.upcomingSessions[0].date)}` : "None scheduled", icon: Clock, color: "text-purple-600 dark:text-purple-400", bgColor: "bg-purple-100 dark:bg-purple-900/50" },
    { title: "Average Rating", value: data.stats.avgRating > 0 ? String(data.stats.avgRating) : "—", change: data.stats.avgRating > 0 ? "Out of 5.0" : "No ratings yet", icon: Star, color: "text-yellow-600 dark:text-yellow-400", bgColor: "bg-yellow-100 dark:bg-yellow-900/50" },
    { title: "Mentors Connected", value: String(data.stats.mentorsConnected), change: `Across ${data.progress.expertiseCovered} areas`, icon: Users, color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-100 dark:bg-emerald-900/50" },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Welcome back</p>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{data.userName}&apos;s Dashboard</h1>
              <p className="mt-1 text-muted-foreground">Track your mentoring sessions, review notes, and find your next mentor.</p>
            </div>
            <Button className="gap-2 self-start" asChild>
              <Link href="/mentors"><CalendarCheck className="h-4 w-4" />Book a Session</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {overviewStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{stat.change}</p>
                    </div>
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bgColor}`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            {/* Upcoming Sessions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2"><Video className="h-5 w-5" />Upcoming Sessions</CardTitle>
                    <CardDescription>Your next mentoring sessions</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-1" asChild>
                    <Link href="/bookings">View All<ArrowRight className="h-3.5 w-3.5" /></Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.upcomingSessions.length === 0 ? (
                  <div className="py-8 text-center">
                    <CalendarCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">No upcoming sessions</p>
                    <Button size="sm" className="mt-3" asChild><Link href="/mentors">Book a Session</Link></Button>
                  </div>
                ) : (
                  data.upcomingSessions.map((session) => {
                    const primaryExpertise = (session.expertise?.[0] || "technical") as ExpertiseCategory;
                    const Icon = expertiseIcons[primaryExpertise] || Wrench;
                    return (
                      <div key={session.id} className="flex flex-col gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10 shrink-0">
                            <AvatarImage src={session.mentorAvatar || undefined} />
                            <AvatarFallback className="text-xs font-semibold">
                              {session.mentorName.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold">{session.mentorName}</p>
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${expertiseColors[primaryExpertise] || ""}`}>
                                <Icon className="h-2.5 w-2.5" />
                                {primaryExpertise.charAt(0).toUpperCase() + primaryExpertise.slice(1)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">{session.mentorTitle}, {session.mentorCompany}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{session.topic}</p>
                            <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><CalendarCheck className="h-3 w-3" />{formatDate(session.date)}</span>
                              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatTime(session.startTime)}</span>
                              <Badge variant="outline" className="text-[10px]">{formatDateRelative(session.date)}</Badge>
                            </div>
                          </div>
                        </div>
                        <Button size="sm" className="shrink-0 gap-1.5 self-start" asChild>
                          <Link href={`/bookings/${session.id}`}><Video className="h-3.5 w-3.5" />Details</Link>
                        </Button>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Recent Session Notes */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Recent Session Notes</CardTitle>
                    <CardDescription>Key takeaways from your latest sessions</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-1" asChild>
                    <Link href="/bookings">All Notes<ArrowRight className="h-3.5 w-3.5" /></Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.recentNotes.length === 0 ? (
                  <div className="py-8 text-center">
                    <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">No session notes yet</p>
                  </div>
                ) : (
                  data.recentNotes.map((note) => (
                    <div key={note.id} className="rounded-lg border p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold">{note.topic}</p>
                          <p className="text-xs text-muted-foreground">with {note.mentorName} on {formatDate(note.date)}</p>
                        </div>
                        <Button variant="outline" size="sm" className="shrink-0 gap-1.5 self-start" asChild>
                          <Link href={`/bookings/${note.bookingId}`}><FileText className="h-3.5 w-3.5" />View</Link>
                        </Button>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{note.excerpt}</p>
                      {note.actionItemsTotal > 0 && (
                        <div className="mt-3 flex items-center gap-3">
                          <div className="flex-1">
                            <div className="mb-1 flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Action Items</span>
                              <span className="font-medium">{note.actionItemsCompleted}/{note.actionItemsTotal}</span>
                            </div>
                            <Progress value={(note.actionItemsCompleted / note.actionItemsTotal) * 100} />
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Recommended Mentors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Target className="h-4 w-4" />Recommended for You</CardTitle>
                <CardDescription>Based on your interests</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.recommendedMentors.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">No recommendations yet. Book some sessions to get personalized suggestions.</p>
                ) : (
                  data.recommendedMentors.map((mentor) => (
                    <div key={mentor.id} className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={mentor.avatar || undefined} />
                          <AvatarFallback className="text-xs font-semibold">
                            {mentor.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">{mentor.name}</p>
                          <p className="text-xs text-muted-foreground">{mentor.title}, {mentor.company}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(mentor.expertise as ExpertiseCategory[]).map((exp) => (
                          <span key={exp} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${expertiseColors[exp] || ""}`}>
                            {exp.charAt(0).toUpperCase() + exp.slice(1)}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-medium">{mentor.rating}</span>
                        </div>
                        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" asChild>
                          <Link href={`/mentors/${mentor.id}`}>Book<ArrowRight className="h-3 w-3" /></Link>
                        </Button>
                      </div>
                      <Separator />
                    </div>
                  ))
                )}
                <Button variant="ghost" size="sm" className="w-full gap-1.5" asChild>
                  <Link href="/mentors">Browse All Mentors<ArrowRight className="h-3.5 w-3.5" /></Link>
                </Button>
              </CardContent>
            </Card>

            {/* Your Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4" />Your Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-muted-foreground">Expertise Areas Covered</span>
                    <span className="font-medium">{data.progress.expertiseCovered} / {data.progress.expertiseTotal}</span>
                  </div>
                  <Progress value={(data.progress.expertiseCovered / data.progress.expertiseTotal) * 100} />
                </div>
                {data.progress.actionItemsTotal > 0 && (
                  <div>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-muted-foreground">Action Items Completed</span>
                      <span className="font-medium">{data.progress.actionItemsCompleted} / {data.progress.actionItemsTotal}</span>
                    </div>
                    <Progress value={(data.progress.actionItemsCompleted / data.progress.actionItemsTotal) * 100} />
                  </div>
                )}
                {data.progress.uncoveredExpertise.length > 0 && (
                  <>
                    <Separator />
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Areas to explore</p>
                      <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                        {data.progress.uncoveredExpertise.map((exp) => {
                          const Icon = expertiseIcons[exp as ExpertiseCategory] || Wrench;
                          return (
                            <span key={exp} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${expertiseColors[exp as ExpertiseCategory] || ""}`}>
                              <Icon className="h-3 w-3" />
                              {exp.charAt(0).toUpperCase() + exp.slice(1)}
                            </span>
                          );
                        })}
                      </div>
                      <Button size="sm" variant="outline" className="mt-3 w-full gap-1.5" asChild>
                        <Link href={`/mentors?filter=${data.progress.uncoveredExpertise[0]}`}>
                          Find {data.progress.uncoveredExpertise[0].charAt(0).toUpperCase() + data.progress.uncoveredExpertise[0].slice(1)} Mentors
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="h-auto flex-col gap-1.5 py-3" asChild>
                  <Link href="/mentors"><Users className="h-5 w-5" /><span className="text-[11px]">Browse Mentors</span></Link>
                </Button>
                <Button variant="outline" size="sm" className="h-auto flex-col gap-1.5 py-3" asChild>
                  <Link href="/bookings"><CalendarCheck className="h-5 w-5" /><span className="text-[11px]">My Bookings</span></Link>
                </Button>
                <Button variant="outline" size="sm" className="h-auto flex-col gap-1.5 py-3" asChild>
                  <Link href="/bookings"><FileText className="h-5 w-5" /><span className="text-[11px]">Session Notes</span></Link>
                </Button>
                <Button variant="outline" size="sm" className="h-auto flex-col gap-1.5 py-3" asChild>
                  <Link href="https://z1.sbv.one"><Rocket className="h-5 w-5" /><span className="text-[11px]">Z1 Forge</span></Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
