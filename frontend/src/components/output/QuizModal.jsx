import { Loader } from "lucide-react";
import { QUIZ_TEMPLATE_HTML } from "../quiz_game";

const generateQuizHTML = (quizJson) => {
  if (!quizJson?.questions?.length) return QUIZ_TEMPLATE_HTML;

  const formattedData = quizJson.questions.map((q) => ({
    question: q.question,
    options: q.options,
    correct: q.correct_index,
  }));

  const assignment = `const QUIZ_DATA = ${JSON.stringify(formattedData)};`;
  const start = "// <<<QUIZ_DATA_PLACEHOLDER_START>>>";
  const end   = "// <<<QUIZ_DATA_PLACEHOLDER_END>>>";

  const si = QUIZ_TEMPLATE_HTML.indexOf(start);
  const ei = QUIZ_TEMPLATE_HTML.indexOf(end);
  if (si === -1 || ei === -1) return QUIZ_TEMPLATE_HTML;

  return (
    QUIZ_TEMPLATE_HTML.substring(0, si + start.length) +
    "\n" + assignment + "\n" +
    QUIZ_TEMPLATE_HTML.substring(ei)
  );
};

const QuizModal = ({ quizData, isLoading, error, onClose }) => (
  <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
    <div className="w-full h-full bg-black relative">
      <button onClick={onClose} className="absolute top-4 right-6 text-white text-2xl z-50">✖</button>
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <Loader size={50} className="animate-spin text-yellow-500" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-full text-red-400">{error}</div>
      ) : quizData ? (
        <iframe title="Quiz Game" className="w-full h-full" srcDoc={generateQuizHTML(quizData)} />
      ) : null}
    </div>
  </div>
);

export default QuizModal;