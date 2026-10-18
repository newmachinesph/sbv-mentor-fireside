"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Star, CalendarCheck, Clock, Video, X, FileText, MessageSquare, ArrowRight, Loader2,
} from "lucide-react";

type BookingStatus = "upcoming" | "completed" | "cancelled";

interface BookingItem {
  id: string;
  mentorProfileId: string;
  date: string;
  startTime: string;
  endTime: string;
  topic: string;
  status: BookingStatus;
  rating: number | null;
  meetingLink: string | null;
  mentorName: string;
  mentorTitle: string;
  mentorCompany: string;
  mentorAvatar: string | null;
}

const statusConfig: Record<BookingStatus, { label: string; color: string; dotColor: string }> = {
  upcoming: { label: "Upcoming", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300", dotColor: "bg-blue-500" },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300", dotColor: "bg-emerald-500" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300", dotColor: "bg-red-500" },
};

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

function BookingCard({ booking, onCancel }: { booking: BookingItem; onCancel: (id: string) => void }) {
  const status = statusConfig[booking.status];
  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={booking.mentorAvatar || undefined} />
              <AvatarFallback className="text-xs font-semibold">
                {booking.mentorName.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{booking.mentorName}</h3>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${status.color}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${status.dotColor}`} />
                  {status.label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{booking.mentorTitle}, {booking.mentorCompany}</p>
              <p className="mt-2 text-sm">{booking.topic}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><CalendarCheck className="h-3 w-3" />{formatDateShort(booking.date)}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
              </div>
              {booking.status === "completed" && booking.rating && (
                <div className="mt-2 flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i < booking.rating! ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
                  ))}
                  <span className="ml-1 text-xs text-muted-foreground">Your rating</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex shrink-0 gap-2 sm:flex-col">
            {booking.status === "upcoming" && (
              <>
                {booking.meetingLink && (
                  <Button size="sm" className="gap-1.5" asChild>
                    <a href={booking.meetingLink} target="_blank" rel="noopener noreferrer"><Video className="h-3.5 w-3.5" />Join</a>
                  </Button>
                )}
                <Button size="sm" variant="outline" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => onCancel(booking.id)}>
                  <X className="h-3.5 w-3.5" />Cancel
                </Button>
              </>
            )}
            {booking.status === "completed" && (
              <>
                <Button size="sm" variant="outline" className="gap-1.5" asChild>
                  <Link href={`/bookings/${booking.id}`}><FileText className="h-3.5 w-3.5" />View Notes</Link>
                </Button>
                <Button size="sm" variant="ghost" className="gap-1.5" asChild>
                  <Link href={`/mentors/${booking.mentorProfileId}`}><MessageSquare className="h-3.5 w-3.5" />Book Again</Link>
                </Button>
              </>
            )}
            {booking.status === "cancelled" && (
              <Button size="sm" variant="outline" className="gap-1.5" asChild>
                <Link href={`/mentors/${booking.mentorProfileId}`}><ArrowRight className="h-3.5 w-3.5" />Rebook</Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [allBookings, setAllBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/bookings");
        if (res.ok) { const data = await res.json(); setAllBookings(data.bookings); }
      } catch (e) { console.error("Failed to fetch bookings:", e); }
      finally { setLoading(false); }
    })();
  }, []);

  async function handleCancel(bookingId: string) {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "cancelled" }) });
      if (res.ok) setAllBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" as BookingStatus } : b)));
    } catch (e) { console.error("Failed to cancel:", e); }
  }

  const upcoming = allBookings.filter((b) => b.status === "upcoming");
  const completed = allBookings.filter((b) => b.status === "completed");
  const cancelled = allBookings.filter((b) => b.status === "cancelled");

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 text-3xl font-bold tracking-tight md:text-5xl">My Bookings</h1>
            <p className="mb-6 text-lg text-muted-foreground">Manage your mentoring sessions, view notes, and track your progress.</p>
            {!loading && (
              <div className="flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-800"><span className="text-sm font-bold">{upcoming.length}</span></div><span className="text-muted-foreground">Upcoming</span></div>
                <div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-800"><span className="text-sm font-bold">{completed.length}</span></div><span className="text-muted-foreground">Completed</span></div>
                <div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-800"><span className="text-sm font-bold">{cancelled.length}</span></div><span className="text-muted-foreground">Cancelled</span></div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="w-full max-w-md">
                <TabsTrigger value="upcoming" className="flex-1 gap-1.5"><Video className="h-3.5 w-3.5" />Upcoming ({upcoming.length})</TabsTrigger>
                <TabsTrigger value="completed" className="flex-1 gap-1.5"><CalendarCheck className="h-3.5 w-3.5" />Completed ({completed.length})</TabsTrigger>
                <TabsTrigger value="cancelled" className="flex-1 gap-1.5"><X className="h-3.5 w-3.5" />Cancelled ({cancelled.length})</TabsTrigger>
              </TabsList>
              {(["upcoming", "completed", "cancelled"] as BookingStatus[]).map((tab) => {
                const list = tab === "upcoming" ? upcoming : tab === "completed" ? completed : cancelled;
                return (
                  <TabsContent key={tab} value={tab}>
                    {list.length > 0 ? (
                      <div className="space-y-4">{list.map((b) => <BookingCard key={b.id} booking={b} onCancel={handleCancel} />)}</div>
                    ) : (
                      <Card><CardContent className="py-12 text-center">
                        <CalendarCheck className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
                        <h3 className="mb-2 text-lg font-semibold">{tab === "upcoming" ? "No upcoming sessions" : tab === "completed" ? "No completed sessions yet" : "No cancelled sessions"}</h3>
                        <p className="mb-4 text-sm text-muted-foreground">{tab === "upcoming" ? "Book a session with a mentor to get started." : tab === "completed" ? "Your completed sessions will appear here." : "Good news -- no cancellations so far!"}</p>
                        {tab === "upcoming" && <Button asChild><Link href="/mentors">Browse Mentors</Link></Button>}
                      </CardContent></Card>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
