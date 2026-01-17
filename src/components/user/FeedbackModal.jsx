import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Send } from "lucide-react";

/**
 * FeedbackModal - Simplified to avoid framer-motion issues
 */
const FeedbackModal = ({ isOpen, onClose, onSubmit, type }) => {
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [customMessage, setCustomMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const goodReasons = [
    "Accurate answer",
    "Easy to understand",
    "Helpful explanation",
    "Fast response",
  ];

  const badReasons = [
    "Incorrect information",
    "Confusing explanation",
    "Too short / too long",
    "Didn’t answer the question",
  ];

  const reasons = type === "good" ? goodReasons : badReasons;

  const toggleReason = (reason) => {
    setSelectedReasons((prev) =>
      prev.includes(reason)
        ? prev.filter((r) => r !== reason)
        : [...prev, reason],
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        type,
        selectedReasons,
        customMessage,
      });
      // Clear state after success
      setSelectedReasons([]);
      setCustomMessage("");
    } catch (err) {
      console.error("Feedback submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 1000000, position: "fixed", inset: 0 }}
    >
      {/* Backdrop */}
      <div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={{ zIndex: -1 }}
      />

      {/* Modal Container */}
      <div
        className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-border relative animate-fade-in-up"
        style={{ zIndex: 1 }}
      >
        {/* Header */}
        <div className="p-5 flex items-center justify-between border-b border-border">
          <h3 className="font-bold text-xl text-textMain dark:text-textMain/95 flex items-center gap-2">
            Give Feedback
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full point transition-colors"
          >
            <X className="w-5 h-5 text-gray-400 font-bold" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Reasons */}
          <div className="space-y-4">
            <p className="text-[12px] font-semibold text-textMuted uppercase tracking-wider">
              {type === "good"
                ? "What did you like about this response?"
                : "What went wrong?"}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {reasons.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-3 py-4 px-3 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedReasons.includes(reason)
                      ? "bg-primary/5 dark:bg-blue-800/12 border-primary text-primary dark:text-blue-500 shadow-sm-custom"
                      : "bg-surface border-border hover:border-primary/40 text-textMain dark:text-textMain/95"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={selectedReasons.includes(reason)}
                    onChange={() => toggleReason(reason)}
                  />
                  <div
                    className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                      selectedReasons.includes(reason)
                        ? "bg-primary dark:bg-blue-700 border-primary scale-110"
                        : "bg-transparent border-gray-300"
                    }`}
                  >
                    {selectedReasons.includes(reason) && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <span className="text-sm font-medium">{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Custom Message */}
          <div className="space-y-2">
            <p className="text-[12px] font-semibold text-textMuted uppercase tracking-wider">
              Additional comments (optional)
            </p>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Tell us more to help us improve..."
              className="w-full h-28 p-4 bg-gray-50 dark:bg-gray-800 border-2 border-border rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 resize-none transition-all text-textMain dark:text-textMain/95"
            />
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={
              isSubmitting ||
              (type === "bad" && selectedReasons.length === 0) ||
              (type === "good" && selectedReasons.length === 0)
            }
            className="w-full py-4 bg-primary dark:bg-blue-700 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-blue-700 dark:hover:bg-blue-700/85 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm shadow-primary/30 text-base"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Feedback{" "}
                {(type === "bad" || type === "good") &&
                  selectedReasons.length === 0 &&
                  "(Select a reason)"}
              </>
            )}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  );
};

export default FeedbackModal;
