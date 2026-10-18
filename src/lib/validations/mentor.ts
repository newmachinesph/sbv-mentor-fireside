import { z } from "zod";

export const createMentorSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  title: z.string().min(2).max(200),
  company: z.string().min(1).max(200),
  bio: z.string().min(10).max(2000),
  expertise: z.array(z.enum(["technical", "product", "business", "growth", "design", "fundraising"])).min(1),
  skills: z.array(z.string()).min(1).max(20),
  featured: z.boolean().optional().default(false),
  socialLinks: z.object({
    linkedin: z.string().url().optional().or(z.literal("")),
    twitter: z.string().url().optional().or(z.literal("")),
    website: z.string().url().optional().or(z.literal("")),
  }).optional().default({}),
  location: z.string().max(200).optional(),
  languages: z.array(z.string()).optional().default([]),
  sessionFormat: z.string().max(100).optional().default("30-min Video Call"),
});

export const updateMentorSchema = createMentorSchema.partial().omit({ userId: true });

export const addAvailabilitySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Time must be HH:MM"),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Time must be HH:MM"),
}).refine(
  (data) => data.endTime > data.startTime,
  { message: "End time must be after start time", path: ["endTime"] }
).refine(
  (data) => data.date >= new Date().toISOString().split("T")[0],
  { message: "Date must be today or in the future", path: ["date"] }
);

export type CreateMentorInput = z.infer<typeof createMentorSchema>;
export type UpdateMentorInput = z.infer<typeof updateMentorSchema>;
export type AddAvailabilityInput = z.infer<typeof addAvailabilitySchema>;
