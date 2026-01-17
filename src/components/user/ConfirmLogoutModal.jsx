import { createPortal } from "react-dom";
import { AlertCircle, Loader2 } from "lucide-react";

/**
 * ConfirmLogoutModal - Simplified to avoid framer-motion issues
 * Always rendered by parent, but only shows content when 'open' is true.
 */
const ConfirmLogoutModal = ({
  open,
  onClose,
  onConfirm,
  isProcessing = false,
  title = "Confirm",
  description = "Are you sure?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
}) => {
  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{
        zIndex: 1000000,
        position: "fixed",
        inset: 0,
        pointerEvents: "auto",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        style={{ zIndex: -1 }}
      />

      {/* Modal Container */}
      <div
        className="bg-white dark:bg-slate-900 border border-border rounded-2xl shadow-2xl max-w-sm w-full relative animate-fade-in-up"
        style={{ zIndex: 1 }}
      >
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/40 mx-auto mb-3.5">
            <AlertCircle className="w-7 h-7 text-amber-600" />
          </div>

          <h3 className="text-[28px] mb-3 font-bold text-center text-textMain dark:text-textMain/95">
            {title}
          </h3>

          <div className="text-md text-textMuted dark:text-gray-400 text-center leading-relaxed">
            {description}
          </div>

          <div className="flex gap-3 pt-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-4 py-3 rounded-xl bg-surfaceHighlight/80 dark:bg-surface text-textMain hover:text-textMain/95 dark:text-gray-200 font-bold hover:bg-surfaceHighlight dark:hover:bg-surfaceHighlight/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed point border border-transparent"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={isProcessing}
              className="flex-1 px-4 py-3 rounded-xl bg-amber-600/90 dark:bg-amber-700 text-white font-bold hover:bg-amber-600 dark:hover:bg-amber-700/90 transition-colors disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2 point hover:shadow-md shadow-amber-500/20"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Logging Out</span>
                </>
              ) : (
                <>{confirmLabel}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ConfirmLogoutModal;
