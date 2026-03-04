# AutoGuide AI 🚗🤖
### AI-Powered Automotive Troubleshooting and Maintenance Agent

AutoGuide AI is a production-style full-stack AI application that helps users diagnose common vehicle issues and generate structured repair guidance using natural language.

Users can enter a vehicle's **year, make, model, or VIN**, describe a problem such as **engine overheating** or **headlight not turning on**, and receive:

- AI-generated troubleshooting and repair guidance
- likely causes and safety recommendations
- tools and parts to consider
- nearby repair shops using Google Places
- direct purchase links for parts
- retrieval-augmented answers grounded in ingested repair knowledge
- traceable agent steps and source citations

This project was built to go beyond a basic chatbot demo and showcase practical AI engineering patterns, including **RAG**, **tool orchestration**, **vector search with pgvector**, **background ingestion workflows**, **Dockerized local development**, and **cloud deployment**.

---

## Live Demo

**Frontend (Vercel):**  
`<YOUR_VERCEL_URL>`

**Backend API Health Check (Render):**  
`https://autoguide-ai.onrender.com/health`

---

## Screenshots

Add your screenshots after uploading them to your repository.

```md
![Dashboard](./screenshots/dashboard.png)
![Generated Guide](./screenshots/generated-guide.png)
![Agent Trace](./screenshots/agent-trace.png)
![Sources Panel](./screenshots/sources-panel.png)
```

---

## Why This Project Matters

AutoGuide AI was designed to demonstrate more than a standard CRUD app or a simple chatbot interface. It highlights the ability to build an end-to-end AI product that combines:

- user-facing product thinking
- grounded LLM responses through retrieval
- backend orchestration across multiple tools and APIs
- production-style infrastructure and deployment
- domain-specific problem solving in automotive troubleshooting

From a recruiter and hiring-manager perspective, this project shows hands-on experience with modern AI application development, backend systems, cloud deployment, and practical API integration.

---

## Key Features

### AI Troubleshooting Agent
- Accepts natural language vehicle repair and maintenance questions
- Generates structured troubleshooting and repair guidance
- Supports real-world issue diagnosis instead of generic chatbot responses

### VIN Decode Support
- Decodes VIN data to infer vehicle details automatically
- Enriches vehicle context before generating guidance

### Retrieval-Augmented Generation
- Ingests automotive knowledge documents from local files
- Splits documents into chunks for retrieval
- Generates embeddings using OpenAI
- Stores vectors in PostgreSQL with pgvector
- Retrieves relevant chunks during guide generation
- Returns source citations with responses

### Agent Tool Orchestration
The backend coordinates multiple tools during each request, including:
- VIN decoding
- vector retrieval
- Google Places search for nearby shops
- parts purchase link generation
- LLM response generation

### Nearby Repair Shop Suggestions
- Uses Google Places API
- Prioritizes open shops where available
- Includes ratings, address, and Google Maps links

### Purchase Links
Generates search links for:
- Google Shopping
- Amazon
- eBay

### Agent Trace
- Displays backend tool execution steps
- Shows latency and retrieval result counts
- Improves transparency of the AI workflow

### Recent Searches
- Stores recent guide requests locally in the UI
- Allows users to rerun previous searches quickly

### Production-Style Infrastructure
- Dockerized PostgreSQL with pgvector for local development
- Background ingestion worker for async document processing
- Render backend deployment
- Vercel frontend deployment
- environment-based configuration for local and production use

---

## Recruiter-Friendly Highlights

- Built a production-style AI troubleshooting agent rather than a basic chat interface
- Implemented **RAG** with **PostgreSQL + pgvector** for source-grounded responses
- Integrated multiple external services including **OpenAI**, **Google Places**, and **NHTSA VIN Decode**
- Designed a tool-orchestrated backend workflow with transparent agent traces
- Used **Docker**, **Render**, and **Vercel** to support local development and cloud deployment
- Solved real product engineering challenges across AI output handling, retrieval pipelines, and environment configuration

---

## Tech Stack

### Frontend
- React
- Vite
- Tailwind CSS
- Axios

### Backend
- Node.js
- Express
- OpenAI SDK
- PostgreSQL
- pgvector
- Multer
- pdf-parse
- Pino
- Express Rate Limit

### APIs and External Services
- OpenAI API
- Google Places API
- NHTSA VIN Decode API
- Render
- Vercel

### Local Development and DevOps
- Docker
- Docker Compose
- PostgreSQL client tools (`psql`)
- GitHub

---

## Architecture Overview

```text
React Frontend (Vercel)
        ↓
Node.js / Express API (Render)
        ↓
AI Agent Orchestrator
   ├── OpenAI LLM generation
   ├── OpenAI embeddings
   ├── VIN decode tool
   ├── Google Places shop finder
   ├── Purchase link generator
   └── RAG retrieval
            ↓
PostgreSQL + pgvector (Render / Docker local)
```

---

## How It Works

### 1. User Input
The user enters:
- year / make / model or VIN
- a natural language vehicle problem description

Example inputs:
- "Headlight not turning on"
- "Engine overheating while driving"
- "Car won't start after battery replacement"

### 2. Vehicle Context Enrichment
If a VIN is provided, the backend attempts to decode it and enrich the request with vehicle metadata.

### 3. RAG Retrieval
The backend searches ingested automotive knowledge documents using:
- chunk embeddings
- cosine similarity search
- top-k retrieval from pgvector

### 4. External Tool Calls
The backend may also:
- fetch nearby repair shops
- generate parts purchase links

### 5. LLM Response Generation
The LLM generates a structured response with sections such as:
- summary
- safety guidance
- likely causes
- tools needed
- parts to consider
- diagnostic steps
- repair steps
- when to visit a mechanic
- questions to ask a mechanic

### 6. Frontend Rendering
The frontend displays:
- the generated guide
- shop suggestions
- purchase links
- citations
- agent trace

---

## Project Structure

```text
autoguide-ai/
│
├── docker-compose.yml
│
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js
│   ├── docs/
│   ├── middleware/
│   ├── models/
│   ├── rag/
│   │   ├── db.js
│   │   ├── embed.js
│   │   ├── init.sql
│   │   ├── jobs.js
│   │   ├── store.js
│   │   └── worker.js
│   ├── routes/
│   │   ├── agent.js
│   │   └── rag.js
│   ├── scripts/
│   │   └── ingestAllDocs.js
│   ├── tools/
│   │   ├── purchaseLinks.js
│   │   ├── retrieveDocs.js
│   │   ├── shopsGoogle.js
│   │   └── vinDecode.js
│   └── utils/
│       ├── chunkText.js
│       └── openaiClient.js
│
└── frontend/
    ├── package.json
    ├── src/
    │   ├── api/
    │   │   └── client.js
    │   ├── components/
    │   ├── pages/
    │   │   └── Dashboard.jsx
    │   ├── App.jsx
    │   └── main.jsx
    └── .env
```

---

## Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/aninan1512/autoguide-ai.git
cd autoguide-ai
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
OPENAI_API_KEY=your_openai_api_key
GOOGLE_PLACES_API_KEY=your_google_places_api_key
DATABASE_URL=postgres://autoguide:autoguide@localhost:5432/autoguide
PORT=5000
```

### 3. Start PostgreSQL and pgvector Locally

From the project root:

```bash
docker compose up -d
```

### 4. Initialize the Database Schema

Using Docker + PowerShell:

```powershell
Get-Content backend/rag/init.sql | docker exec -i autoguide_pg psql -U autoguide -d autoguide
```

Or using `psql` directly:

```bash
psql "postgres://autoguide:autoguide@localhost:5432/autoguide" -f backend/rag/init.sql
```

### 5. Ingest Documents

Place `.txt`, `.md`, or `.pdf` files into:

```text
backend/docs/
```

Then run:

```bash
cd backend
npm run ingest
```

### 6. Start the Backend

```bash
cd backend
npm run dev
```

Backend health check:

```text
http://localhost:5000/health
```

### 7. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Run the frontend:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

---

## Production Deployment

### Backend
Deployed on **Render** as a Node.js / Express web service.

### Database
Deployed on **Render PostgreSQL** with **pgvector** enabled.

### Frontend
Deployed on **Vercel**.

---

## Required Production Environment Variables

### Render Backend

```env
OPENAI_API_KEY=your_openai_api_key
GOOGLE_PLACES_API_KEY=your_google_places_api_key
DATABASE_URL=your_render_postgres_url
PORT=5000
```

### Vercel Frontend

```env
VITE_API_BASE_URL=https://autoguide-ai.onrender.com/api
```

---

## Production RAG Setup

After creating your Render PostgreSQL database:

### 1. Enable pgvector

Run in `psql`:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. Apply the Schema

```bash
psql "your_render_database_url" -f backend/rag/init.sql
```

### 3. Ingest Documents into Production

From `backend/`:

```powershell
$env:INGEST_BASE_URL="https://autoguide-ai.onrender.com"
npm run ingest
```

---

## Example Use Cases

- Diagnose headlight issues
- Troubleshoot engine overheating
- Identify causes of rough idle
- Investigate transmission slipping
- Recommend next steps for brake noise
- Suggest nearby repair shops for a vehicle issue
- Surface relevant ingested troubleshooting knowledge

---

## Engineering Challenges Solved

- Handling inconsistent LLM output structures safely in the UI
- Integrating pgvector with PostgreSQL for similarity search
- Building a document ingestion pipeline for automotive troubleshooting documents
- Managing local Docker-based development and cloud deployment
- Wiring multi-tool AI workflows into a single user-facing response
- Debugging environment variables and deployment issues across Render, Vercel, Docker, and PostgreSQL

---

## Future Improvements

- Multi-turn conversational repair assistant
- User accounts and persistent saved guides
- Streaming responses from the backend
- PDF export for generated repair plans
- Advanced filtering by make / model / year
- Admin ingestion dashboard
- Better citation highlighting by chunk relevance
- Voice input for hands-free troubleshooting
- Mobile-optimized interface

---

## Resume-Ready Project Highlights

### AI Agent and Retrieval-Augmented Generation
Built an AI-powered automotive troubleshooting agent using **React, Node.js, Express, OpenAI, PostgreSQL, and pgvector**, generating structured repair guidance with source-backed retrieval, VIN decoding, nearby repair shop suggestions, and parts search links.

### Production Deployment and Tool Orchestration
Deployed the frontend on **Vercel** and backend on **Render**, integrating vector search, async document ingestion, Google Places, and agent trace visibility to demonstrate production-style AI application architecture.

---

## Author

**Aaron Ninan**  
GitHub: (https://github.com/aninan1512)

---

## License

This project is for **educational and portfolio purposes**.
