import React from "react";
import { X, Check, Zap, Crown, Star } from "lucide-react";

import StorageService from "..//services/storageService.js";
import { SubscriptionTier } from "../../server/config/types.js";

const SubscriptionModal = ({ onClose, onUpgrade, currentTier }) => {
  const handleUpgrade = (tier) => {
    // Simulate payment processing
    const confirmPayment = window.confirm(
      `Proceed to upgrade to ${tier}? (Simulated Payment)`
    );
    if (confirmPayment) {
      StorageService.upgradeTier(tier);
      onUpgrade();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl p-4 md:p-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Desktop Close Button */}
        <button
          onClick={onClose}
          className="hidden md:block absolute -top-[45px] right-0 p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          title="Close"
        >
          <X className="w-8 h-8" />
        </button>

        {/* Scrollable container */}
        <div className="max-h-[85vh] overflow-y-auto custom-scrollbar md:overflow-visible rounded-2xl md:rounded-none">
          {/* Mobile Close Button */}
          <div className="md:hidden sticky top-0 z-20 flex justify-end mb-2">
            <button
              onClick={onClose}
              className="p-2 bg-black/50 text-white rounded-full backdrop-blur-md shadow-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-8 md:pb-0">
            {/* Free Tier */}
            <div className="bg-surface rounded-2xl p-8 border border-border shadow-lg flex flex-col h-full relative overflow-hidden transition-transform hover:-translate-y-1 duration-300">
              <div className="mb-6 p-4 bg-gray-100 w-fit rounded-2xl">
                <Star className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-textMain mb-2">
                Free Starter
              </h3>
              <div className="text-4xl font-bold text-textMain mb-6">
                $0{" "}
                <span className="text-sm text-textMuted font-medium">
                  / month
                </span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-textMuted">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" /> 7
                  Quizzes / Day
                </li>
                <li className="flex items-center gap-3 text-sm text-textMuted">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" /> 3
                  Flashcard Sets / Day
                </li>
                <li className="flex items-center gap-3 text-sm text-textMuted">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" /> Max
                  10 Questions
                </li>
                <li className="flex items-center gap-3 text-sm text-textMuted">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" /> Max
                  30 Marks
                </li>
                <li className="flex items-center gap-3 text-sm text-textMuted">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" /> 3
                  PDF Uploads / Day
                </li>
                <li className="flex items-center gap-3 text-sm text-textMuted">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" /> 3
                  PDF Exports / Day
                </li>
              </ul>
              <button
                disabled
                className="w-full py-4 rounded-xl border border-border bg-surfaceHighlight text-textMuted text-sm font-bold cursor-default mt-auto"
              >
                Current Plan
              </button>
            </div>

            {/* Basic Tier */}
            <div className="bg-surface rounded-2xl p-8 border-2 border-blue-100 shadow-xl flex flex-col h-full relative overflow-hidden transition-transform hover:-translate-y-1 duration-300">
              <div className="mb-6 p-4 bg-blue-100 w-fit rounded-2xl">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-textMain mb-2">
                Scholar Basic
              </h3>
              <div className="text-4xl font-bold text-textMain mb-6">
                $3.99{" "}
                <span className="text-sm text-textMuted font-medium">
                  / month
                </span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-textMain">
                  <Check className="w-5 h-5 text-blue-600 flex-shrink-0" /> 30
                  Quizzes / Day
                </li>
                <li className="flex items-center gap-3 text-sm text-textMain">
                  <Check className="w-5 h-5 text-blue-600 flex-shrink-0" /> 15
                  Flashcard Sets / Day
                </li>
                <li className="flex items-center gap-3 text-sm text-textMain">
                  <Check className="w-5 h-5 text-blue-600 flex-shrink-0" /> Max
                  25 Questions
                </li>
                <li className="flex items-center gap-3 text-sm text-textMain">
                  <Check className="w-5 h-5 text-blue-600 flex-shrink-0" /> Max
                  60 Marks
                </li>
                <li className="flex items-center gap-3 text-sm text-textMain">
                  <Check className="w-5 h-5 text-blue-600 flex-shrink-0" /> 15
                  PDF Uploads / Day
                </li>
                <li className="flex items-center gap-3 text-sm text-textMain">
                  <Check className="w-5 h-5 text-blue-600 flex-shrink-0" /> 15
                  PDF Exports / Day
                </li>
              </ul>
              <button
                onClick={() => handleUpgrade(SubscriptionTier.Basic)}
                disabled={currentTier !== SubscriptionTier.Free}
                className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-200 mt-auto"
              >
                {currentTier === SubscriptionTier.Basic
                  ? "Current Plan"
                  : "Upgrade to Scholar"}
              </button>
            </div>

            {/* Pro Tier */}
            <div className="bg-surface rounded-2xl p-8 border-2 border-amber-400 shadow-2xl flex flex-col h-full relative overflow-hidden transition-transform hover:-translate-y-1 duration-300">
              <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-amber-400 to-orange-500 h-2"></div>
              <div className="absolute top-4 right-4 bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide border border-amber-200">
                Best Value
              </div>
              <div className="mb-6 p-4 bg-amber-100 w-fit rounded-2xl">
                <Crown className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-textMain mb-2">
                Mastermind Pro
              </h3>
              <div className="text-4xl font-bold text-textMain mb-6">
                $7.99{" "}
                <span className="text-sm text-textMuted font-medium">
                  / month
                </span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm font-medium text-textMain">
                  <Check className="w-5 h-5 text-amber-500 flex-shrink-0" />{" "}
                  Unlimited Quizzes
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-textMain">
                  <Check className="w-5 h-5 text-amber-500 flex-shrink-0" />{" "}
                  Unlimited Flashcards
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-textMain">
                  <Check className="w-5 h-5 text-amber-500 flex-shrink-0" /> Max
                  45 Questions
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-textMain">
                  <Check className="w-5 h-5 text-amber-500 flex-shrink-0" /> Max
                  100 Marks
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-textMain">
                  <Check className="w-5 h-5 text-amber-500 flex-shrink-0" />{" "}
                  Unlimited PDF Uploads
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-textMain">
                  <Check className="w-5 h-5 text-amber-500 flex-shrink-0" />{" "}
                  Unlimited PDF Exports
                </li>
              </ul>
              <button
                onClick={() => handleUpgrade(SubscriptionTier.Pro)}
                disabled={currentTier === SubscriptionTier.Pro}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-bold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-200 mt-auto"
              >
                {currentTier === SubscriptionTier.Pro
                  ? "Current Plan"
                  : "Get Full Access"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;
