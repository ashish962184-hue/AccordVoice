# API + Database Specification

## 1. Database Schema (Supabase PostgreSQL)
The application uses UUID primary keys and enables required extensions. 

### Tables
1. **`profiles`:** Connects to `auth.users(id)`. Stores `full_name`, `avatar_url`, `preferred_language`.
2. **`conversations`:** Core session tracking. Includes `title`, `category`, `status`, participant details and languages, and `agreement_status`.
3. **`conversation_turns`:** Transcript tracking. Stores `speaker`, `language`, `original_text`, `normalized_text`, timestamps, and confidence.
4. **`claims`:** Extracted entities. Links to `conversation_id` and `turn_id`. Stores `subject`, `attribute`, `value_json`.
5. **`conflicts`:** Detected contradictions. Links conflicting `claim_a_id` and `claim_b_id`, severity, status, and clarification question.
6. **`clarifications`:** Active questions asked to resolve conflicts, and the participant's answers.
7. **`agreements`:** The generated draft. Tracks `participant_a_confirmed`, `participant_b_confirmed`, and JSON payload.
8. **`agreement_events`:** Audit trail for agreement states.

### Row Level Security (RLS)
- RLS enabled on all user-owned tables.
- Access derived strictly from authenticated Supabase user (`auth.uid()`).
- Child tables enforce access through the parent conversation's `user_id`.

## 2. API Routes (REST)

**Conversations:**
- `POST /api/conversations`
- `GET /api/conversations`
- `GET /api/conversations/:id`
- `PATCH /api/conversations/:id`
- `DELETE /api/conversations/:id`

**Conversation Turns & Audio:**
- `POST /api/conversations/:id/turns`
- `GET /api/conversations/:id/turns`
- `POST /api/conversations/:id/audio` *(Validates audio, processes STT, persists turn)*

**AI Analysis & Clarification:**
- `POST /api/conversations/:id/analyze` *(Claim extraction, conflict detection, state update)*
- `POST /api/conversations/:id/clarifications`
- `POST /api/conversations/:id/clarifications/:clarificationId/answer`

**Agreement Management & TTS:**
- `POST /api/conversations/:id/agreement/generate`
- `GET /api/conversations/:id/agreement`
- `POST /api/conversations/:id/agreement/confirm`
- `POST /api/conversations/:id/agreement/reject`
- `POST /api/conversations/:id/tts`

**Health:**
- `GET /api/health`

## 3. Data Validation (Zod)
Every external input and AI response must be validated using Zod.
Example:
```typescript
const ConversationCreateSchema = z.object({
  title: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(50),
  // participant schema...
});
```
Model-generated JSON is never trusted to mutate application state without passing Zod validation.
