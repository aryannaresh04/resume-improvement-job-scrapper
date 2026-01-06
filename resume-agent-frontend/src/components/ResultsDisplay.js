// src/components/ResultsDisplay.js

export default function ResultsDisplay({ data }) {
  if (!data) return null;

  const {
    matching_score_percent,
    enhancement_suggestions,
    matched_skills,
    missing_skills,
  } = data;

  return (
    <div className="w-full p-6 bg-gray-800 border border-gray-700 rounded-lg animate-fade-in">
      <h2 className="text-3xl font-bold mb-6 text-center text-emerald-400">
        Analysis Report
      </h2>

      {/* Matching Score Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-3 text-gray-200">Overall Match Score</h3>
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-emerald-600 bg-emerald-200">
                Job Fit
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-emerald-400">
                {matching_score_percent}%
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-4 mb-4 text-xs flex rounded bg-gray-700">
            <div
              style={{ width: `${matching_score_percent}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500 transition-all duration-1000 ease-out"
            ></div>
          </div>
        </div>
      </div>

      {/* Enhancement Suggestions Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-3 text-gray-200">💡 AI-Powered Suggestions</h3>
        <div className="p-4 bg-gray-900 rounded-lg border border-gray-600">
          <p className="text-gray-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
            {enhancement_suggestions}
          </p>
        </div>
      </div>

      {/* Skills Analysis Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xl font-semibold mb-3 text-gray-200">✅ Matched Skills</h3>
          <div className="flex flex-wrap gap-2">
            {matched_skills.map((skill) => (
              <span key={skill} className="bg-blue-500 text-white px-3 py-1 text-sm font-medium rounded-full">
                {skill}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-3 text-gray-200">🔍 Missing Skills</h3>
          <div className="flex flex-wrap gap-2">
            {missing_skills.map((skill) => (
              <span key={skill} className="bg-yellow-500 text-gray-900 px-3 py-1 text-sm font-medium rounded-full">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}