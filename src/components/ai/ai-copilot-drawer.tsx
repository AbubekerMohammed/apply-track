"use client";

import * as React from "react";
import Link from "next/link";
import {
  MessageSquare,
  X,
  Send,
  ArrowRight,
  Bot,
  User,
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
      text: "Hi there! I can help you analyze your application pipeline, check upcoming follow-ups, and answer questions about your job search progress.",
      suggestedActions: [
        { label: "View Applications", href: "/applications" },
        { label: "Dashboard", href: "/dashboard" },
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
          text: "I ran into an issue retrieving your career data. Please try asking again in a moment.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Clean Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-medium text-xs shadow-md border border-slate-800 dark:border-slate-200 transition-all group"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="hidden sm:inline">Ask Assistant</span>
          <span className="sm:hidden">Assistant</span>
        </button>
      )}

      {/* Slide-over Assistant Drawer */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-[#111622] border-l border-slate-200 dark:border-slate-800 shadow-xl flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                  Job Search Assistant
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Instant answers from your active pipeline
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

          {/* Clean Suggestion Chips */}
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                className="whitespace-nowrap px-3 py-1 rounded-full text-xs bg-white dark:bg-[#1a2233] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-2xs"
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
                    <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                      isUser
                        ? "bg-blue-600 text-white rounded-br-xs"
                        : "bg-slate-100 dark:bg-[#192233] text-slate-800 dark:text-slate-200 rounded-bl-xs"
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
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white dark:bg-[#111622] text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                          >
                            <span>{action.label}</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-slate-100 dark:bg-[#192233] p-3 rounded-2xl flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#111622]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask about your applications or follow-ups..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
