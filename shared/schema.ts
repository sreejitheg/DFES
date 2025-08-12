import { z } from "zod";

// Message data model based on the requirements
export const messageSchema = z.object({
  id: z.string(),
  event: z.string(), // "user_echo", "Control", etc.
  var1: z.string(), // speaker label
  var2: z.string(), // message text
  audioUrl: z.string().optional(), // optional audio URL for voice messages
  sessionId: z.string().optional(),
  ts: z.string(), // ISO timestamp
});

export const insertMessageSchema = messageSchema.omit({ id: true });

export type Message = z.infer<typeof messageSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Outbound text request schema
export const sendTextSchema = z.object({
  text: z.string().min(1),
  clientId: z.string(),
});

// Outbound voice request schema
export const sendVoiceSchema = z.object({
  audioData: z.string(), // base64 encoded audio data
  clientId: z.string(),
  mimeType: z.string().optional().default("audio/webm"),
});

export type SendTextRequest = z.infer<typeof sendTextSchema>;
export type SendVoiceRequest = z.infer<typeof sendVoiceSchema>;
