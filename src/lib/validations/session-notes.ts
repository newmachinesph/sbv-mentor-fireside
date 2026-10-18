import { z } from "zod";

export const createSessionNoteSchema = z.object({
  content: z.string().min(1).max(10000),
  actionItems: z.array(z.object({
    text: z.string().min(1),
    completed: z.boolean().default(false),
  })).optional().default([]),
});

export const updateActionItemSchema = z.object({
  actionItems: z.array(z.object({
    text: z.string().min(1),
    completed: z.boolean(),
  })),
});

export type CreateSessionNoteInput = z.infer<typeof createSessionNoteSchema>;
export type UpdateActionItemInput = z.infer<typeof updateActionItemSchema>;
