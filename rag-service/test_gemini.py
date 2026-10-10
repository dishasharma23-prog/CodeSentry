import os
from dotenv import load_dotenv
load_dotenv()
import google.generativeai as genai

api_key = os.getenv("LLM_API_KEY")
print(f"Key loaded: {'yes' if api_key else 'no'}")

genai.configure(api_key=api_key)

print("Listing models...")
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(m.name)

print("Testing gemini-1.5-flash...")
model = genai.GenerativeModel('gemini-1.5-flash')
try:
    response = model.generate_content("Hello")
    print(response.text)
except Exception as e:
    print("Error:", e)

print("Testing gemini-3.6-flash...")
model2 = genai.GenerativeModel('gemini-3.6-flash')
try:
    response = model2.generate_content("Hello")
    print(response.text)
except Exception as e:
    print("Error:", e)
