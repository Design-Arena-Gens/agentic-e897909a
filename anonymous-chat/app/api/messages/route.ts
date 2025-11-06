import { NextRequest, NextResponse } from 'next/server';
import { broadcastMessage } from '../stream/route';

interface Message {
  id: string;
  text: string;
  timestamp: number;
  userId: string;
}

// In-memory storage for messages
let messages: Message[] = [];

export async function GET() {
  return NextResponse.json({ messages });
}

export async function POST(request: NextRequest) {
  const message: Message = await request.json();

  // Store message
  messages.push(message);

  // Keep only last 100 messages
  if (messages.length > 100) {
    messages = messages.slice(-100);
  }

  // Broadcast to all connected clients
  broadcastMessage(message);

  return NextResponse.json({ success: true });
}
