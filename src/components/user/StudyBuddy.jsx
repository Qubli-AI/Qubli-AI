import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  X,
  Send,
  Bot,
  User,
  Minimize2,
  Download,
  Copy,
  ArrowUpDown,
  Check,
  Loader2,
  Sparkles,
  SkipForward,
  History,
  Plus,
  ArrowLeft,
  Trash2,
  Search,
  ArrowDownUp,
} from "lucide-react";
import ThumbUp from "@mui/icons-material/ThumbUp";
import ThumbDown from "@mui/icons-material/ThumbDown";
import { chatWithAI } from "../../services/geminiService";
import ReactMarkdown from "react-markdown";
import { v4 as uuidv4 } from "uuid";
import remarkGfm from "remark-gfm";
import FeedbackModal from "./FeedbackModal";
import axios from "axios";
import { toast } from "react-toastify";
import StorageService from "../../services/storageService";

// --- Constants ---
const WORD_LIMIT = 200;

// --- Typewriter Component ---
const TypewriterMessage = ({ content, onComplete, speed = 8 }) => {
  const [displayedContent, setDisplayedContent] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef(null);
  const contentRef = useRef(content);

  const stopTyping = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const skipToEnd = useCallback(() => {
    stopTyping();
    setDisplayedContent(contentRef.current);
    setIsComplete(true);
    if (onComplete) onComplete();
  }, [onComplete, stopTyping]);

  useEffect(() => {
    // Only restart if content actually changed
    if (contentRef.current === content && displayedContent) {
      return;
    }

    contentRef.current = content;
    setDisplayedContent("");
    setIsComplete(false);
    stopTyping();

    let currentIndex = 0;
    const totalLength = content.length;

    intervalRef.current = setInterval(() => {
      if (currentIndex < totalLength) {
        setDisplayedContent(content.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        stopTyping();
        setIsComplete(true);
        if (onComplete) onComplete();
      }
    }, speed);

    return () => stopTyping();
  }, [content, speed]);

  return (
    <div className="relative group w-full">
      <div className="prose dark:prose-invert prose-sm max-w-none min-h-[24px] [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
        <ReactMarkdown
          components={{
            code({ inline, className, children, ...props }) {
              return (
                <code
                  className={`${className} ${
                    inline
                      ? "bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-xs"
                      : "block bg-black/70 dark:bg-black/30 text-white p-2 rounded-lg my-2"
                  }`}
                  {...props}
                >
                  {children}
                </code>
              );
            },
            // This keeps the cursor attached to the text smoothly
            p({ children }) {
              return (
                <p className="mb-2 last:mb-0 last:inline-block">{children}</p>
              );
            },
          }}
        >
          {displayedContent}
        </ReactMarkdown>
      </div>

      {/* Floating Skip Button */}
      {!isComplete && (
        <button
          onClick={skipToEnd}
          className="absolute bottom-0 -right-2 translate-y-full mt-3 text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors z-10 backdrop-blur-sm rounded px-1 point"
          title="Skip to full message"
        >
          <SkipForward className="w-3 h-3" />
          Skip
        </button>
      )}
    </div>
  );
};

const DataTable = ({ children }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [copied, setCopied] = useState(false);

  // Extract data from React children to perform sorting and exporting
  const tableData = useMemo(() => {
    const rows = [];
    const headers = [];

    // Recursive helper to get text from nested React elements
    const getText = (node) => {
      if (!node) return "";
      if (typeof node === "string") return node;
      if (Array.isArray(node)) return node.map(getText).join("");
      return getText(node.props?.children);
    };

    // Find the header and body within the markdown children
    const thead = children.find((child) => child.type === "thead");
    const tbody = children.find((child) => child.type === "tbody");

    if (thead) {
      const headerRow = thead.props.children;
      (Array.isArray(headerRow.props.children)
        ? headerRow.props.children
        : [headerRow.props.children]
      ).forEach((th) => {
        headers.push(getText(th));
      });
    }

    if (tbody) {
      const bodyRows = Array.isArray(tbody.props.children)
        ? tbody.props.children
        : [tbody.props.children];
      bodyRows.forEach((tr) => {
        const row = {};
        const cells = Array.isArray(tr.props.children)
          ? tr.props.children
          : [tr.props.children];
        cells.forEach((td, idx) => {
          row[headers[idx]] = getText(td);
        });
        rows.push(row);
      });
    }

    return { headers, rows };
  }, [children]);

  const sortedRows = useMemo(() => {
    let sortableItems = [...tableData.rows];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key])
          return sortConfig.direction === "asc" ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key])
          return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [tableData.rows, sortConfig]);

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };

  const exportCSV = () => {
    const csvContent = [
      tableData.headers.join(","),
      ...sortedRows.map((row) =>
        tableData.headers.map((h) => `"${row[h]}"`).join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "table_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyTable = () => {
    const text = [
      tableData.headers.join("\t"),
      ...sortedRows.map((row) =>
        tableData.headers.map((h) => row[h]).join("\t"),
      ),
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 border border-border rounded-xl overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
      {/* Table Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b border-border">
        <span className="text-[11px] font-bold uppercase tracking-wider text-textMuted">
          Data Table
        </span>
        <div className="flex gap-1">
          <button
            onClick={copyTable}
            className="py-1.5 px-2 hover:bg-black/5 dark:hover:bg-white/10 rounded transition-colors text-textMuted flex items-center gap-1 text-xs point"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={exportCSV}
            className="py-1.5 px-2 hover:bg-black/5 dark:hover:bg-white/10 rounded transition-colors text-textMuted flex items-center gap-1 text-xs point"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
        </div>
      </div>

      {/* Responsive Scroll Container */}
      <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[1000px] table-fixed">
          <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 shadow-[0_1px_0_rgba(0,0,0,0.1)]">
            <tr>
              {tableData.headers.map((header) => (
                <th
                  key={header}
                  onClick={() => requestSort(header)}
                  className="px-4 py-3 text-xs font-semibold text-textMain point hover:bg-black/5 dark:hover:bg-white/5 transition-colors group max-w-fit wrap-break-word whitespace-normal"
                >
                  <div className="flex gap-2">
                    <span className="flex-1">{header}</span>
                    <span className="text-textMuted opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      {sortConfig.key === header ? (
                        sortConfig.direction === "asc" ? (
                          <ArrowDownUp className="w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3" />
                      )}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedRows.map((row, i) => (
              <tr
                key={i}
                className="hover:bg-black/2 dark:bg-surfaceHighlight/50 dark:hover:bg-surfaceHighlight/60 transition-colors"
              >
                {tableData.headers.map((header) => (
                  <td
                    key={header}
                    className="px-4 py-3 text-sm text-textMain max-w-fit wrap-break-word whitespace-normal"
                  >
                    {row[header]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- Main Component ---
const StudyBuddy = ({ context, isOpen, onClose, initialPrompt }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [typingMessageIndex, setTypingMessageIndex] = useState(-1);
  const [view, setView] = useState("chat");
  const [recentChats, setRecentChats] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState({
    isOpen: false,
    type: "good",
    messageIndex: -1,
  });
  const initialPromptProcessedRef = useRef(null);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // --- Word Count Logic ---
  const wordCount = input.trim().split(/\s+/).filter(Boolean).length;
  const isOverLimit = wordCount > WORD_LIMIT;

  const scrollToBottom = useCallback((behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  // Load History
  useEffect(() => {
    const savedChats = localStorage.getItem("qubli_ai_chats");
    if (savedChats) {
      try {
        setRecentChats(JSON.parse(savedChats));
      } catch (err) {
        console.error("Failed to parse chat history", err);
      }
    }
  }, []);

  // Session Init
  useEffect(() => {
    if (!isOpen) return;

    // If we have a quiz context, try to load its session
    if (context?.quizId) {
      const existingSession = recentChats.find(
        (c) => c.quizId === context.quizId,
      );
      if (existingSession && currentSessionId !== existingSession.id) {
        setCurrentSessionId(existingSession.id);
        setMessages(existingSession.messages);
        return;
      }
    }

    // Only create a new session if we don't have one AND no messages
    // This prevents creating a new session when loading from history
    if (!currentSessionId && messages.length === 0) {
      const newId = uuidv4();
      setCurrentSessionId(newId);
      setMessages([
        {
          role: "model",
          content: context?.quizId
            ? "Hi! I'm ready to help you review this quiz. Ask me anything about the questions!"
            : "Hi! I'm your AI Study Buddy. I can help you understand any topic better. What's on your mind?",
          isTyping: false,
          isWelcome: true,
        },
      ]);
    }
  }, [isOpen, context?.quizId]);

  // Save Session
  useEffect(() => {
    if (!currentSessionId || messages.length === 0) return;

    const timeoutId = setTimeout(() => {
      let updatedChats = [...recentChats];
      const sessionIdx = updatedChats.findIndex(
        (c) => c.id === currentSessionId,
      );
      const sessionData = {
        id: currentSessionId,
        topic: context?.topic || "General Discussion",
        quizId: context?.quizId,
        lastUpdated: Date.now(),
        messages: messages.map((m) => ({ ...m, isTyping: false })),
      };

      if (sessionIdx >= 0) updatedChats[sessionIdx] = sessionData;
      else updatedChats.unshift(sessionData);

      if (updatedChats.length > 20) updatedChats = updatedChats.slice(0, 20);

      setRecentChats(updatedChats);
      localStorage.setItem("qubli_ai_chats", JSON.stringify(updatedChats));
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [messages, currentSessionId, context]);

  // Scrolling
  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, minimized, view, scrollToBottom]);

  useEffect(() => {
    if (typingMessageIndex >= 0) {
      const scrollInterval = setInterval(() => scrollToBottom("auto"), 80);
      return () => clearInterval(scrollInterval);
    }
  }, [typingMessageIndex, scrollToBottom]);

  const startNewChat = () => {
    setCurrentSessionId(uuidv4());
    setMessages([
      {
        role: "model",
        content: "New session started! What would you like to discuss today?",
        isTyping: false,
        isWelcome: true, // Also treat this as welcome
      },
    ]);
    setView("chat");
  };

  const loadSession = (session) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setView("chat");
  };

  const deleteSession = (e, id) => {
    e.stopPropagation();
    const updated = recentChats.filter((c) => c.id !== id);
    setRecentChats(updated);
    localStorage.setItem("qubli_ai_chats", JSON.stringify(updated));
    if (currentSessionId === id) startNewChat();
  };

  const clearAllHistory = () => {
    setRecentChats([]);
    localStorage.removeItem("qubli_ai_chats");
    startNewChat();
    setShowClearHistoryModal(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading || isOverLimit) return;

    const userMsg = { role: "user", content: input, isTyping: false };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const reply = await chatWithAI(history, context);

      setMessages((prev) => {
        const newMessages = [
          ...prev,
          { role: "model", content: reply, isTyping: true },
        ];
        setTypingMessageIndex(newMessages.length - 1);
        return newMessages;
      });
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          content: "Sorry, I had trouble connecting.",
          isTyping: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleTypingComplete = useCallback(
    (index) => {
      setMessages((prev) =>
        prev.map((msg, i) => (i === index ? { ...msg, isTyping: false } : msg)),
      );
      setTypingMessageIndex(-1);
      setTimeout(() => scrollToBottom("smooth"), 100);
    },
    [scrollToBottom],
  );

  const openFeedbackModal = (index, type) => {
    setFeedbackModal({ isOpen: true, type, messageIndex: index });
  };

  const handleFeedbackSubmit = async ({
    type,
    selectedReasons,
    customMessage,
  }) => {
    const user = StorageService.getCurrentUser();
    const msg = messages[feedbackModal.messageIndex];

    try {
      await axios.post("/api/support/chatbot-feedback", {
        userEmail: user?.email || "anonymous",
        feedbackType: type,
        selectedReasons,
        customMessage,
        chatbotResponse: msg.content,
        timestamp: new Date().toISOString(),
      });

      setMessages((prev) =>
        prev.map((m, i) =>
          i === feedbackModal.messageIndex ? { ...m, hasFeedback: true } : m,
        ),
      );
      toast.success("Thank you for your feedback!");
      setFeedbackModal({ ...feedbackModal, isOpen: false });
    } catch {
      toast.error("Failed to submit feedback. Please try again.");
    }
  };

  const isWelcomeMessage = (msg, index) => {
    // Only hide feedback buttons on the very first message of the conversation
    // or if the message is explicitly marked as a welcome message.
    if (msg.isWelcome) return true;
    if (index === 0) return true;
    return false;
  };

  // Initial Prompt Auto-send
  useEffect(() => {
    if (
      isOpen &&
      initialPrompt &&
      initialPromptProcessedRef.current !== initialPrompt &&
      !loading &&
      currentSessionId
    ) {
      initialPromptProcessedRef.current = initialPrompt;
      const userMsg = { role: "user", content: initialPrompt, isTyping: false };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      const runAuto = async () => {
        try {
          const history = [
            {
              role: "model",
              content: "Hi! I'm ready to help you review this quiz.",
            },
            { role: "user", content: initialPrompt },
          ];
          const reply = await chatWithAI(history, context);
          setMessages((prev) => {
            const newMessages = [
              ...prev,
              { role: "model", content: reply, isTyping: true },
            ];
            setTypingMessageIndex(newMessages.length - 1);
            return newMessages;
          });
        } catch {
          setLoading(false);
        } finally {
          setLoading(false);
        }
      };
      runAuto();
    }
  }, [isOpen, initialPrompt, loading, context, currentSessionId]);

  if (!isOpen) return null;

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-15 right-2 sm:bottom-20 md:bottom-4 md:right-4 z-50 p-4 bg-primary text-white rounded-full shadow-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-700/85 transition-all flex items-center gap-2 animate-fade-in-up point"
      >
        <Bot className="w-6 h-6" />
        <span className="font-bold hidden xs:inline">Study Buddy</span>
      </button>
    );
  }

  const filteredChats = recentChats.filter(
    (c) =>
      c.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.messages.some((m) =>
        m.content.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
  );

  return (
    <div className="fixed inset-0 z-300 w-full h-full flex flex-col bg-surface overflow-hidden animate-fade-in-up xs:inset-auto xs:bottom-15 xs:right-6 sm:bottom-20 sm:right-4 md:bottom-4 xs:h-[500px] xs:max-h-[80vh] xs:w-full xs:max-w-[350px] sm:max-w-[400px] xs:rounded-2xl xs:border xs:border-border xs:shadow-lg-custom">
      {/* Header */}
      <div className="p-4 bg-primary dark:bg-blue-800 text-white flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          {view === "history" ? (
            <button
              onClick={() => setView("chat")}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors point"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="p-1.5 bg-blue-300/35 dark:bg-blue-300/30 rounded-lg">
              <Bot className="w-5 h-5" />
            </div>
          )}
          <div>
            <h3 className="font-bold text-sm">Study Buddy</h3>
            <div className="flex items-center gap-1.5 text-xs text-white/90">
              {view === "chat" ? "Active Session" : "Recent Chats"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {view === "chat" ? (
            <button
              onClick={() => setView("history")}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors point"
              title="Chat History"
            >
              <History className="w-4 h-4" />
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowClearHistoryModal(true)}
                className="p-2 hover:bg-red-600/70 dark:hover:bg-red-600/60 rounded-lg transition-colors point"
                title="Clear All History"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={startNewChat}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors point"
                title="New Chat"
              >
                <Plus className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            onClick={() => setMinimized(true)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors point"
            title="Minimize"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-600/70 dark:hover:bg-red-600/60 rounded-lg transition-colors point"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {view === "history" ? (
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900/50 overflow-hidden">
          <div className="p-4 border-b border-border bg-white dark:bg-surface">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
              <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-textMuted text-sm">
                <History className="w-8 h-8 mb-2 opacity-20" />
                No history found
              </div>
            ) : (
              filteredChats.map((session) => (
                <div
                  key={session.id}
                  onClick={() => loadSession(session)}
                  className={`group p-3 rounded-xl point transition-all border ${
                    currentSessionId === session.id
                      ? "bg-blue-100 dark:bg-blue-800/40 border-primary/20"
                      : "bg-white dark:bg-surface border-transparent hover:border-border hover:bg-white/50 dark:hover:bg-white/10"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-textMain truncate">
                        {session.topic}
                      </div>
                      <div className="text-[10px] text-textMuted mt-1">
                        {new Date(session.lastUpdated).toLocaleDateString()} ·{" "}
                        {session.messages.length} messages
                      </div>
                    </div>
                    <button
                      onClick={(e) => deleteSession(e, session.id)}
                      className="p-1 text-textMuted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all point"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Feedback Modal at top level of view */}
          <FeedbackModal
            isOpen={feedbackModal.isOpen}
            onClose={() =>
              setFeedbackModal({ ...feedbackModal, isOpen: false })
            }
            type={feedbackModal.type}
            onSubmit={handleFeedbackSubmit}
          />

          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50 dark:bg-gray-900/50 [overflow-anchor:none]"
          >
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
                      ? "bg-blue-100 text-primary dark:bg-blue-800/30 dark:text-blue-500"
                      : "bg-indigo-100 text-indigo-600 dark:bg-indigo-800/25 dark:text-indigo-500"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 flex flex-col items-start min-w-0">
                  <div
                    className={`max-w-[85%] px-3.5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm relative ${
                      msg.role === "user"
                        ? "bg-primary dark:bg-blue-700 text-white dark:text-white/95 ml-auto rounded-tr-none"
                        : "bg-white dark:bg-surface border border-border text-textMain dark:text-textMain/95 rounded-tl-none"
                    }`}
                  >
                    {msg.role === "model" ? (
                      msg.isTyping ? (
                        <TypewriterMessage
                          content={msg.content}
                          onComplete={() => handleTypingComplete(idx)}
                          speed={10}
                        />
                      ) : (
                        <div className="prose dark:prose-invert prose-sm max-w-none space-y-2">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              table: ({ children }) => (
                                <DataTable>{children}</DataTable>
                              ),
                              code({ inline, className, children, ...props }) {
                                return (
                                  <code
                                    className={`${className} ${
                                      inline
                                        ? "bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded text-xs"
                                        : "block bg-black/70 dark:bg-black/30 text-white p-2 rounded-lg my-2"
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
                      )
                    ) : (
                      msg.content
                    )}
                  </div>

                  {/* Feedback Actions (Outside the bubble) */}
                  {msg.role === "model" &&
                    !isWelcomeMessage(msg, idx) &&
                    !msg.isTyping &&
                    !msg.hasFeedback && (
                      <div className="flex items-center gap-2 mt-2 ml-1 animate-fade-in">
                        <button
                          onClick={() => openFeedbackModal(idx, "good")}
                          className="p-1 px-2.5 rounded-full bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/20 text-textMuted hover:text-green-600 transition-all flex items-center gap-1.5 point border border-border hover:border-green-200 dark:hover:border-green-600 shadow-sm-custom"
                          title="Good Response"
                        >
                          <ThumbUp className="!w-3 !h-3" />
                          <span className="text-[10px] font-bold">Good</span>
                        </button>
                        <button
                          onClick={() => openFeedbackModal(idx, "bad")}
                          className="p-1 px-2.5 rounded-full bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-800/20 text-textMuted hover:text-red-600 dark:hover:text-red-500 transition-all flex items-center gap-1.5 point border border-border hover:border-red-200 dark:hover:border-red-600 shadow-sm-custom"
                          title="Bad Response"
                        >
                          <ThumbDown className="!w-3 !h-3" />
                          <span className="text-[10px] font-bold">Bad</span>
                        </button>
                      </div>
                    )}

                  {msg.hasFeedback && (
                    <div className="flex items-center gap-1 mt-1.5 ml-2 text-[10px] text-textMuted font-medium italic animate-fade-in">
                      <Check className="w-3 h-3 text-green-500" />
                      Feedback received
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-800/35 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </div>
                <div className="bg-white dark:bg-surface border border-border p-3 rounded-2xl flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSend}
            className="p-3 bg-white mb-12 xs:mb-0 dark:bg-surface border-t border-border shrink-0"
          >
            <div className="flex items-end gap-2 relative">
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
                className={`flex-1 bg-gray-100 dark:bg-gray-800 border rounded-xl px-4 py-3 text-sm focus:ring-2 outline-none resize-none max-h-[100px] text-textMain dark:text-textMain/95 transition-all ${
                  isOverLimit
                    ? "border-red-500 focus:ring-red-200 dark:focus:ring-red-500"
                    : "border-border focus:ring-primary/20"
                }`}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading || isOverLimit}
                className={`p-3 rounded-xl shadow-sm transition-colors ${
                  !input.trim() || loading || isOverLimit
                    ? "bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500"
                    : "bg-primary text-white hover:bg-blue-700 point"
                }`}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            {/* Word Limit Indicator */}
            <div
              className={`text-[10px] text-right mt-1 px-1 transition-colors ${
                isOverLimit
                  ? "text-red-500 font-bold"
                  : wordCount > WORD_LIMIT * 0.9
                    ? "text-orange-500"
                    : "text-textMuted"
              }`}
            >
              {wordCount} / {WORD_LIMIT} words
            </div>
          </form>
        </>
      )}

      {/* Clear History Confirmation Modal */}
      {showClearHistoryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-9999 p-4 animate-fade-in">
          <div className="bg-surface border border-border rounded-2xl shadow-2xl max-w-sm w-full animate-scale-in">
            <div className="p-6 text-center">
              <div className="flex items-center justify-center mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 mb-4">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-300" />
              </div>
              <h3 className="text-xl font-semibold text-textMain mb-3">
                Clear All History?
              </h3>
              <p className="text-textMuted text-sm mb-6">
                Are you sure you want to delete all chat history? This action
                cannot be undone.
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowClearHistoryModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border text-textMain hover:bg-surfaceHighlight transition-colors font-medium point"
                >
                  Cancel
                </button>
                <button
                  onClick={clearAllHistory}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-700/80 text-white transition-colors font-medium point"
                >
                  Delete All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyBuddy;
