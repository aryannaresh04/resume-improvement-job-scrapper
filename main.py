# main.py

import io
import os
import docx
import pdfplumber
import spacy
import google.generativeai as genai
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from typing import Annotated, Optional
from fastapi.middleware.cors import CORSMiddleware

# Import the new scraping function
from job_scraper import scrape_indeed_jobs 

# Load environment variables from a .env file
load_dotenv()
# --- Gemini API Configuration ---
# Configure the client with your API key
try:
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY not found in environment variables.")
    genai.configure(api_key=api_key)
    # Initialize the specific model
    model = genai.GenerativeModel('gemini-2.5-flash')
except Exception as e:
    print(f"Fatal Error: Could not initialize Gemini client: {e}")
    model = None

# --- FastAPI Application Setup ---
app = FastAPI(
    title="Resume Improvement Agent API",
    description="An AI agent for resume tailoring, analysis, and cover letter generation.",
    version="0.2.1" # Updated version
)

# Configure CORS to allow the frontend to communicate with this backend
origins = [
    "http://localhost:3000",  # Default for React/Next.js development
    # Add other origins if needed, e.g., your production frontend URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- NLP and Skills Configuration ---
# Load the spaCy model for Named Entity Recognition (NER)
nlp = spacy.load("en_core_web_sm")

# A predefined list of skills for simple keyword matching.
SKILLS_LIST = [
    "python", "java", "c++", "c", "c#", "javascript", "typescript", "html", "css",
    "react", "angular", "vue.js", "next.js", "fastapi", "node.js", "django", "flask",
    "sql", "mysql", "postgresql", "mongodb", "redis",
    "aws", "azure", "google cloud", "gcp", "docker", "kubernetes", "terraform",
    "git", "github", "gitlab", "jira", "tailwind css",
    "machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn",
    "data analysis", "pandas", "numpy", "nlp", "computer vision",
    "project management", "agile", "scrum", "product management"
]

# --- Core Service Functions ---

def extract_text_from_resume(file: UploadFile) -> str:
    """Extracts raw text from an uploaded PDF or DOCX file."""
    file_extension = file.filename.split('.')[-1].lower()
    file_content = io.BytesIO(file.file.read())
    text = ""
    
    if file_extension == 'pdf':
        try:
            with pdfplumber.open(file_content) as pdf:
                for page in pdf.pages:
                    text += (page.extract_text() or "") + "\n"
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error processing PDF: {e}")
    elif file_extension == 'docx':
        try:
            doc = docx.Document(file_content)
            for para in doc.paragraphs:
                text += para.text + "\n"
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error processing DOCX: {e}")
    else:
        raise HTTPException(status_code=415, detail="Unsupported file type. Please upload PDF or DOCX.")
        
    return text

def analyze_text_with_nlp(text: str) -> dict:
    """Analyzes text to find named entities and matching skills from SKILLS_LIST."""
    doc = nlp(text)
    
    # Extract named entities (like names, organizations, etc.)
    entities = {}
    for ent in doc.ents:
        if ent.label_ not in entities:
            entities[ent.label_] = []
        entities[ent.label_].append(ent.text.strip())
    # De-duplicate entities
    for label, items in entities.items():
        entities[label] = sorted(list(set(items)))
        
    # Find skills using a simple text search
    found_skills = {skill for skill in SKILLS_LIST if skill in text.lower()}
    
    return {"entities": entities, "skills": sorted(list(found_skills))}

def generate_suggestions(resume_text: str, missing_skills: list) -> str:
    """Uses the Gemini model to generate resume enhancement suggestions."""
    if not model:
        return "Error: Gemini client not initialized."
    if not missing_skills:
        return "No missing skills identified. The resume appears well-aligned."

    prompt = f"""
    You are an expert career coach. Your task is to rewrite one or two bullet points
    from the provided resume to naturally include the following missing skills: {', '.join(missing_skills)}.
    Do not invent new experiences. Enhance existing points subtly.
    Output only the rewritten bullet points.

    **Original Resume Text (excerpt):**
    ---
    {resume_text[:4000]}
    ---
    """
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return f"Error calling Gemini API: {e}"

def generate_cover_letter_text(resume_text: str, job_description: str, matched_skills: list, resume_highlights: dict) -> str:
    """Generates a personalized cover letter using the Gemini API."""
    if not model:
        return "Error: Gemini client not initialized."

    person_name = resume_highlights.get("PERSON", ["the candidate"])[0]
    organizations = resume_highlights.get("ORG", [])
    
    prompt = f"""
    You are an expert career coach writing a concise, three-paragraph cover letter
    from the perspective of {person_name}. The tone must be professional and enthusiastic.

    **Paragraph 1:** State the position being applied for. Express strong, direct interest.
    **Paragraph 2:** Highlight 2-3 key skills from the matched skills list. Connect them to experiences
    in the resume, especially from organizations like {', '.join(organizations) if organizations else "previous roles"}.
    **Paragraph 3:** Connect the candidate's experience to the company's needs (inferred from the job description). Reiterate excitement and include a call to action.

    **Matched Skills to Highlight:** {', '.join(matched_skills)}
    **Job Description:**
    ---
    {job_description[:2000]}
    ---
    **Candidate's Resume:**
    ---
    {resume_text[:4000]}
    ---
    """
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return f"Error calling Gemini API: {e}"

# --- API Endpoints ---

@app.get("/")
async def root():
    """Root endpoint to check if the API is running."""
    return {"message": "Welcome to the Resume Improvement Agent API!"}

@app.post("/analyze/")
async def analyze_resume_and_jd(
    resume_file: Annotated[UploadFile, File(description="User's resume (PDF, DOCX).")],
    job_description: Annotated[str, Form(description="The job description text.")]
):
    """Analyzes resume against a job description and provides improvement suggestions."""
    resume_text = extract_text_from_resume(resume_file)
    if not resume_text:
        raise HTTPException(status_code=400, detail="Could not extract text from resume.")

    resume_analysis = analyze_text_with_nlp(resume_text)
    jd_analysis = analyze_text_with_nlp(job_description)

    required_skills = set(jd_analysis["skills"])
    resume_skills = set(resume_analysis["skills"])
    matched_skills = required_skills.intersection(resume_skills)
    missing_skills = list(required_skills.difference(resume_skills))

    matching_score = 0
    if required_skills:
        matching_score = round((len(matched_skills) / len(required_skills)) * 100)

    enhancement_suggestions = generate_suggestions(resume_text, missing_skills)

    return {
        "matching_score_percent": matching_score,
        "enhancement_suggestions": enhancement_suggestions,
        "matched_skills": sorted(list(matched_skills)),
        "missing_skills": sorted(list(missing_skills)),
    }

@app.post("/generate-cover-letter/")
async def create_cover_letter(
    resume_file: Annotated[UploadFile, File(description="User's resume (PDF, DOCX).")],
    job_description: Annotated[str, Form(description="The job description text.")]
):
    """Generates a personalized cover letter based on the resume and job description."""
    resume_text = extract_text_from_resume(resume_file)
    if not resume_text:
        raise HTTPException(status_code=400, detail="Could not extract text from resume.")

    resume_analysis = analyze_text_with_nlp(resume_text)
    jd_analysis = analyze_text_with_nlp(job_description)

    required_skills = set(jd_analysis["skills"])
    resume_skills = set(resume_analysis["skills"])
    matched_skills = list(required_skills.intersection(resume_skills))
    
    if not matched_skills:
        raise HTTPException(status_code=400, detail="No matching skills found to generate a compelling cover letter.")

    cover_letter = generate_cover_letter_text(
        resume_text=resume_text,
        job_description=job_description,
        matched_skills=matched_skills,
        resume_highlights=resume_analysis.get("entities", {})
    )

    return {"cover_letter_text": cover_letter}

# --- UPDATED JOB SEARCH ENDPOINT ---
@app.post("/find-jobs/")
async def find_matching_jobs(
    resume_file: Annotated[UploadFile, File(description="User's resume (PDF, DOCX).")],
    # --- ADDED NEW OPTIONAL FIELD ---
    search_query: Annotated[Optional[str], Form(description="Specific job title or query to search for (e.g., 'Python Developer').")] = None,
    location: Annotated[Optional[str], Form(description="Job location to search for (e.g., 'New York', 'remote').")] = "remote"
):
    """
    Extracts skills from the resume and searches Indeed for matching job listings.
    Prioritizes the 'search_query' if provided.
    """
    resume_text = extract_text_from_resume(resume_file)
    if not resume_text:
        raise HTTPException(status_code=400, detail="Could not extract text from resume.")

    # 1. Extract Skills from Resume (we'll return this for context)
    resume_analysis = analyze_text_with_nlp(resume_text)
    extracted_skills = resume_analysis.get("skills", [])
    
    search_terms_list = []
    search_source = "" # To tell the frontend what we searched for

    if search_query:
        # If user provided a specific query, use that.
        search_terms_list = search_query.split() # Split query into a list
        search_source = f"user query: '{search_query}'"
    elif extracted_skills:
        # --- IMPROVED FALLBACK ---
        # Use the top skills from the resume (e.g., "c c++")
        search_terms_list = extracted_skills
        search_source = f"resume skills: {', '.join(search_terms_list)}"
    else:
        # No query and no skills found
        raise HTTPException(status_code=400, detail="No search query provided and no skills found in resume.")

    # 2. Get Job Listings
    job_listings = scrape_indeed_jobs(
        search_keywords=search_terms_list,
        location=location,
        max_results=10
    )

    # 3. Return the findings
    return {
        "search_source": search_source, # Info on what we searched for
        "search_terms": search_terms_list,
        "location_searched": location,
        "job_count": len(job_listings),
        "job_listings": job_listings,
        "all_extracted_skills": extracted_skills # Return all skills for user info
    }

# --- Main Execution Block ---
# Allows running the server directly with `python main.py`
if __name__ == "__main__":
    import uvicorn
    # Check if the Gemini model was loaded before starting the server
    if not model:
        print("Exiting: Gemini model could not be initialized. Please check your API key and configuration.")
    else:
        print("Starting FastAPI server...")
        uvicorn.run(app, host="0.0.0.0", port=8000)