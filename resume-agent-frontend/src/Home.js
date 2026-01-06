// src/Home.js
import React, { useState } from 'react';

// A simple component for displaying skills
const SkillTag = ({ skill }) => (
  <span className="inline-block bg-gray-700 rounded-full px-3 py-1 text-sm font-semibold text-gray-200 mr-2 mb-2">
    {skill}
  </span>
);

function Home() {
  // State for file inputs
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');

  // State for API responses
  const [analysisResult, setAnalysisResult] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalysis = async (e) => {
    e.preventDefault();
    if (!resumeFile || !jobDescription) {
      setError('Please upload a resume and paste a job description.');
      return;
    }
    setIsLoading(true);
    setError('');
    setAnalysisResult(null);
    setCoverLetter(''); // Clear previous cover letter

    const formData = new FormData();
    formData.append('resume_file', resumeFile);
    formData.append('job_description', jobDescription);

    try {
      const response = await fetch('http://localhost:8000/analyze/', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setAnalysisResult(data);
    } catch (err) {
      setError('Failed to get analysis. Is the backend server running?');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCoverLetter = async (e) => {
    e.preventDefault();
    if (!resumeFile || !jobDescription) {
      setError('Please upload a resume and paste a job description first.');
      return;
    }
    setIsLoading(true);
    setError('');
    setCoverLetter('');
    setAnalysisResult(null); // Clear previous analysis

    const formData = new FormData();
    formData.append('resume_file', resumeFile);
    formData.append('job_description', jobDescription);

    try {
        const response = await fetch('http://localhost:8000/generate-cover-letter/', {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setCoverLetter(data.cover_letter_text);
    } catch (err) {
        setError('Failed to generate cover letter.');
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen p-8 font-sans">
      <div className="container mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-300">
            Resume Improvement Agent
          </h1>
        </header>

        {/* --- Input Form --- */}
        <div className="max-w-3xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                1. Upload Your Resume
              </label>
              <div className="mt-1 flex items-center">
                 <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                    Choose File
                    <input
                      type="file"
                      onChange={(e) => setResumeFile(e.target.files[0])}
                      className="hidden"
                      accept=".pdf,.docx"
                    />
                  </label>
                  {resumeFile && <span className="ml-4 text-gray-400">{resumeFile.name}</span>}
              </div>
            </div>

            <div>
              <label htmlFor="job-description" className="block text-sm font-medium text-gray-300 mb-2">
                2. Paste Job Description
              </label>
              <textarea
                id="job-description"
                rows="10"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-200"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
              />
            </div>
          </div>

          {/* --- MODIFIED: Action Buttons --- */}
          <div className="mt-8 flex items-center justify-center space-x-4">
            <button
              onClick={handleAnalysis}
              disabled={isLoading || !resumeFile || !jobDescription}
              className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Analyzing...' : 'Analyze & Improve'}
            </button>
            <button
              onClick={handleCoverLetter}
              disabled={isLoading || !resumeFile || !jobDescription}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Generating...' : 'Generate Cover Letter'}
            </button>
          </div>
        </div>

        {error && <p className="text-center text-red-400 mt-4">{error}</p>}

        {/* --- Results Display --- */}
        {analysisResult && (
          <div className="mt-10 max-w-3xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Analysis Results</h2>
            <div className="space-y-4">
               <h3 className="text-xl font-semibold">Matching Score: {analysisResult.matching_score_percent}%</h3>
               <div>
                  <h4 className="font-semibold">Matched Skills:</h4>
                  <div className="mt-2 flex flex-wrap">{analysisResult.matched_skills.map(s => <SkillTag key={s} skill={s} />)}</div>
               </div>
               <div>
                  <h4 className="font-semibold">Missing Skills:</h4>
                  <div className="mt-2 flex flex-wrap">{analysisResult.missing_skills.map(s => <SkillTag key={s} skill={s} />)}</div>
               </div>
               <div>
                  <h4 className="font-semibold">Enhancement Suggestions:</h4>
                  <p className="text-gray-300 bg-gray-700 p-4 mt-2 rounded-md whitespace-pre-wrap">{analysisResult.enhancement_suggestions}</p>
               </div>
            </div>
          </div>
        )}

        {coverLetter && (
           <div className="mt-10 max-w-3xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Generated Cover Letter</h2>
            <div className="bg-gray-700 p-4 rounded-md">
              <p className="text-gray-300 whitespace-pre-wrap">{coverLetter}</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Home;