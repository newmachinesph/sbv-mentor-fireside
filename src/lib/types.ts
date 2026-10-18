// =============================================================================
// SBV Mentor — Shared TypeScript Types
// SBV Mentor (mentor.sbv.one)
// =============================================================================

export type UserRole = "member" | "mentor" | "admin" | "moderator";

export type ExpertiseCategory =
  | "technical"
  | "product"
  | "business"
  | "growth"
  | "design"
  | "fundraising";

export type BookingStatus = "upcoming" | "completed" | "cancelled";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string | null;
  bio: string | null;
}

export interface MentorProfile {
  id: string;
  userId: string;
  title: string;
  company: string;
  bio: string;
  expertise: ExpertiseCategory[];
  skills: string[];
  rating: number;
  totalSessions: number;
  featured: boolean;
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  location: string | null;
  languages: string[];
  sessionFormat: string;
}

export interface AvailabilitySlot {
  id: string;
  mentorProfileId: string;
  date: string;
  startTime: string;
  endTime: string;
  booked: boolean;
}

export interface Booking {
  id: string;
  mentorProfileId: string;
  userId: string;
  availabilitySlotId: string | null;
  date: string;
  startTime: string;
  endTime: string;
  topic: string;
  description: string | null;
  status: BookingStatus;
  notes: string | null;
  rating: number | null;
  meetingLink: string | null;
}

export interface SessionNote {
  id: string;
  bookingId: string;
  content: string;
  actionItems: { text: string; completed: boolean }[];
  createdAt: string;
}

export interface ExpertiseInfo {
  category: ExpertiseCategory;
  label: string;
  icon: string;
  description: string;
  color: string;
}
