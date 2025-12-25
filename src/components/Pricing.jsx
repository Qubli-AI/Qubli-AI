import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Check, ArrowRight, ChevronDown } from "lucide-react";
import Navbar from "./Navbar.jsx";

const Pricing = () => {
  const [expandedFaq, setExpandedFaq] = useState(null);
  const pricingData = {
    intro:
      "Choose the perfect plan to unlock your learning potential. From casual learners to serious students, we have a plan for everyone.",
    plans: [
      {
        id: "free",
        name: "Free Starter",
        price: "$0",
        period: "/forever",
        description: "Perfect for exploring and light studying",
        highlighted: false,
        cta: "Get Started",
        ctaPath: "/auth",
        features: [
          { name: "7 Quizzes / Day" },
          { name: "3 Flashcard Sets / Day" },
          { name: "Max 10 Questions" },
          { name: "Max 30 Marks" },
          { name: "3 PDF Uploads / Day" },
          { name: "3 PDF Exports / Day" },
          { name: "Upload 1 PDF per quiz" },
        ],
      },
      {
        id: "basic",
        name: "Scholar Basic",
        price: "$4.99",
        period: "/month",
        description: "For serious learners who want more",
        highlighted: false,
        cta: "Upgrade Now",
        ctaPath: "/auth",
        features: [
          { name: "30 Quizzes / Day" },
          { name: "15 Flashcard Sets / Day" },
          { name: "Max 25 Questions" },
          { name: "Max 60 Marks" },
          { name: "15 PDF Uploads / Day" },
          { name: "15 PDF Exports / Day" },
          { name: "Upload 1 PDF per quiz" },
        ],
      },
      {
        id: "pro",
        name: "Mastermind Pro",
        price: "$9.99",
        period: "/month",
        description: "Maximum power for maximum results",
        highlighted: true,
        cta: "Go Pro",
        ctaPath: "/auth",
        features: [
          { name: "Unlimited Quizzes" },
          { name: "Unlimited Flashcards" },
          { name: "Max 45 Questions" },
          { name: "Max 100 Marks" },
          { name: "Unlimited PDF Uploads" },
          { name: "Unlimited PDF Exports" },
          { name: "Upload multiple PDF's per quiz" },
        ],
      },
    ],
    comparison: [
      {
        feature: "Daily Quiz Generations",
        free: "7",
        basic: "30",
        pro: "Unlimited",
      },
      {
        feature: "Daily Flashcard Sets",
        free: "3",
        basic: "15",
        pro: "Unlimited",
      },
      {
        feature: "PDF Uploads per Day",
        free: "3",
        basic: "15",
        pro: "Unlimited",
      },
      {
        feature: "Question Limit",
        free: "10",
        basic: "25",
        pro: "45",
      },
      {
        feature: "Learning Analytics",
        free: "Basic",
        basic: "Advanced",
        pro: "Detailed",
      },
    ],
    faq: [
      {
        q: "Can I change my plan anytime?",
        a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.",
      },
      {
        q: "Is there a free trial?",
        a: "Our Free plan is essentially a free trial with limited features. Upgrade anytime to unlock more.",
      },
      {
        q: "What's your refund policy?",
        a: "We offer a 30-day money-back guarantee on all paid subscriptions. No questions asked.",
      },
      {
        q: "Do you offer team or group discounts?",
        a: "Contact us for custom pricing for teams and educational institutions.",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background text-textMain">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-40 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Simple, Transparent <br />
            <span className="text-primary dark:text-blue-500 bg-clip-text">
              Pricing
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-textMuted mb-8 max-w-2xl mx-auto">
            {pricingData.intro}
          </p>
        </div>
      </section>

      {/* Pricing Cards Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-surface">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingData.plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative p-8 rounded-2xl border transition-all hover:scale-102 bg-background dark:bg-background/40 ${
                  plan.highlighted
                    ? "border-primary/50 shadow-xl shadow-primary/10 md:scale-105 md:hover:scale-105"
                    : "border-border hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-bold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-textMain mb-3">
                    {plan.name}
                  </h3>
                  <p className="text-textMuted text-sm mb-4.5">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-textMain">
                      {plan.price}
                    </span>
                    <span className="text-textMuted">{plan.period}</span>
                  </div>
                </div>

                <Link
                  to={plan.ctaPath}
                  className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all mb-8 ${
                    plan.highlighted
                      ? "bg-primary dark:bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-700/90"
                      : "border border-border text-textMain hover:border-primary/50 hover:bg-primary/5"
                  }`}
                >
                  {plan.cta} <ArrowRight className="w-4 h-4" />
                </Link>

                <div className="space-y-3 border-t border-border pt-6">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 mt-0.5 shrink-0 text-primary dark:text-blue-500" />
                      <span className="text-textMuted">{feature.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-textMain mb-6 text-center">
            Plan Comparison
          </h2>
          <p className="text-textMuted text-center mb-12">
            Detailed breakdown of all plan features
          </p>

          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full">
              <thead>
                <tr className="bg-surface/50 border-b border-border">
                  <th className="px-6 py-4 text-left font-bold text-textMain">
                    Feature
                  </th>
                  <th className="px-6 py-4 text-center font-bold text-textMain">
                    Free
                  </th>
                  <th className="px-6 py-4 text-center font-bold text-textMain">
                    Basic
                  </th>
                  <th className="px-6 py-4 text-center font-bold text-textMain">
                    Pro
                  </th>
                </tr>
              </thead>
              <tbody>
                {pricingData.comparison.map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-border hover:bg-surface/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-textMain">
                      {row.feature}
                    </td>
                    <td className="px-6 py-4 text-center text-textMuted">
                      {row.free}
                    </td>
                    <td className="px-6 py-4 text-center text-textMuted">
                      {row.basic}
                    </td>
                    <td className="px-6 py-4 text-center text-primary dark:text-blue-500 font-semibold">
                      {row.pro}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-surface">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-textMain mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <p className="text-textMuted text-center mb-12">
            Common questions about our pricing and plans
          </p>

          <div className="space-y-4">
            {pricingData.faq.map((item, idx) => (
              <div
                key={idx}
                className="border border-border rounded-xl overflow-hidden transition-all hover:border-primary/30 bg-background/60 dark:bg-background/40 dark:hover:border-blue-600"
              >
                <button
                  onClick={() =>
                    setExpandedFaq(expandedFaq === idx ? null : idx)
                  }
                  className="w-full px-6 py-4 flex items-center justify-between gap-4 hover:bg-surface/50 transition-colors text-left group point"
                >
                  <h3 className="font-semibold text-textMain text-sm sm:text-base group-hover:text-primary dark:group-hover:text-blue-400 transition-colors">
                    {item.q}
                  </h3>
                  <ChevronDown
                    className={`w-5 h-5 text-primary dark:text-blue-500 shrink-0 transition-transform duration-300 ${
                      expandedFaq === idx ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    expandedFaq === idx ? "max-h-96" : "max-h-0"
                  }`}
                >
                  <div className="px-6 py-4 bg-surface/30 border-t border-border/50">
                    <p className="text-textMuted text-sm sm:text-base leading-relaxed">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-border text-center">
            <p className="text-textMuted mb-4">
              Still have questions? We're here to help!
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary dark:bg-blue-700 dark:hover:bg-blue-700/80 text-white rounded-lg font-bold hover:bg-blue-700 transition-all"
            >
              Contact Us <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <p className="text-textMuted text-sm border-t border-border pt-6 mt-8 text-center pb-8">
        Last updated: Dec 25, 2025
      </p>
    </div>
  );
};

export default Pricing;
