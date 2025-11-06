export const dynamic = 'force-dynamic';

// Store SSE clients
const clients = new Set<ReadableStreamDefaultController>();

export function GET() {
  const stream = new ReadableStream({
    start(controller) {
      // Add this client to the set
      clients.add(controller);

      // Send initial connection message
      controller.enqueue(': connected\n\n');

      // Keep alive ping every 30 seconds
      const keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(': ping\n\n');
        } catch {
          clearInterval(keepAliveInterval);
          clients.delete(controller);
        }
      }, 30000);

      // Cleanup on disconnect
      return () => {
        clearInterval(keepAliveInterval);
        clients.delete(controller);
      };
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

export function broadcastMessage(message: any) {
  const messageData = JSON.stringify(message);
  clients.forEach(controller => {
    try {
      controller.enqueue(`data: ${messageData}\n\n`);
    } catch {
      // Client disconnected
      clients.delete(controller);
    }
  });
}
