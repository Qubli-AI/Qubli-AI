import { QuestionType } from "../../../server/config/types.js";

const AnswerLines = ({ marks, type }) => {
  const linesPerMark = type === QuestionType.LongAnswer ? 4 : 2;
  const numLines = (marks ?? 1) * linesPerMark || 3;
  const lineStyle = "border-b border-black/50 h-6";

  return (
    <div className="mt-4 space-y-3">
      {[...Array(numLines)].map((_, i) => (
        <div key={i} className={lineStyle}></div>
      ))}
    </div>
  );
};

const MCQOptions = ({ options }) => {
  const opts = options ?? ["True", "False"];
  return (
    <div className="grid grid-cols-1 gap-3 mt-3">
      {opts.map((opt, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-4 h-4 border border-black/70 rounded-sm"></div>
          <span>{opt}</span>
        </div>
      ))}
    </div>
  );
};

const PrintView = ({ quiz }) => {
  if (!quiz) return null;

  return (
    <div className="hidden print:block print-only bg-white text-black p-8 max-w-4xl mx-auto">
      <div className="border-b-2 border-black pb-4 mb-8">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h1 className="text-3xl font-bold uppercase tracking-wider">
              {quiz?.title}
            </h1>
            <p className="text-sm mt-1">
              Topic: {quiz?.topic} | Difficulty: {quiz?.difficulty}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold">Date: ____________________</div>
            <div className="text-sm font-bold mt-2">
              Name: ____________________
            </div>
          </div>
        </div>
        <div className="flex justify-between text-sm font-medium">
          <span>Time: Unlimited</span>
          <span>
            Total Marks: {quiz?.totalMarks ?? quiz?.questions?.length}
          </span>
        </div>
      </div>

      <div className="mb-8 p-4 border-2 border-black rounded-lg bg-gray-100">
        <h3 className="font-bold uppercase text-xs mb-2">INSTRUCTIONS:</h3>
        <ul className="list-disc list-inside text-sm space-y-1 text-gray-900">
          <li>Answer all questions.</li>
          <li>Write your answers clearly in the spaces provided.</li>
          {quiz?.examStyle?.includes("caie") && (
            <li>Use black or dark blue pen.</li>
          )}
          <li>Check the marks assigned to each question.</li>
        </ul>
      </div>

      <div className="space-y-8">
        {quiz?.questions?.map((q, idx) => (
          <div key={q?.id} className="break-inside-avoid">
            <div className="flex justify-between items-start mb-2">
              <div className="flex gap-2">
                <span className="font-bold">{idx + 1}.</span>
                <span className="font-medium">{q?.text}</span>
              </div>
              <span className="text-sm font-bold whitespace-nowrap text-gray-900">
                [{q?.marks ?? 1} {q?.marks === 1 ? "mark" : "marks"}]
              </span>
            </div>

            <div className="ml-6">
              {q?.type === QuestionType.MCQ ||
              q?.type === QuestionType.TrueFalse ? (
                <MCQOptions options={q?.options} />
              ) : (
                <AnswerLines marks={q?.marks ?? 1} type={q?.type} />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="break-before-page pt-12"></div>

      <div className="pt-8">
        <h2 className="text-2xl font-bold mb-6 border-b-2 border-black pb-2">
          Answer Key & Explanations
        </h2>
        <div className="space-y-6">
          {quiz?.questions?.map((q, idx) => (
            <div key={q?.id} className="break-inside-avoid">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-bold text-sm">{idx + 1}.</span>
                <span className="font-bold text-sm text-green-700">
                  Answer: {q?.correctAnswer}
                </span>
              </div>
              <p className="text-sm text-gray-900 ml-5">{q?.explanation}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrintView;
