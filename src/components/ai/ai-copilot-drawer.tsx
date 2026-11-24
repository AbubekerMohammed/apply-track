"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  X,
  Send,
  Bot,
  User,
  ArrowRight,
  TrendingUp,
  Clock,
  Briefcase,
  HelpCircle,
  Minimize2,
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
  "How many did I apply to last week?",
  "Who should I follow up with?",
  "Which target companies still need a referral?",
  "What is my response rate?",
];

export function AICopilotDrawer() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: "initial",
      sender: "ai",
      text: "👋 Hi! I'm your **ApplyTrack AI Career Assistant**. Ask me anything about your job search pipeline, follow-ups, or weekly stats!",
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
          text: "Sorry, I had trouble retrieving your career data right now. Please try again in a moment.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all group"
        >
          <div className="relative">
            <Sparkles className="w-4 h-4 animate-spin-slow group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-900" />
          </div>
          <span className="hidden sm:inline">Ask AI Career Copilot</span>
          <span className="sm:hidden">AI Assistant</span>
        </button>
      )}

      {/* Slide-over Assistant Drawer */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-250">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>AI Career Copilot</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    Live
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Instant answers from your active job pipeline
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Starter Prompt Chips */}
          <div className="px-4 py-2.5 bg-slate-100/60 dark:bg-slate-800/40 border-b border-slate-200/60 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-2xs"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m) => {
              const isUser = m.sender === "user";
              return (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                      isUser
                        ? "bg-blue-600 text-white rounded-br-xs shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800/70 text-slate-800 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700/60 rounded-bl-xs"
                    }`}
                  >
                    <div className="whitespace-pre-line">{m.text}</div>

                    {/* Action buttons if provided */}
                    {m.suggestedActions && m.suggestedActions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2.5 mt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                        {m.suggestedActions.map((action) => (
                          <Link
                            key={action.label}
                            href={action.href}
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors"
                          >
                            <span>{action.label}</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/70 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask about applications, follow-ups..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-40 shadow-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
