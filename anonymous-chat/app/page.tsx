'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  text: string;
  timestamp: number;
  userId: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [userId] = useState(() => `user-${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Fetch initial messages
    fetch('/api/messages')
      .then(res => res.json())
      .then(data => setMessages(data.messages || []));

    // Setup SSE connection
    eventSourceRef.current = new EventSource('/api/stream');

    eventSourceRef.current.onmessage = (event) => {
      const newMessage = JSON.parse(event.data);
      setMessages(prev => [...prev, newMessage]);
    };

    eventSourceRef.current.onerror = () => {
      console.error('SSE connection error');
    };

    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const message: Message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      text: inputText,
      timestamp: Date.now(),
      userId,
    };

    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    setInputText('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 flex flex-col">
      <header className="bg-black/20 backdrop-blur-sm text-white p-4 shadow-lg">
        <h1 className="text-3xl font-bold text-center">Anonymous Chat 🎭</h1>
        <p className="text-center text-sm mt-1 opacity-90">Send messages anonymously to everyone</p>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col max-w-4xl mx-auto w-full p-4">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-white/70 mt-20">
                <p className="text-xl">No messages yet</p>
                <p className="text-sm mt-2">Be the first to send a message!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.userId === userId ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-lg ${
                      msg.userId === userId
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/90 text-gray-800'
                    }`}
                  >
                    <p className="break-words">{msg.text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.userId === userId ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="p-4 bg-black/20">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your anonymous message..."
                className="flex-1 px-4 py-3 rounded-full bg-white/90 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-lg"
                maxLength={500}
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="px-6 py-3 bg-white text-purple-600 rounded-full font-semibold hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:scale-105"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </main>

      <footer className="text-white/70 text-center py-4 text-sm">
        <p>All messages are anonymous • Everyone sees everything</p>
      </footer>
    </div>
  );
}
