"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Headset } from "lucide-react";

type Msg = { role: "user" | "agent"; text: string; handoff?: boolean };

const SUGGESTIONS = [
  "What are your timings?",
  "How much is a root canal?",
  "What treatments do you offer?",
  "Where are you located?",
];

export function ChatWidget({ patientId, clinicId, channel = "web" }: { patientId?: string; clinicId?: string; channel?: "web" | "whatsapp" }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "agent", text: "Hi! I'm the SmileCare assistant. Ask me about timings, services, prices, your appointments, or bills." },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || sending) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setSending(true);
    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, patientId, clinicId, channel }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((m) => [...m, { role: "agent", text: data.data.answer, handoff: data.data.handoff }]);
      } else {
        setMessages((m) => [...m, { role: "agent", text: "Sorry, something went wrong. Please try again." }]);
      }
    } catch {
      setMessages((m) => [...m, { role: "agent", text: "Sorry, I couldn't reach the server." }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-emerald-600 text-white shadow-lg flex items-center justify-center hover:bg-emerald-700 transition-colors"
        aria-label="Open chat"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-3rem)] h-[520px] bg-card rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-emerald-600 text-white px-4 py-3">
            <div className="font-semibold">SmileCare Assistant</div>
            <div className="text-xs text-emerald-100">Typically replies instantly</div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-background">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-emerald-600 text-white rounded-br-sm"
                      : "bg-muted border border-border text-foreground rounded-bl-sm"
                  }`}
                >
                  {m.text}
                  {m.handoff && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
                      <Headset className="h-3 w-3" /> Connecting you to staff
                    </div>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-white border rounded-2xl rounded-bl-sm px-3 py-2 text-sm text-gray-400">
                  typing…
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Suggestions (only before first user message) */}
          {messages.filter((m) => m.role === "user").length === 0 && (
            <div className="px-3 pb-2 flex flex-wrap gap-2 bg-background">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs border border-emerald-300 text-emerald-700 rounded-full px-3 py-1 hover:bg-emerald-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-border p-2 flex gap-2 bg-card">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(input); }}
              placeholder="Type your question..."
              className="flex-1 rounded-full border border-border bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              onClick={() => send(input)}
              disabled={sending}
              className="h-9 w-9 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
