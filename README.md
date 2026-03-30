# Resume Analyser — Backend

AI-powered resume analyzer backend built with Express, TypeScript, MongoDB, and Groq AI.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Language | TypeScript |
| Database | MongoDB Atlas |
| ODM | Mongoose |
| Authentication | Firebase Admin SDK + JWT |
| AI/LLM | Groq API (LLaMA 3.3 70B) |
| PDF Parsing | pdf-parse |
| File Upload | Multer |
| Security | Helmet, HPP, CORS, express-rate-limit |

---

## Project Structure

```
src/
├── config/         # Env validation, Firebase Admin init
├── controllers/    # Route handlers (user, resumeAnalysis)
├── middlewares/    # Auth guard, PDF extractor, error handler, asyncHandler
├── models/         # Mongoose schemas (User, ResumeAnalysis)
├── routes/         # Express routers
├── services/       # Groq AI service
└── types/          # TypeScript interfaces
```

---

## How It Works

### Resume Analysis Flow

```
Client sends PDF
      ↓
Multer receives file (stored in memory buffer)
      ↓
extractPdfText middleware parses buffer → plain text
      ↓
analyzeResumeWithGemini() sends text to Groq API
      ↓
LLaMA 3.3 returns JSON { summary, strengths, weaknesses, suggestions, score }
      ↓
Result saved to MongoDB under the authenticated user
      ↓
Response returned to client
```

### Authentication Flow

```
Client signs in via Firebase (Google/Email)
      ↓
Firebase issues an ID token (client-side)
      ↓
Client sends ID token to POST /api/auth/auth/google
      ↓
Firebase Admin SDK verifies the token server-side
      ↓
If valid → user upserted in MongoDB
      ↓
Server issues JWT access token + refresh token
      ↓
Tokens set as HttpOnly cookies (not accessible via JS)
      ↓
All protected routes verify JWT via authMiddleware
      ↓
POST /api/auth/logout clears both cookies
```

### Why JWT on top of Firebase?

Firebase tokens are verified on every request by calling Google's servers — adding latency. Instead, we verify Firebase **once** at login, then issue our own short-lived JWT for subsequent requests. This gives us full control over token expiry, refresh logic, and payload without a Google round-trip on every API call.

---

## Environment Variables

Create a `.env` file in the root:

```env
# Server
PORT=3000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/resumeradar

# JWT
JWT_SECRET=your_access_secret
 

# Firebase Admin (from your service account JSON)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Groq
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxx

# CORS
CLIENT_URLS=http://localhost:5173
```

---

## Installation

```bash
# Install dependencies
npm install
```

---

## Running the Server

```bash
# Development (ts-node with hot reload)
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

---

## API Endpoints

### Auth & Users
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/google` | Verify Firebase token, issue JWT cookies | ✅  |
| POST | `/api/auth/logout` | Clear JWT cookies | ✅ |
| GET | `/api/auth/me` | Get current user profile | ✅ |
| PUT | `/api/auth/me` | Update current user | ✅ |

### Resume Analysis
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/resume/analyze` | Upload PDF or send plain text for analysis | ✅ |
| GET | `/api/resume/history` | Get all analyses for current user | ✅ |
| GET | `/api/resume/history/:id` | Get a single analysis by ID | ✅ |
| DELETE | `/api/resume/history/:id` | Delete an analysis | ✅ |

---

## Security

- **Helmet** — sets secure HTTP headers
- **HPP** — prevents HTTP parameter pollution
- **CORS** — whitelists only origins in `CLIENT_URLS`
- **Rate limiting** — stricter limits on auth routes, general limits on all others
- **HttpOnly cookies** — JWT tokens never exposed to JavaScript
- **Firebase Admin** — ID tokens verified server-side only, never trusted from client claims
- **API keys server-side only** — Groq key never exposed to the client
