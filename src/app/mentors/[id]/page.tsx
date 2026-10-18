"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Star,
  Users,
  CalendarCheck,
  Clock,
  Linkedin,
  Twitter,
  Globe,
  ArrowLeft,
  CheckCircle,
  MapPin,
  Wrench,
  Package,
  Briefcase,
  Rocket,
  Palette,
  DollarSign,
  Loader2,
  LogIn,
} from "lucide-react";

type ExpertiseCategory =
  | "technical"
  | "product"
  | "business"
  | "growth"
  | "design"
  | "fundraising";

interface MentorDetail {
  id: string;
  userId: string;
  name: string;
  title: string;
  company: string;
  avatar: string | null;
  bio: string;
  expertise: ExpertiseCategory[];
  skills: string[];
  rating: number;
  totalSessions: number;
  featured: boolean;
  socialLinks: { linkedin?: string; twitter?: string; website?: string };
  location: string | null;
  languages: string[] | null;
  sessionFormat: string | null;
}

interface AvailabilitySlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

const expertiseColors: Record<ExpertiseCategory, string> = {
  technical: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  product:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  business:
    "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  growth:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  design: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  fundraising:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
};

const expertiseIcons: Record<ExpertiseCategory, React.ElementType> = {
  technical: Wrench,
  product: Package,
  business: Briefcase,
  growth: Rocket,
  design: Palette,
  fundraising: DollarSign,
};

function StarRating({ rating, size = "md" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "h-5 w-5" : size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${sizeClass} ${
            i < Math.floor(rating)
              ? "fill-yellow-400 text-yellow-400"
              : i < rating
                ? "fill-yellow-400/50 text-yellow-400"
                : "text-muted-foreground/30"
          }`}
        />
      ))}
      <span className={`ml-1 font-medium ${size === "lg" ? "text-lg" : "text-sm"}`}>
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

export default function MentorProfilePage() {
  const params = useParams();
  const { data: session } = useSession();
  const mentorId = params.id as string;

  const [mentor, setMentor] = useState<MentorDetail | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    async function fetchMentor() {
      try {
        const res = await fetch(`/api/mentors/${mentorId}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        setMentor(data.mentor);
        setSlots(data.availabilitySlots || []);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    fetchMentor();
  }, [mentorId]);

  // Group slots by date
  const slotsByDate = slots.reduce<Record<string, AvailabilitySlot[]>>((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {});
  const availableDates = Object.keys(slotsByDate).sort();

  async function handleBooking() {
    if (!selectedSlot || !topic.trim()) return;
    setBooking(true);
    setBookingError("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentorProfileId: mentorId,
          availabilitySlotId: selectedSlot.id,
          date: selectedSlot.date,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          topic: topic.trim(),
          description: description.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setBookingError(data.error || "Failed to book session");
        return;
      }

      setBookingSuccess(true);
      setSlots((prev) => prev.filter((s) => s.id !== selectedSlot.id));
      setSelectedSlot(null);
    } catch {
      setBookingError("Something went wrong. Please try again.");
    } finally {
      setBooking(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto flex items-center justify-center px-4 py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (notFound || !mentor) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="mb-4 text-2xl font-bold">Mentor Not Found</h1>
          <p className="mb-6 text-muted-foreground">
            The mentor you are looking for does not exist.
          </p>
          <Button asChild>
            <Link href="/mentors">Browse All Mentors</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Back Link */}
        <Button variant="ghost" size="sm" className="mb-6 gap-1.5" asChild>
          <Link href="/mentors">
            <ArrowLeft className="h-4 w-4" />
            Back to Mentors
          </Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column: Profile */}
          <div className="space-y-6 lg:col-span-2">
            {/* Profile Header */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-6 sm:flex-row">
                  <Avatar className="h-24 w-24 shrink-0">
                    <AvatarImage src={mentor.avatar || undefined} alt={mentor.name} />
                    <AvatarFallback className="text-2xl font-bold">
                      {mentor.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold md:text-3xl">
                          {mentor.name}
                        </h1>
                        {mentor.featured && (
                          <Badge variant="secondary">Featured</Badge>
                        )}
                      </div>
                      <p className="text-lg text-muted-foreground">
                        {mentor.title}
                      </p>
                      <p className="font-medium">{mentor.company}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      {mentor.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {mentor.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {mentor.sessionFormat || "30-min Video Call"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {mentor.totalSessions} sessions
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <StarRating rating={mentor.rating} size="md" />
                      {mentor.languages && mentor.languages.length > 0 && (
                        <>
                          <Separator orientation="vertical" className="h-5" />
                          <span className="text-sm text-muted-foreground">
                            Languages: {mentor.languages.join(", ")}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Social Links */}
                    <div className="flex gap-2">
                      {mentor.socialLinks?.linkedin && (
                        <Button variant="outline" size="icon" asChild>
                          <a href={mentor.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn profile">
                            <Linkedin className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {mentor.socialLinks?.twitter && (
                        <Button variant="outline" size="icon" asChild>
                          <a href={mentor.socialLinks.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter profile">
                            <Twitter className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {mentor.socialLinks?.website && (
                        <Button variant="outline" size="icon" asChild>
                          <a href={mentor.socialLinks.website} target="_blank" rel="noopener noreferrer" aria-label="Personal website">
                            <Globe className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bio */}
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="leading-relaxed text-muted-foreground">
                  {mentor.bio}
                </p>
              </CardContent>
            </Card>

            {/* Expertise & Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Expertise & Skills</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-2 text-sm font-medium text-muted-foreground">
                    Expertise Areas
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(mentor.expertise as ExpertiseCategory[]).map((exp) => {
                      const Icon = expertiseIcons[exp];
                      return (
                        <span
                          key={exp}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${expertiseColors[exp]}`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {exp.charAt(0).toUpperCase() + exp.slice(1)}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="mb-2 text-sm font-medium text-muted-foreground">
                    Skills
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(mentor.skills as string[]).map((skill) => (
                      <Badge key={skill} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Booking */}
          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5" />
                  Book a Session
                </CardTitle>
                <CardDescription>
                  Select an available time slot for your session
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!session?.user ? (
                  <div className="space-y-3 text-center">
                    <p className="text-sm text-muted-foreground">
                      Sign in to book a session with {mentor.name}
                    </p>
                    <Button asChild className="w-full">
                      <Link href={`/login?callbackUrl=/mentors/${mentor.id}`}>
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign In to Book
                      </Link>
                    </Button>
                  </div>
                ) : bookingSuccess ? (
                  <div className="space-y-3 text-center">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                    <h3 className="font-semibold">Session Booked!</h3>
                    <p className="text-sm text-muted-foreground">
                      Your session has been confirmed. Check your bookings for details.
                    </p>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/bookings">View My Bookings</Link>
                    </Button>
                  </div>
                ) : availableDates.length === 0 ? (
                  <div className="rounded-lg bg-muted/50 p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      No available time slots at the moment. Check back later!
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Slot Selection */}
                    <div className="space-y-3">
                      {availableDates.map((date) => (
                        <div key={date}>
                          <p className="mb-2 text-sm font-medium">{formatDate(date)}</p>
                          <div className="grid grid-cols-2 gap-2">
                            {slotsByDate[date].map((slot) => (
                              <Button
                                key={slot.id}
                                variant={selectedSlot?.id === slot.id ? "default" : "outline"}
                                size="sm"
                                className="text-xs"
                                onClick={() => setSelectedSlot(slot)}
                              >
                                <Clock className="mr-1 h-3 w-3" />
                                {formatTime(slot.startTime)}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Topic Input */}
                    {selectedSlot && (
                      <div className="space-y-3">
                        <Separator />
                        <div className="space-y-2">
                          <Label htmlFor="topic">Session Topic *</Label>
                          <Textarea
                            id="topic"
                            placeholder="What would you like to discuss?"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            rows={2}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Additional Details</Label>
                          <Textarea
                            id="description"
                            placeholder="Any specific questions or context..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                          />
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Booking Summary */}
                    {selectedSlot ? (
                      <div className="space-y-3">
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="text-xs font-medium text-muted-foreground">
                            Session Summary
                          </p>
                          <div className="mt-2 space-y-1 text-sm">
                            <p className="flex items-center gap-2">
                              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                              <span className="font-medium">{mentor.name}</span>
                            </p>
                            <p className="flex items-center gap-2">
                              <CalendarCheck className="h-3.5 w-3.5 text-primary" />
                              {formatDate(selectedSlot.date)}
                            </p>
                            <p className="flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5 text-primary" />
                              {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
                            </p>
                          </div>
                        </div>

                        {bookingError && (
                          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                            {bookingError}
                          </div>
                        )}

                        <Button
                          className="w-full"
                          size="lg"
                          onClick={handleBooking}
                          disabled={booking || !topic.trim()}
                        >
                          {booking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          <CalendarCheck className="mr-2 h-4 w-4" />
                          Confirm Booking
                        </Button>
                      </div>
                    ) : (
                      <div className="rounded-lg bg-muted/50 p-4 text-center">
                        <p className="text-sm text-muted-foreground">
                          Select a time slot to book your session
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
