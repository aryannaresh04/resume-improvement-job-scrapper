from jobspy import scrape_jobs
import pandas as pd
from typing import List, Dict, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def scrape_indeed_jobs(search_keywords: List[str], location: Optional[str] = "remote", max_results: int = 10) -> List[Dict]:
    """
    Scrapes job listings using the jobspy library.
    This is much more robust than manual BeautifulSoup parsing.
    """
    
    # 1. Prepare the search query
    query_string = " OR ".join(search_keywords)
    logger.info(f"Scraping with jobspy for: q='{query_string}', loc='{location}'")

    try:
        # 2. Scrape jobs
        # jobspy pulls a lot of jobs, so we limit it. 
        # results_wanted is per site, offset is the starting page.
        jobs: pd.DataFrame = scrape_jobs(
            site_name=["indeed"],  # We can add "linkedin", "ziprecruiter" later!
            search_term=query_string,
            location=location,
            results_wanted=max_results,
            country_indeed='India'  # Specify Indeed country, change if needed
        )
        
        if jobs is None or jobs.empty:
            logger.warning("jobspy returned no results (None or empty DataFrame).")
            return []

        # 3. Convert pandas DataFrame to the list[dict] format our API expects
        
        # Rename columns to match our existing API response
        # jobspy columns are like 'title', 'company', 'location', 'job_url'
        jobs_renamed = jobs.rename(columns={"job_url": "link"})
        
        # Handle potential missing columns gracefully
        expected_columns = ["title", "company", "location", "link"]
        output_jobs = []
        
        # to_dict('records') creates a list of dictionaries
        for job_dict in jobs_renamed.to_dict('records'):
            output_dict = {col: job_dict.get(col, "N/A") for col in expected_columns}
            output_jobs.append(output_dict)

        logger.info(f"Successfully scraped {len(output_jobs)} job listings.")
        return output_jobs

    except Exception as e:
        logger.error(f"An error occurred during job scraping with jobspy: {e}")
        return []

# Example of how to test this file directly
if __name__ == "__main__":
    test_jobs = scrape_indeed_jobs(search_keywords=["python", "developer"], location="remote")
    print(f"Found {len(test_jobs)} jobs:")
    for job in test_jobs:
        print(job)