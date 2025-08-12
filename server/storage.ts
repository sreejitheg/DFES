import { type Message, type InsertMessage } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  addMessage(message: InsertMessage): Promise<Message>;
  getRecentMessages(limit?: number): Promise<Message[]>;
}

export class MemStorage implements IStorage {
  private messages: Message[] = [];
  private readonly maxMessages = 100; // Ring buffer size

  async addMessage(insertMessage: InsertMessage): Promise<Message> {
    const message: Message = {
      ...insertMessage,
      id: randomUUID(),
      ts: insertMessage.ts || new Date().toISOString(),
    };

    this.messages.push(message);

    // Maintain ring buffer - keep only last maxMessages
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }

    return message;
  }

  async getRecentMessages(limit: number = 100): Promise<Message[]> {
    return this.messages.slice(-limit);
  }
}

export const storage = new MemStorage();
