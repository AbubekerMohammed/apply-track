"use client";

import * as React from "react";
import Link from "next/link";
import {
  Terminal,
  X,
  Send,
  ArrowRight,
  Command,
  CornerDownLeft,
} from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  category?: string;
  suggestedActions?: Array<{ label: string; href: string }>;
  timestamp: Date;
}

const STARTER_PROMPTS = [
  { label: "apps --last-week", query: "How many did I apply to last week?" },
  { label: "followups --due", query: "Who should I follow up with?" },
  { label: "targets --referral-needed", query: "Which target companies still need a referral?" },
  { label: "metrics --response-rate", query: "What is my response rate?" },
];

export function AICopilotDrawer() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: "initial",
      sender: "ai",
      text: "Pipeline intelligence initialized. Ask any query regarding your job search velocity, active interview stages, or pending follow-ups.",
      suggestedActions: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Applications", href: "/applications" },
      ],
      timestamp: new Date(),
    },
  ]);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Keyboard shortcut: Option+K / Alt+K to toggle drawer
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.altKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function handleSend(textToSend?: string) {
    const question = textToSend || input;
    if (!question.trim() || loading) return;

    const userMessage: Message = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: question.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!res.ok) {
        throw new Error("Failed to get answer from AI Assistant");
      }

      const data = await res.json();
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: data.answer,
        category: data.category,
        suggestedActions: data.suggestedActions,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error("AI assistant error", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "ai",
          text: "System query exception: could not retrieve pipeline metrics. Please retry.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Precision Floating Trigger Button (No Cheesy Sparkles) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 dark:bg-[#161A22] text-white border border-slate-700/80 dark:border-white/10 shadow-lg hover:border-slate-500 transition-all text-xs font-mono group"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <Terminal className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
          <span className="font-sans font-semibold">Copilot</span>
          <span className="px-1.5 py-0.2 rounded bg-white/10 text-[10px] text-slate-400 font-mono">
            ⌥K
          </span>
        </button>
      )}

      {/* Slide-over Terminal Console */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#0A0D12] border-l border-white/[0.08] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 text-slate-200 font-sans">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08] bg-[#0F131A]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center font-mono text-[10px] font-bold text-white">
                &gt;_
              </div>
              <div>
                <h3 className="font-mono text-xs font-bold text-white flex items-center gap-2">
                  <span>pipeline-copilot</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </h3>
                <p className="text-[10px] font-mono text-slate-500">
                  career telemetry console
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Prompt Command Chips */}
          <div className="px-3.5 py-2 bg-[#0C1017] border-b border-white/[0.06] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {STARTER_PROMPTS.map((p) => (
              <button
                key={p.label}
                onClick={() => handleSend(p.query)}
                className="whitespace-nowrap px-2.5 py-1 rounded bg-[#151A22] hover:bg-[#1C222C] text-slate-300 border border-white/[0.06] text-[10px] font-mono transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 font-sans">
            {messages.map((m) => {
              const isUser = m.sender === "user";
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                >
                  <span className="text-[9px] font-mono uppercase tracking-wider text-slate-500 mb-1 px-1">
                    {isUser ? "You" : "Copilot"}
                  </span>

                  <div
                    className={`max-w-[90%] rounded-xl p-3 text-xs leading-relaxed ${
                      isUser
                        ? "bg-blue-600 text-white font-medium"
                        : "bg-[#131720] text-slate-200 border border-white/[0.06]"
                    }`}
                  >
                    <div className="whitespace-pre-line">{m.text}</div>

                    {/* Action links */}
                    {m.suggestedActions && m.suggestedActions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2.5 mt-2.5 border-t border-white/[0.06]">
                        {m.suggestedActions.map((action) => (
                          <Link
                            key={action.label}
                            href={action.href}
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#1B212C] text-slate-300 border border-white/[0.08] hover:text-white hover:border-white/20 transition-colors"
                          >
                            <span>{action.label}</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#131720] border border-white/[0.06] w-28">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono text-slate-400">querying...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 border-t border-white/[0.08] bg-[#0C1017]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Ask query (e.g. apps last week, who to follow up)..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                  className="w-full pl-3 pr-8 py-2 text-xs rounded-lg border border-white/[0.08] bg-[#141822] text-white placeholder:text-slate-500 focus:outline-none focus:border-white/20 font-mono disabled:opacity-50"
                />
                <CornerDownLeft className="w-3 h-3 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-3 py-2 rounded-lg bg-white text-slate-950 font-mono font-bold text-xs hover:bg-slate-200 transition-colors disabled:opacity-40"
              >
                Run
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
