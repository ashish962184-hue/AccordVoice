# AccordVoice

AI-powered conversational mediation and agreement-verification platform.

> Make sure everyone leaves the conversation understanding the same thing.

AccordVoice listens for ambiguity, detects conflicting commitments, asks the right clarification questions, and creates a mutually confirmed agreement.

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+
- **Supabase** project (free tier works)
- **Google Gemini API key**

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd accordvoice
npm run install:all
```

### 2. Set Up Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and paste the contents of `supabase/migrations/001_initial_schema.sql`
3. Run the SQL to create all tables, indexes, RLS policies, and triggers
4. Go to **Settings → API** and copy your:
   - Project URL
   - `anon` public key
   - `service_role` secret key

### 3. Configure Environment

**Server** (`server/.env`):
```env
PORT=5000
NODE_ENV=development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
```

**Client** (`client/.env`):
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run Development
```bash
npm run dev
```
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Health Check: http://localhost:5000/api/health

## 🎯 Demo Scenario

1. **Register** and create a new conversation
2. **Participant A** says: "I will deliver 50 units on Friday."
3. **Participant B** says: "We agreed on 20 units on Monday."
4. Click **🧠 Analyze Conversation**
5. AccordVoice detects conflicts: quantity (50 vs 20) and delivery date (Friday vs Monday)
6. **Answer the clarification**: "50 units on Monday"
7. Click **📋 Generate Agreement**
8. **Both participants confirm** → Agreement VERIFIED ✅

## 🏗️ Architecture

```
┌─────────┐     ┌─────────┐     ┌──────────┐
│  React  │────▶│ Express │────▶│ Supabase │
│  Vite   │     │  API    │     │ Postgres │
└─────────┘     └────┬────┘     └──────────┘
                     │
                ┌────▼────┐
                │ Gemini  │
                │   AI    │
                └─────────┘
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/conversations` | Create conversation |
| GET | `/api/conversations` | List conversations |
| GET | `/api/conversations/:id` | Get conversation |
| PATCH | `/api/conversations/:id` | Update conversation |
| DELETE | `/api/conversations/:id` | Delete conversation |
| POST | `/api/conversations/:id/turns` | Add text turn |
| GET | `/api/conversations/:id/turns` | List turns |
| POST | `/api/conversations/:id/audio` | Upload audio (STT) |
| POST | `/api/conversations/:id/analyze` | Run AI analysis |
| POST | `/api/conversations/:id/clarifications` | Generate clarification |
| POST | `/api/conversations/:id/clarifications/:id/answer` | Answer clarification |
| POST | `/api/conversations/:id/agreement/generate` | Generate agreement |
| GET | `/api/conversations/:id/agreement` | Get agreement |
| POST | `/api/conversations/:id/agreement/confirm` | Confirm agreement |
| POST | `/api/conversations/:id/agreement/reject` | Reject agreement |
| POST | `/api/conversations/:id/tts` | Generate TTS text |

## 🔐 Security
- Supabase Auth with JWT validation
- Row Level Security (RLS) on all tables
- API keys are server-side only
- Zod validation on all inputs
- Prompt injection protection

## 🚢 Deployment

**Frontend (Vercel):**
```bash
cd client && npm run build
# Deploy dist/ to Vercel
```

**Backend (Render):**
- Set root directory to `server/`
- Build command: `npm install`
- Start command: `npm start`
- Add environment variables

## 📝 License
MIT
