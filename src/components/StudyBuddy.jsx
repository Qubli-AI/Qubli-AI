import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Minimize2,
  Maximize2,
  Loader2,
  Sparkles,
} from "lucide-react";
import { chatWithAI } from "../services/geminiService";
import ReactMarkdown from "react-markdown";

const StudyBuddy = ({ context, isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      role: "model",
      content:
        "Hi! I'm your AI Study Buddy. I can help you understand this topic better. What's on your mind?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, minimized]);

  // Reset chat when context changes significantly (e.g. new quiz)
  useEffect(() => {
    if (context?.quizId) {
      setMessages([
        {
          role: "model",
          content:
            "Hi! I'm ready to help you review this quiz. Ask me anything about the questions!",
        },
      ]);
    }
  }, [context?.quizId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = [...messages, userMsg];
      const reply = await chatWithAI(history, context);

      setMessages((prev) => [...prev, { role: "model", content: reply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          content: "Sorry, I had trouble connecting. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-primary dark:bg-blue-700 text-white rounded-full shadow-lg hover:bg-blue-700 dark:hover:bg-blue-700/60 transition-all flex items-center gap-2 animate-fade-in-up point"
        title="Open AI Study Buddy"
      >
        <Bot className="w-6 h-6" />
        <span className="font-bold hidden sm:inline">Study Buddy</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-[350px] sm:max-w-[400px] h-[500px] max-h-[80vh] flex flex-col bg-surface border border-border rounded-2xl shadow-lg-custom overflow-hidden animate-fade-in-up">
      {/* Header */}
      <div className="p-4 bg-primary dark:bg-blue-800 text-white flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-300/35 dark:bg-blue-300/30 rounded-lg">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Study Buddy</h3>
            <div className="flex items-center gap-1.5 rounded-lg text-xs font-medium text-white/90 w-fit">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Online
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(true)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors point"
            title="Minimize"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-red-600/70 dark:hover:bg-red-600/60 rounded-lg transition-colors point"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${
              msg.role === "user" ? "flex-row-reverse" : ""
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === "user"
                  ? "bg-blue-100 text-primary dark:bg-blue-800/40 dark:text-blue-400"
                  : "bg-indigo-100 text-indigo-600 dark:bg-indigo-800/40 dark:text-indigo-400"
              }`}
            >
              {msg.role === "user" ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>
            <div
              className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.role === "user"
                  ? "bg-primary text-white rounded-tr-sm"
                  : "bg-white dark:bg-surface border border-border text-textMain rounded-tl-sm"
              }`}
            >
              {msg.role === "model" ? (
                <div className="prose dark:prose-invert prose-sm max-w-none space-y-2 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4">
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        return (
                          <code
                            className={`${className} ${
                              inline
                                ? "bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-xs"
                                : "block bg-black/80 text-white p-2 rounded-lg my-2"
                            }`}
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            </div>
            <div className="bg-white dark:bg-surface border border-border p-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-white dark:bg-surface border-t border-border flex items-end gap-2 shrink-0"
      >
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
          placeholder="Ask me anything..."
          className="flex-1 bg-gray-100 dark:bg-gray-800 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none max-h-[100px] text-textMain placeholder-textMuted"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-3 bg-primary text-white rounded-xl hover:bg-blue-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
};

export default StudyBuddy;
