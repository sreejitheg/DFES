import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMessageSchema, sendTextSchema } from "@shared/schema";
import { z } from "zod";
import multer from 'multer';

// Configure multer for handling audio file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// SSE clients storage
const sseClients = new Set<Response>();

export async function registerRoutes(app: Express): Promise<Server> {
  // Environment variables
  const ASSISTANT_EVENT = process.env.ASSISTANT_EVENT || "Control";
  const TEXT_WEBHOOK_URL = process.env.TEXT_WEBHOOK_URL || "https://sreejitheg.app.n8n.cloud/webhook/b979bcaa-0d30-4e83-b361-e6c9f7f7e150/chat";
  const VOICE_WEBHOOK_URL = process.env.VOICE_WEBHOOK_URL || "https://sreejitheg.app.n8n.cloud/webhook/voice-endpoint";
  const INCOMING_WEBHOOK_SECRET = process.env.INCOMING_WEBHOOK_SECRET;

  // POST /api/incoming - Receive messages from backend (n8n)
  app.post("/api/incoming", async (req: Request, res: Response) => {
    try {
      // No webhook secret validation required

      // Validate and parse message
      const messageData = insertMessageSchema.parse({
        ...req.body,
        ts: req.body.ts || new Date().toISOString(),
      });

      // Store message
      const message = await storage.addMessage(messageData);

      // Broadcast to all SSE clients
      const sseData = `data: ${JSON.stringify(message)}\n\n`;
      sseClients.forEach(client => {
        try {
          client.write(sseData);
        } catch (error) {
          sseClients.delete(client);
        }
      });

      res.json({ success: true, messageId: message.id });
    } catch (error) {
      console.error("Error processing incoming message:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid message format", details: error.errors });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // GET /api/stream - Server-Sent Events for real-time updates
  app.get("/api/stream", async (req: Request, res: Response) => {
    // Set SSE headers
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    });

    // Add client to set
    sseClients.add(res);

    // Send recent messages as initial data
    try {
      const recentMessages = await storage.getRecentMessages(100);
      recentMessages.forEach(message => {
        res.write(`data: ${JSON.stringify(message)}\n\n`);
      });
    } catch (error) {
      console.error("Error sending recent messages:", error);
    }

    // Handle client disconnect
    req.on("close", () => {
      sseClients.delete(res);
    });

    req.on("error", () => {
      sseClients.delete(res);
    });
  });

  // POST /api/send-text - Send text to outbound webhook
  app.post("/api/send-text", async (req: Request, res: Response) => {
    try {
      const { text, clientId } = sendTextSchema.parse(req.body);

      if (!TEXT_WEBHOOK_URL) {
        return res.status(500).json({ error: "TEXT_WEBHOOK_URL not configured" });
      }

      // Check if TEXT_WEBHOOK_URL is valid
      if (!TEXT_WEBHOOK_URL.startsWith("http")) {
        console.log(`Invalid TEXT_WEBHOOK_URL: ${TEXT_WEBHOOK_URL}`);
        return res.status(500).json({ error: "TEXT_WEBHOOK_URL is not a valid URL" });
      }

      // Send to outbound webhook
      const webhookResponse = await fetch(TEXT_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          clientId,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!webhookResponse.ok) {
        throw new Error(`Webhook request failed: ${webhookResponse.status}`);
      }

      res.json({ 
        success: true, 
        message: "Text sent to webhook",
        webhookStatus: webhookResponse.status 
      });
    } catch (error) {
      console.error("Error sending text:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request format", details: error.errors });
      }
      res.status(500).json({ error: "Failed to send text" });
    }
  });

  // POST /api/send-voice - Send voice to outbound webhook (multipart form data)
  app.post("/api/send-voice", upload.single('audio'), async (req: Request, res: Response) => {
    try {
      const { clientId, mimeType } = req.body;
      const audioFile = req.file;

      if (!audioFile) {
        return res.status(400).json({ error: "No audio file provided" });
      }

      if (!VOICE_WEBHOOK_URL) {
        return res.status(500).json({ error: "VOICE_WEBHOOK_URL not configured" });
      }

      // Check if VOICE_WEBHOOK_URL is valid
      if (!VOICE_WEBHOOK_URL.startsWith("http")) {
        console.log(`Invalid VOICE_WEBHOOK_URL: ${VOICE_WEBHOOK_URL}`);
        return res.status(500).json({ error: "VOICE_WEBHOOK_URL is not a valid URL" });
      }

      // Create form data to send raw audio file
      const formData = new FormData();
      
      // Create a Blob from the buffer with proper MIME type
      const audioBlob = new Blob([audioFile.buffer], { 
        type: mimeType || audioFile.mimetype || 'audio/wav' 
      });
      
      formData.append('audio', audioBlob, 'recording.wav');
      formData.append('clientId', clientId || 'local-user');
      formData.append('timestamp', new Date().toISOString());
      formData.append('audioSize', audioFile.size.toString());

      // Send raw audio file to outbound voice webhook
      const webhookResponse = await fetch(VOICE_WEBHOOK_URL, {
        method: "POST",
        body: formData, // Send as multipart form data
      });

      if (!webhookResponse.ok) {
        throw new Error(`Voice webhook request failed: ${webhookResponse.status}`);
      }

      res.json({ 
        success: true, 
        message: "Voice sent to webhook",
        webhookStatus: webhookResponse.status,
        audioSize: audioFile.size
      });
    } catch (error) {
      console.error("Error sending voice:", error);
      res.status(500).json({ error: "Failed to send voice" });
    }
  });

  // GET /api/config - Get client configuration
  app.get("/api/config", (req: Request, res: Response) => {
    res.json({
      assistantEvent: ASSISTANT_EVENT,
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
