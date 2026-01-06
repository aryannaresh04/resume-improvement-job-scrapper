// src/components/AnalysisForm.js

'use client';

import { useState } from 'react';
import ResultsDisplay from './ResultsDisplay'; // NEW IMPORT

export default function AnalysisForm() {
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    const formData = new FormData();
    formData.append('resume_file', resumeFile);
    formData.append('job_description', jobDescription);

    try {
      const response = await fetch('http://127.0.0.1:8000/analyze/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Error: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {!result && ( // Only show the form if there are no results yet
        <form onSubmit={handleSubmit} className="w-full space-y-8">
          {/* Resume Upload Section */}
          <div>
            <label htmlFor="resume-upload" className="block text-lg font-medium text-gray-300 mb-2">
              1. Upload Your Resume
            </label>
            <input
              id="resume-upload"
              type="file"
              onChange={(e) => setResumeFile(e.target.files[0])}
              className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600 cursor-pointer"
              accept=".pdf,.docx"
            />
            {resumeFile && <p className="mt-2 text-sm text-emerald-400">File selected: {resumeFile.name}</p>}
          </div>

          {/* Job Description Text Area */}
          <div>
            <label htmlFor="job-description" className="block text-lg font-medium text-gray-300 mb-2">
              2. Paste Job Description
            </label>
            <textarea
              id="job-description"
              rows={10}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full p-4 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
              placeholder="Paste the full job description here..."
            />
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button
              type="submit"
              className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-full hover:bg-emerald-700 disabled:bg-gray-500 transition-colors duration-300 ease-in-out"
              disabled={!resumeFile || !jobDescription || loading}
            >
              {loading ? 'Analyzing...' : 'Analyze and Improve'}
            </button>
          </div>
        </form>
      )}

      {/* Section to Display Results or Errors */}
      <div className="mt-12 w-full">
        {error && <div className="p-4 bg-red-900 border border-red-700 text-white rounded-lg"><p className="font-bold">An Error Occurred:</p>{error}</div>}

        {/* USE THE NEW COMPONENT TO DISPLAY RESULTS */}
        {result && <ResultsDisplay data={result} />}
      </div>
    </div>
  );
}