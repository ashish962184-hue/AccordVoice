# System Architecture & AI Design Document

## 1. System Overview
AccordVoice follows a modern Full-Stack architecture with a clear separation of concerns between the frontend (React/Vite) and backend (Node.js/Express), backed by a PostgreSQL database via Supabase.

### Core Stack
- **Frontend:** React.js, Vite, React Router, Tailwind CSS, Axios/Fetch API, Web Audio API / MediaRecorder API
- **Backend:** Node.js, Express.js, JWT-compatible architecture, Zod validation
- **Database:** Supabase PostgreSQL, Row Level Security (RLS)
- **AI Integration:** `@google/genai` (Gemini SDK) operating strictly on the backend.

## 2. Architecture & Data Flow
1. **Frontend:** Captures user audio via Web Audio API. 
2. **Backend (Audio processing):** Receives audio, validates MIME/size, and sends it to the STT provider.
3. **Backend (AI Engine):** Sends transcripts to Gemini for semantic reasoning (Claim Extraction → Conflict Detection → State Update → Clarification/Agreement).
4. **Database:** Stores structured outputs (claims, conflicts, clarifications, agreements) securely using RLS.
5. **Frontend (UI):** Reacts to the conversation state updates (e.g., LISTENING, CONFLICT_DETECTED, AWAITING_CONFIRMATION).

## 3. Directory Structure
```text
accordvoice/
├── client/
│   ├── src/
│   │   ├── components/ (auth, conversation, ai, agreement, forms, common)
│   │   ├── pages/ (Landing, Login, Register, Dashboard, NewConversation, Conversation, Agreement, Profile)
│   │   ├── hooks/, lib/, services/, context/, utils/
│   │   ├── App.jsx, main.jsx
│   └── vite.config.js
├── server/
│   ├── src/
│   │   ├── controllers/, routes/, middleware/
│   │   ├── services/ (ai, audio, agreement, conversation)
│   │   ├── providers/ (gemini, interfaces)
│   │   ├── schemas/, utils/, config/
│   │   └── server.js
│   └── .env.example
├── supabase/
│   └── migrations/ (001_initial_schema.sql)
```

## 4. AI Provider Abstraction
The AI system is designed with an abstraction layer so that other providers (Groq, OpenRouter, other STT/TTS) can be swapped in without altering route controllers.
```javascript
AIProvider
 ├── transcribe()
 ├── analyzeConversation()
 ├── extractClaims()
 ├── detectConflicts()
 ├── generateClarification()
 ├── generateAgreement()
 └── generateSpeech()
```
The integration must include request timeouts, retry logic, exponential backoff, structured output parsing, JSON validation (Zod), and safe error logging.

## 5. Security & Data Isolation
- **Authentication:** Supabase Auth manages sessions.
- **Row Level Security (RLS):** Enabled on all tables. Users can only access conversations they own (and related child records). Frontend-supplied `user_id` is never trusted.
- **API Keys:** `GEMINI_API_KEY`, Supabase service role keys, and other secrets are strictly server-side.
- **Data Privacy:** API keys, passwords, and tokens are never logged. Unnecessary raw audio is not persisted.
- **Prompt Injection Protection:** User-provided conversation content is treated as untrusted data and strictly separated from system instructions.
