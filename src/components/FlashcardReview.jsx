import React, { useState, useEffect } from "react";
import { CheckCircle, Clock, RotateCcw } from "lucide-react";

import StorageService from "../services/storageService.js";

export const FlashcardReview = () => {
  const [cards, setCards] = useState([]);
  const [currentCard, setCurrentCard] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = () => {
    const allCards = StorageService.getFlashcards();
    const now = Date.now();
    const due = allCards.filter((c) => c.nextReview <= now);
    setCards(allCards);
    setDueCount(due.length);
    if (due.length > 0) {
      setCurrentCard(due[0]);
    } else {
      setCurrentCard(null);
    }
    setIsFlipped(false);
  };

  const handleRate = (rating) => {
    if (!currentCard) return;

    let interval = currentCard.interval;
    let ease = currentCard.easeFactor;

    if (rating === 1) {
      interval = 1;
    } else {
      if (interval === 0) interval = 1;
      else if (interval === 1) interval = 3;
      else interval = Math.ceil(interval * ease);

      ease = ease + (0.1 - (4 - rating) * (0.08 + (4 - rating) * 0.02));
      if (ease < 1.3) ease = 1.3;
    }

    const nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;

    const updatedCard = {
      ...currentCard,
      interval,
      easeFactor: ease,
      nextReview,
      repetition: currentCard.repetition + 1,
    };

    StorageService.updateFlashcard(updatedCard);
    loadCards();
  };

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center animate-in fade-in duration-500">
        <div className="p-4 bg-gray-100 rounded-full mb-4">
          <RotateCcw className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-textMain mb-2">
          No flashcards yet
        </h2>
        <p className="text-textMuted max-w-sm">
          Create a quiz and enable Flashcards during generation to study
          effectively.
        </p>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center animate-in fade-in duration-500">
        <div className="p-4 bg-green-100 rounded-full mb-4">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-textMain mb-2">
          All Caught Up!
        </h2>
        <p className="text-textMuted">
          You've reviewed all your due cards for now.
        </p>
        <p className="text-sm text-gray-400 mt-4">
          Total Cards: {cards.length}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto h-[60vh] flex flex-col pb-12">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-textMain">Review Session</h1>
        <span className="px-3 py-1 bg-white rounded-full text-sm text-textMuted border border-border shadow-sm">
          {dueCount} Due
        </span>
      </div>

      <div className="flex-1 perspective-1000 relative">
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className={`w-full h-full relative cursor-pointer transition-transform duration-500 transform-style-3d ${
            isFlipped ? "rotate-y-180" : ""
          }`}
        >
          {/* Front */}
          <div className="absolute inset-0 backface-hidden bg-white border border-border rounded-3xl p-10 flex flex-col items-center justify-center shadow-xl">
            <span className="absolute top-6 left-6 text-xs font-bold text-primary tracking-widest uppercase">
              Question
            </span>
            <p className="text-xl md:text-2xl font-medium text-center text-textMain overflow-y-auto max-h-[80%] custom-scrollbar px-2">
              {currentCard.front}
            </p>
            <div className="absolute bottom-6 text-sm text-gray-400 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Tap to reveal answer
            </div>
          </div>

          {/* Back */}
          <div className="absolute inset-0 backface-hidden bg-white border border-border rounded-3xl p-10 flex flex-col items-center justify-center shadow-xl rotate-y-180">
            <span className="absolute top-6 left-6 text-xs font-bold text-secondary tracking-widest uppercase">
              Answer
            </span>
            <div className="text-lg text-center text-gray-700 whitespace-pre-wrap overflow-y-auto max-h-[80%] custom-scrollbar px-2 w-full">
              {currentCard.back}
            </div>
          </div>
        </div>
      </div>

      {isFlipped && (
        <div className="mt-8 grid grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <button
            onClick={() => handleRate(1)}
            className="p-3 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-medium text-sm transition-colors shadow-sm"
          >
            Forgot
          </button>
          <button
            onClick={() => handleRate(2)}
            className="p-3 rounded-xl bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 font-medium text-sm transition-colors shadow-sm"
          >
            Hard
          </button>
          <button
            onClick={() => handleRate(3)}
            className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 font-medium text-sm transition-colors shadow-sm"
          >
            Good
          </button>
          <button
            onClick={() => handleRate(4)}
            className="p-3 rounded-xl bg-green-50 text-green-600 border border-green-200 hover:bg-green-100 font-medium text-sm transition-colors shadow-sm"
          >
            Easy
          </button>
        </div>
      )}

      {!isFlipped && <div className="mt-8 h-[50px]"></div>}
    </div>
  );
};
