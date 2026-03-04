import os
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

BASE_URL = os.getenv("BASE_URL")
MODEL = os.getenv("MODEL")

# Individual API Keys
API_KEY_IMAGEPROMPT = os.getenv("API_KEY_IMAGEPROMPT")
API_KEY_SIMPLIFY = os.getenv("API_KEY_SIMPLIFY")
API_KEY_MINDMAP = os.getenv("API_KEY_MINDMAP")
API_KEY_QUIZ = os.getenv("API_KEY_QUIZ")
API_KEY_MCQ = os.getenv("API_KEY_MCQ")
API_KEY_FLASHCARDS = os.getenv("API_KEY_FLASHCARDS")
OPEN_API = os.getenv("API_KEY_OPENAI")

def initialize_imageprompt_client():
    return OpenAI(api_key=API_KEY_IMAGEPROMPT, base_url=BASE_URL)

def initialize_simplify_client():
    return OpenAI(api_key=API_KEY_SIMPLIFY, base_url=BASE_URL)

def initialize_mindmap_client():
    return OpenAI(api_key=API_KEY_MINDMAP, base_url=BASE_URL)

def initialize_quiz_client():
    return OpenAI(api_key=API_KEY_QUIZ, base_url=BASE_URL)

def initialize_mcq_client():
    return OpenAI(api_key=API_KEY_MCQ, base_url=BASE_URL)

def initialize_flashcards_client():
    return OpenAI(api_key=API_KEY_FLASHCARDS, base_url=BASE_URL)

def initialize_openai_client():
    return OpenAI(api_key=OPEN_API, base_url=BASE_URL)
