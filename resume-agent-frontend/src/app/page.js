//  File: app/page.js

"use client"; // This line is crucial for Next.js App Router

import React, { useState } from 'react';

// A simple component for displaying skills
const SkillTag = ({ skill }) => (
  <span className="inline-block bg-gray-700 rounded-full px-3 py-1 text-sm font-semibold text-gray-200 mr-2 mb-2">
    {skill}
  </span>
);

// The main component for your page
export default function Page() {
  // State for file inputs
  const [resumeFile, setResumeFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- ADDED NEW STATE FOR LOCATION ---
  const [location, setLocation] = useState('remote'); // Default to 'remote'

  // State for API responses
  const [analysisResult, setAnalysisResult] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [jobSearchResults, setJobSearchResults] = useState(null);
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
    setCoverLetter(''); 
    setJobSearchResults(null); 

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
    setAnalysisResult(null); 
    setJobSearchResults(null); 

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

  const handleJobSearch = async (e) => {
    e.preventDefault();
    if (!resumeFile) {
      setError('Please upload a resume first to find jobs.');
      return;
    }
    setIsLoading(true);
    setError('');
    setAnalysisResult(null); // Clear other results
    setCoverLetter('');
    setJobSearchResults(null);

    const formData = new FormData();
    formData.append('resume_file', resumeFile);

    // --- UPDATED THIS SECTION ---
    // Add the location from our state
    formData.append('location', location); 

    // Add the search query (if it exists)
    if (searchQuery) {
      formData.append('search_query', searchQuery);
    }
    // --- END OF UPDATE ---

    try {
        const response = await fetch('http://localhost:8000/find-jobs/', {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || `HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setJobSearchResults(data);
    } catch (err) {
        setError(err.message || 'Failed to search for jobs.');
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <main className="bg-gray-900 text-white min-h-screen p-8 font-sans">
      <div className="container mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-300">
            ResuMate
          </h1>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-300">
            Resume Tailoring and Job Fit Search
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
                2. Paste Job Description (for Analysis / Cover Letter)
              </label>
              <textarea
                id="job-description"
                rows="8" // Shortened a bit
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-200"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
              />
            </div>

            <div>
              <label htmlFor="job-search" className="block text-sm font-medium text-gray-300 mb-2">
                3. Job Search Query (Optional)
              </label>
              <input
                type="text"
                id="job-search"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g., 'C++ Developer' or 'Frontend Engineer' (if blank, uses top resume skills)"
              />
            </div>

            {/* --- ADDED NEW LOCATION INPUT --- */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-2">
                4. Location
              </label>
              <input
                type="text"
                id="location"
                className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-200"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., 'remote', 'New York, NY', 'San Francisco'"
              />
            </div>
          </div>

          {/* --- Action Buttons --- */}
          <div className="mt-8 flex items-center justify-center space-x-4">
            <button
              onClick={handleAnalysis}
              disabled={isLoading || !resumeFile || !jobDescription}
              className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? '...' : 'Analyze & Improve'}
            </button>
            <button
              onClick={handleCoverLetter}
              disabled={isLoading || !resumeFile || !jobDescription}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? '...' : 'Generate Cover Letter'}
            </button>
            
            <button
              onClick={handleJobSearch}
              disabled={isLoading || !resumeFile}
              className="px-6 py-2 bg-teal-600 text-white font-semibold rounded-lg shadow-md hover:bg-teal-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-Click-me"
            >
              {isLoading ? 'Searching...' : 'Find Matching Jobs'}
            </button>
          </div>
        </div>

        {error && <p className="text-center text-red-400 mt-4">{error}</p>}

        {/* --- Results Display (No changes needed below) --- */}
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

        {jobSearchResults && (
          <div className="mt-10 max-w-3xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Matching Job Opportunities</h2>
            <div className="mb-4 text-gray-400">
              <p>
                Found <strong>{jobSearchResults.job_count}</strong> jobs for location "<strong>{jobSearchResults.location_searched}</strong>"
              </p>
               <p className="text-sm">
                (Search based on: <strong>{jobSearchResults.search_source}</strong>)
              </p>
            </div>
            
            {jobSearchResults.job_listings.length > 0 ? (
                <div className="space-y-4">
                    {jobSearchResults.job_listings.map((job, index) => (
                        <div key={index} className="bg-gray-700 p-4 rounded-md border-l-4 border-teal-500 transition-colors hover:bg-gray-600">
                            <h4 className="text-lg font-bold text-blue-300 hover:underline">
                                <a href={job.link} target="_blank" rel="noopener noreferrer">
                                    {job.title}
                                </a>
                            </h4>
                            <p className="text-gray-300 font-semibold">{job.company}</p>
                            <p className="text-sm text-gray-400">{job.location}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-400">No matching jobs were found with these criteria.</p>
            )}

            {jobSearchResults.all_extracted_skills && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                    <h4 className="font-semibold text-gray-300">All Skills Extracted from Resume:</h4>
                    <div className="mt-2 flex flex-wrap">
                        {jobSearchResults.all_extracted_skills.map(s => <SkillTag key={s} skill={s} />)}
                    </div>
                </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}