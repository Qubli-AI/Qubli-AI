import React from "react";
import { X, Check, Zap, Crown, Star } from "lucide-react";

import StorageService from "..//services/storageService.js";
import { SubscriptionTier } from "../../server/config/types.js";

// DX: Define Tier data outside the component for better separation and reusability
const TIER_DATA = {
  [SubscriptionTier.Free]: {
    title: "Free Starter",
    price: "$0",
    icon: Star,
    diffClass: false,
    colorClasses: {
      iconBg: "bg-gray-100",
      iconText: "text-gray-500",
      check: "text-green-500",
      border: "border-border",
      buttonBg: "bg-surfaceHighlight",
      buttonText: "text-textMuted",
    },
    features: [
      "7 Quizzes / Day",
      "3 Flashcard Sets / Day",
      "Max 10 Questions",
      "Max 30 Marks",
      "3 PDF Uploads / Day",
      "3 PDF Exports / Day",
      "Upload 1 PDF per quiz",
    ],
  },
  [SubscriptionTier.Basic]: {
    title: "Scholar Basic",
    price: "$3.99",
    icon: Zap,
    diffClass: false,
    colorClasses: {
      iconBg: "bg-blue-100",
      iconText: "text-blue-600",
      check: "text-blue-600",
      border: "border-blue-300 ring-2 ring-blue-100", // UI/Design: Use ring for emphasis
      buttonBg: "bg-blue-600 hover:bg-blue-700",
      buttonText: "text-white",
    },
    features: [
      "30 Quizzes / Day",
      "15 Flashcard Sets / Day",
      "Max 25 Questions",
      "Max 60 Marks",
      "15 PDF Uploads / Day",
      "15 PDF Exports / Day",
      "Upload 1 PDF per quiz",
    ],
  },
  [SubscriptionTier.Pro]: {
    title: "Mastermind Pro",
    price: "$7.99",
    icon: Crown,
    diffClass: true,
    colorClasses: {
      iconBg: "bg-amber-100",
      iconText: "text-amber-600",
      check: "text-amber-500",
      border: "border-amber-400 ring-2 ring-amber-200",
      buttonBg: "",
      buttonText: "text-white",
    },
    features: [
      "Unlimited Quizzes",
      "Unlimited Flashcards",
      "Max 45 Questions",
      "Max 100 Marks",
      "Unlimited PDF Uploads",
      "Unlimited PDF Exports",
      "Upload multiple PDF's per quiz",
    ],
  },
};

// DX: Separate Tier Card component
const TierCard = ({ tier, currentTier, handleUpgrade }) => {
  const data = TIER_DATA[tier];
  const Icon = data.icon;
  const isCurrent = currentTier === tier;
  const isUpgradeable = !isCurrent && currentTier !== SubscriptionTier.Pro; // UX: Only allow upgrade if not already the best tier

  // UX: Define button text based on status
  const buttonText = isCurrent
    ? "Current Plan"
    : tier === SubscriptionTier.Pro
    ? "Get Full Access"
    : "Upgrade Now";

  // UI/Design: Apply a primary color shadow to the Basic/Pro tiers for visual weight
  const shadowClass =
    tier === SubscriptionTier.Basic
      ? "shadow-lg shadow-blue-200"
      : tier === SubscriptionTier.Pro
      ? "shadow-xl shadow-amber-300"
      : "shadow-lg";

  return (
    <div
      className={`bg-surface rounded-2xl p-8 border ${
        data.colorClasses.border
      } ${shadowClass} flex flex-col h-full relative overflow-hidden transition-all hover:scale-[1.01] duration-300 ${
        isCurrent
          ? "ring-4 ring-offset-2 ring-offset-surfaceHighlight ring-opacity-50"
          : "" // UI/UX: Stronger visual feedback for the Current Plan
      }`}
    >
      {/* Design: Pro Tier Accent Bar and Tag */}
      {tier === SubscriptionTier.Pro && (
        <>
          <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-amber-400 to-orange-500 h-1.5"></div>
          <div className="absolute top-4 right-4 bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide border border-amber-200 shadow-sm">
            Best Value
          </div>
        </>
      )}

      {/* Icon Section */}
      <div className={`mb-6 p-4 ${data.colorClasses.iconBg} w-fit rounded-xl`}>
        {" "}
        {/* UI/Design: Rounded-xl for consistency */}
        <Icon className={`w-8 h-8 ${data.colorClasses.iconText}`} />
      </div>

      {/* Title & Price Section */}
      <h3 className="text-xl font-bold text-textMain mb-2">{data.title}</h3>
      <div className="text-4xl font-bold text-textMain mb-6">
        {data.price}{" "}
        <span className="text-sm text-textMuted font-medium">/ month</span>
      </div>

      {/* Features List */}
      <ul className="space-y-4 mb-8 flex-1 border-t border-border pt-6">
        {" "}
        {/* UI: Add top border/padding for visual grouping */}
        {data.features.map((feature) => (
          <li
            key={feature}
            className={`flex items-center gap-3 text-sm ${
              tier === SubscriptionTier.Free
                ? "text-textMuted"
                : "text-textMain font-medium" // UI: Differentiate feature text color for paid vs free
            }`}
          >
            <Check
              className={`w-5 h-5 ${data.colorClasses.check} flex-shrink-0`}
            />{" "}
            {feature}
          </li>
        ))}
      </ul>

      {/* Button Section */}
      <button
        onClick={() => handleUpgrade(tier)}
        disabled={isCurrent || !isUpgradeable}
        className={`w-full py-4 rounded-xl ${data.colorClasses.buttonBg} ${
          data.colorClasses.buttonText
        } text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-auto ${
          isCurrent ? "border border-border/50 shadow-none" : ""
        }`}
        style={
          data.diffClass
            ? { background: "linear-gradient(to right, #f59e0b, #f97316)" }
            : {}
        }
      >
        {buttonText}
      </button>
    </div>
  );
};

const SubscriptionModal = ({ onClose, onUpgrade, currentTier }) => {
  // DX: Simplified function, no need to pass currentTier check here
  const handleUpgrade = (tier) => {
    // UX: Use a modern custom modal or dialog if available, not native window.confirm
    // Simulate payment processing
    const confirmPayment = window.confirm(
      `Proceed to upgrade to ${TIER_DATA[tier].title} for ${TIER_DATA[tier].price}/month? (Simulated Payment)`
    );
    if (confirmPayment) {
      StorageService.upgradeTier(tier);
      onUpgrade();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300" // UI/UX: Increased backdrop opacity and blur for better focus
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl p-0 md:p-4" // UX: Removed p-4 from parent, let child elements manage padding
        onClick={(e) => e.stopPropagation()}
      >
        {/* Desktop Close Button (Positioned outside the main modal content) */}
        <button
          onClick={onClose}
          className="hidden md:block absolute top-7 right-9 p-2 text-black/90 hover:text-white hover:bg-white/10 rounded-full transition-colors z-50"
          title="Close"
        >
          <X className="w-7 h-7" />
        </button>

        {/* Scrollable container & Main content wrapper */}
        <div className="max-h-[90vh] overflow-y-auto custom-scrollbar rounded-2xl bg-white shadow-2xl">
          {/* Header/Title Section (UX: Give the modal a clear purpose) */}
          <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm p-6 border-b border-border md:rounded-t-2xl">
            <h2 className="text-3xl font-extrabold text-textMain flex items-center gap-3">
              <Crown className="w-7 h-7 text-amber-500 fill-amber-100" /> Unlock
              Premium Features
            </h2>
            <p className="text-textMuted mt-1">
              Choose the plan that's right for your study goals.
            </p>
            {/* Mobile Close Button (Integrated into header) */}
            <button
              onClick={onClose}
              className="md:hidden absolute top-5 right-5 p-2 bg-surfaceHighlight text-textMuted rounded-full hover:bg-surface transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 md:p-10">
            {" "}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <TierCard
                tier={SubscriptionTier.Free}
                currentTier={currentTier}
                handleUpgrade={handleUpgrade}
              />
              <TierCard
                tier={SubscriptionTier.Basic}
                currentTier={currentTier}
                handleUpgrade={handleUpgrade}
              />
              <TierCard
                tier={SubscriptionTier.Pro}
                currentTier={currentTier}
                handleUpgrade={handleUpgrade}
              />
            </div>
            {/* UX: Add a disclaimer about the simulation */}
            <p className="text-center text-xs text-textMuted mt-8 border-t border-border pt-4">
              *All payments are simulated in this environment. No actual charges
              will be incurred.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;
