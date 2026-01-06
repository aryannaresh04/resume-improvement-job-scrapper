# test_gemini.py

import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.environ["GOOGLE_API_KEY"])

# Use the latest stable model
model = genai.GenerativeModel("gemini-2.5-flash")

response = model.generate_content("Hello from Gemini!")
print(response.text)