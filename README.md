# EduBridge

> **Agentic AI Framework for Inclusive Education** - Making education accessible, simple, and interactive for everyone!

EduBridge is an intelligent educational tool that helps students learn better by transforming complex textbook content into simplified, interactive learning materials. Upload a PDF or paste your notes, and let AI do the heavy lifting!

---

## What is EduBridge?

EduBridge solves a common problem: **students struggle to understand complex textbook content**. Our platform uses artificial intelligence to:

- **Extract & Organize** - Automatically structure your notes into topics and subtopics
- **Simplify Content** - Rewrite complex concepts in simple, child-friendly language
- **Create Mind Maps** - Visualize connections between concepts
- **Generate Flashcards** - Auto-create study cards for quick revision  

---

## Project Structure

```
EduBridge/
│
├── 📂 backend/                    # Flask REST API
│   ├── 📂 routes/                 # API endpoints
│   │   ├── text_routes.py        # Text extraction endpoints
│   │   ├── pdf_routes.py         # PDF upload endpoints
│   │   ├── simplify_routes.py    # Text simplification endpoints
│   │   ├── mindmap_routes.py     # Mind map generation endpoints
│   │   └── flashcard_routes.py   # Flashcard generation endpoints
│   │
│   ├── 📂 services/               # Business logic
│   │   ├── text_service.py       # Text processing logic
│   │   ├── simplify_service.py   # Simplification logic
│   │   ├── mindmap_service.py    # Mind map logic
│   │   └── flashcard_service.py  # Flashcard logic
│   │
│   ├── 📂 utils/                  # Utility functions
│   │   ├── gemini_client.py      # AI model configuration
│   │   └── response_formatter.py # API response formatting
│   │
│   ├── 📂 uploads/                # Uploaded PDF files
│   ├── app.py                     # Main Flask application
│   ├── requirements.txt           # Python dependencies
│   ├── .env                       # Environment variables 
│   └── .gitignore                 # Git ignore rules
│
├── 📂 frontend/                   # React + Vite Application
│   ├── 📂 src/
│   │   ├── 📂 pages/             # Page components
│   │   │   ├── Home.jsx          # Main learning dashboard
│   │   │   ├── History.jsx       # Past sessions
│   │   │   ├── Subjects.jsx      # Subject categories
│   │   │   └── About.jsx         # About page
│   │   │
│   │   ├── 📂 components/        # Reusable components
│   │   │   └── Sidebar.jsx       # Navigation sidebar
│   │   │
│   │   ├── 📂 services/          # API integration
│   │   │   └── api.js            # Axios API client
│   │   │
│   │   ├── App.jsx               # Main app component
│   │   ├── App.css               # Global styles
│   │   └── main.jsx              # Entry point
│   │
│   ├── public/                    # Static assets
│   ├── package.json               # Node dependencies
│   ├── package-lock.json          # Dependency lock file
│   ├── .env                       # Environment variables 
│   ├── .gitignore                 # Git ignore rules
│   ├── vite.config.js            # Vite configuration
│   ├── eslint.config.js          # Linting rules
│   └── tailwind.config.js        # Tailwind CSS config
│
├── README.md                      # Main documentation (this file)
└── .gitignore                     # Root git ignore rules
```

---

## Tech Stack

### **Backend**
- **Framework:** Flask 
- **AI Models:** 
  - Google Vertex AI with fine-tuned Gemini 2.5 Flash
- **PDF Processing:** PyMuPDF (fitz) - for extracting text from PDFs
- **API Architecture:** RESTful API with Blueprints
- **CORS:** Flask-CORS for cross-origin requests
- **Environment:** python-dotenv for configuration

### **Frontend**
- **Framework:** React 18 
- **Build Tool:** Vite 
- **Styling:** Tailwind CSS 
- **HTTP Client:** Axios (API requests)
- **Icons:** Lucide React (icon library)
- **Routing:** React Router v6 (page navigation)
- **State Management:** React Hooks (useState, useRef)

## Getting Started

### Prerequisites
Before you start, make sure you have:
- **Python 3.8+** - [Download](https://www.python.org/)
- **Node.js 16+** - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)
- **Google Generative AI API Key** - [Get it here](https://makersuite.google.com/app/apikey)

## Backend Setup

### Step 1: Navigate to Backend
```bash
cd backend
```

### Step 2: Create Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Create Environment Configuration
Create a `.env` file in the `backend` folder.

### Step 5: Run Backend Server
```bash
python app.py
```

✅ Backend runs on: **http://localhost:5000**

---

## Frontend Setup

### Step 1: Navigate to Frontend (in a new terminal)
```bash
cd frontend
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Create Environment Configuration
Create a `.env` file in the `frontend` folder:

### Step 4: Run Development Server
```bash
npm run dev
```

✅ Frontend runs on: **http://localhost:5173**

## How to Use EduBridge

1. **Open the app** → Go to http://localhost:5173
2. **Input Content** → 
   - Paste text directly in the textarea, OR
   - Upload a PDF file
3. **Click Process** → Wait for AI to extract and organize content
4. **Choose Service** →
   - **Extract Topics** - See organized content structure
   - **Simplify** - Get child-friendly version
   - **Mind Map** - Visualize concept relationships
   - **Flashcards** - Study with interactive cards
5. **Learn!** → Start studying with your personalized materials

---

## Key Features

### Smart Content Organization
Automatically extracts topics and subtopics from any educational text, making content easy to navigate and understand.

### AI-Powered Simplification
Rewrites complex concepts in simple language perfect for learners with different abilities, including those with learning disabilities.

### Interactive Mind Maps
Visualizes connections between concepts using an intuitive node-based system with color-coded relationships.

### Auto-Generated Flashcards
Creates interactive study cards with flipping animation, perfect for quick revision and memorization.

### PDF Support
Upload NCERT textbooks or any PDF document - the platform extracts and processes everything automatically.

## Quick Commands Reference

### Start Both Services (Recommended: Use 2 terminals)

**Terminal 1 - Backend:**
```bash
cd backend
venv\Scripts\activate  # or: source venv/bin/activate
python app.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### View the App
Open your browser and go to: **http://localhost:5173**

---
