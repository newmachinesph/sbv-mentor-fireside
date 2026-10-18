"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Star, CalendarCheck, Clock, Video, ArrowLeft, CheckCircle, Circle, FileText, MessageSquare, User, ExternalLink, Loader2 } from "lucide-react";

type BookingStatus = "upcoming" | "completed" | "cancelled";

interface BookingDetail {
  id: string; mentorProfileId: string; userId: string; date: string; startTime: string; endTime: string;
  topic: string; description: string | null; status: BookingStatus; notes: string | null;
  rating: number | null; meetingLink: string | null; mentorName: string; mentorTitle: string;
  mentorCompany: string; mentorAvatar: string | null;
}

interface SessionNote {
  id: string; content: string; actionItems: { text: string; completed: boolean }[]; createdAt: string;
}

const statusConfig: Record<BookingStatus, { label: string; color: string; dotColor: string }> = {
  upcoming: { label: "Upcoming", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300", dotColor: "bg-blue-500" },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300", dotColor: "bg-emerald-500" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300", dotColor: "bg-red-500" },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

export default function BookingDetailPage() {
  const params = useParams();
  const bookingId = params.id as string;
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [sessionNote, setSessionNote] = useState<SessionNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/bookings/${bookingId}`);
        if (!res.ok) { setNotFound(true); return; }
        const data = await res.json();
        setBooking(data.booking);
        setSessionNote(data.sessionNotes || null);
      } catch { setNotFound(true); }
      finally { setLoading(false); }
    })();
  }, [bookingId]);

  async function handleCancel() {
    if (!booking) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "cancelled" }) });
      if (res.ok) setBooking((prev) => prev ? { ...prev, status: "cancelled" } : null);
    } catch (e) { console.error("Failed to cancel:", e); }
    finally { setCancelling(false); }
  }

  async function toggleActionItem(index: number) {
    if (!sessionNote) return;
    const updated = sessionNote.actionItems.map((item, i) => i === index ? { ...item, completed: !item.completed } : item);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/notes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ actionItems: updated }) });
      if (res.ok) setSessionNote((prev) => prev ? { ...prev, actionItems: updated } : null);
    } catch (e) { console.error("Failed to update:", e); }
  }

  if (loading) return (<div className="min-h-screen"><Navbar /><div className="container mx-auto flex items-center justify-center px-4 py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div><Footer /></div>);

  if (notFound || !booking) return (
    <div className="min-h-screen"><Navbar /><div className="container mx-auto px-4 py-20 text-center">
      <h1 className="mb-4 text-2xl font-bold">Booking Not Found</h1>
      <p className="mb-6 text-muted-foreground">The booking you are looking for does not exist.</p>
      <Button asChild><Link href="/bookings">View All Bookings</Link></Button>
    </div><Footer /></div>
  );

  const status = statusConfig[booking.status];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" className="mb-6 gap-1.5" asChild>
          <Link href="/bookings"><ArrowLeft className="h-4 w-4" />Back to Bookings</Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-3">
                  <CardTitle className="text-xl md:text-2xl">{booking.topic}</CardTitle>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status.color}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${status.dotColor}`} />{status.label}
                  </span>
                </div>
                {booking.description && <CardDescription>{booking.description}</CardDescription>}
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <CalendarCheck className="h-5 w-5 text-primary" />
                    <div><p className="text-xs text-muted-foreground">Date</p><p className="text-sm font-medium">{formatDate(booking.date)}</p></div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <div><p className="text-xs text-muted-foreground">Time</p><p className="text-sm font-medium">{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</p></div>
                  </div>
                </div>
                {booking.status === "upcoming" && (
                  <div className="mt-4 flex gap-3">
                    {booking.meetingLink && (
                      <Button className="gap-2" asChild>
                        <a href={booking.meetingLink} target="_blank" rel="noopener noreferrer"><Video className="h-4 w-4" />Join Session<ExternalLink className="h-3 w-3" /></a>
                      </Button>
                    )}
                    <Button variant="outline" className="gap-2 text-destructive hover:text-destructive" onClick={handleCancel} disabled={cancelling}>
                      {cancelling && <Loader2 className="h-4 w-4 animate-spin" />}Cancel Session
                    </Button>
                  </div>
                )}
                {booking.status === "completed" && booking.rating && (
                  <div className="mt-4 rounded-lg bg-muted/50 p-4">
                    <p className="mb-2 text-sm font-medium">Your Rating</p>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < booking.rating! ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
                      ))}
                      <span className="ml-1 text-sm font-medium">{booking.rating}/5</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {sessionNote && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Session Notes</CardTitle>
                  <CardDescription>Captured on {new Date(sessionNote.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-lg bg-muted/30 p-4">
                    <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{sessionNote.content}</p>
                  </div>
                  {sessionNote.actionItems.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="mb-3 flex items-center gap-2 font-semibold"><CheckCircle className="h-4 w-4 text-primary" />Action Items</h3>
                        <div className="space-y-2">
                          {sessionNote.actionItems.map((item, index) => (
                            <button key={index} onClick={() => toggleActionItem(index)}
                              className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 ${item.completed ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950" : ""}`}>
                              {item.completed ? <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
                              <span className={`text-sm ${item.completed ? "text-emerald-800 line-through dark:text-emerald-300" : ""}`}>{item.text}</span>
                            </button>
                          ))}
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground">{sessionNote.actionItems.filter((a) => a.completed).length} of {sessionNote.actionItems.length} completed</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {!sessionNote && booking.status === "completed" && (
              <Card><CardContent className="py-12 text-center">
                <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
                <h3 className="mb-2 text-lg font-semibold">No session notes yet</h3>
                <p className="text-sm text-muted-foreground">Notes will be added after the session.</p>
              </CardContent></Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Mentor</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={booking.mentorAvatar || undefined} />
                    <AvatarFallback className="font-semibold">{booking.mentorName.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{booking.mentorName}</p>
                    <p className="text-xs text-muted-foreground">{booking.mentorTitle}</p>
                    <p className="text-xs font-medium text-muted-foreground">{booking.mentorCompany}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="mt-4 w-full gap-1.5" asChild>
                  <Link href={`/mentors/${booking.mentorProfileId}`}><User className="h-3.5 w-3.5" />View Profile</Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2" asChild><Link href={`/mentors/${booking.mentorProfileId}`}><CalendarCheck className="h-3.5 w-3.5" />Book Another Session</Link></Button>
                <Button variant="outline" size="sm" className="w-full justify-start gap-2" asChild><Link href="/bookings"><FileText className="h-3.5 w-3.5" />View All Bookings</Link></Button>
                <Button variant="outline" size="sm" className="w-full justify-start gap-2" asChild><Link href="/dashboard"><MessageSquare className="h-3.5 w-3.5" />Go to Dashboard</Link></Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
