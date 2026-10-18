import { z } from "zod";

export const createBookingSchema = z.object({
  mentorProfileId: z.string().min(1),
  availabilitySlotId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string(),
  endTime: z.string(),
  topic: z.string().min(2).max(500),
  description: z.string().max(2000).optional(),
});

export const updateBookingSchema = z.object({
  status: z.enum(["upcoming", "completed", "cancelled"]).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(5000).optional(),
  meetingLink: z.string().url().optional().or(z.literal("")),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
