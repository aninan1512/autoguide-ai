# AutoGuide AI 🚗🤖

AutoGuide AI is an AI-powered automotive maintenance assistant that helps users understand common vehicle maintenance and repair tasks.  
Users can enter a vehicle (make, model, year) and ask natural language questions to receive **structured, step-by-step guidance**, including required tools, parts, safety warnings, and best practices.

This project focuses on **practical problem-solving**, **clean UX**, and **real-world AI integration**, rather than a simple chatbot demo.

---

## ✨ Key Features

- 🔍 Ask vehicle-specific maintenance questions in natural language  
- 🧰 Structured responses:
  - Safety warnings  
  - Required tools  
  - Parts to buy  
  - Step-by-step instructions  
- 🕒 Recent Searches:
  - Automatically saves recent questions
  - Click to reuse previous searches
- ⚠️ Safety disclaimer built into the UI
- ⏳ Loading states and graceful error handling
- 💾 Search history stored in MongoDB Atlas

---

## 🧠 How It Works (High-Level)

1. User enters:
   - Vehicle details (make, model, year)
   - Maintenance question (e.g., *How to change washer fluid?*)
2. Frontend sends request to the backend API
3. Backend:
   - Uses an AI model to generate structured guidance
   - Saves the query to MongoDB Atlas
4. Frontend displays a clean, readable guide
5. Recent searches are updated automatically

---

## 🛠️ Tech Stack

### Frontend
- React (Vite)
- JavaScript (ES6+)
- CSS-in-JS (inline styles for simplicity)

### Backend
- Node.js
- Express.js
- OpenAI API (AI-generated responses)
- MongoDB Atlas (search history storage)

### Tools & Platform
- Visual Studio Code
- Git & GitHub
- REST APIs
- Environment-based configuration (`.env`)

---
## 📁 Project Structure


autoguide-ai/
│
├── frontend/                 # React frontend (Vite)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       └── main.jsx
│
├── backend/                  # Node.js + Express backend
│   ├── server.js
│   ├── db.js
│   ├── package.json
│   └── .env.example
│
├── README.md                 # Project documentation
└── .gitignore                # Git ignore rules

▶️ How to Run Locally
1️⃣ Clone the repository
git clone https://github.com/your-username/autoguide-ai.git
cd autoguide-ai

2️⃣ Backend setup
cd backend
npm install


Create a .env file inside backend/:

PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
DB_NAME=autoguide_ai
OPENAI_API_KEY=your_openai_api_key


Start the backend:

npm run dev


Backend runs on:

http://localhost:5000

3️⃣ Frontend setup

Open a new terminal:

cd frontend
npm install
npm run dev


Frontend runs on:

http://localhost:5173

⚠️ Important Note

This application provides AI-generated guidance for educational purposes only.
Always consult your vehicle’s owner manual or a qualified professional before performing maintenance or repairs.

📌 Why This Project?

This project demonstrates:

Full-stack development (React + Node.js)

Real-world AI integration

Clean API design

State management and UX considerations

Handling real issues like API limits and error states

It was built with recruiter readability and real usability in mind.

## 📸 Screenshots

### Main Interface
![Main UI](screenshots/Main.png)

### Generated Maintenance Guide
![Results](screenshots/Answer.png)

🚀 Future Improvements

Deploy live demo

User authentication & saved garages

Vector-based document retrieval (RAG) for higher accuracy

Export checklist / printable guides

Clear or filter recent searches

👤 Author

Aaron Ninan
B.Sc. Computer Science
Full-Stack Developer

GitHub: https://github.com/aninan1512

