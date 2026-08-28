# Product Requirements Document (PRD): AccordVoice

## 1. Product Mission & Problem Statement
**Problem:** People can participate in the same conversation while leaving with different understandings of what was agreed. This becomes significantly harder when conversations involve different languages, accents, ambiguous quantities, dates, prices, responsibilities, locations, deadlines, incomplete information, corrections, misunderstandings, and contradictory statements.

**Mission:** Build AccordVoice, an AI-powered conversational mediation and agreement-verification platform. AccordVoice must act as a neutral conversational mediator whose primary objective is to ensure that the participants reach a clearly understood and mutually confirmed agreement. 
The system must never silently resolve a disagreement by guessing.

## 2. Product Goal
Create a polished web application where two participants can conduct a conversation, potentially using different languages, while AccordVoice:
- Captures spoken conversation & transcribes speech
- Identifies speakers and detects language
- Extracts meaningful claims & entities (price, quantity, date, time, location, responsibility, deadline, etc.)
- Normalizes equivalent statements across languages
- Detects contradictions and ambiguities and explains what conflicts
- Generates targeted clarification questions & presents them to the appropriate participant
- Generates a structured proposed agreement and reads it back
- Requires explicit participant confirmation before marking as VERIFIED
- Stores the conversation and agreement securely, providing a clear audit trail.

## 3. Mandatory Features
1. **Authentication:** Email/password via Supabase Auth.
2. **Conversation Creation:** Setup session with title, participants, languages, purpose, and expected agreement fields. Supported languages: English, Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali.
3. **Conversation Interface:** Live transcript, speaker labels, timestamps, conversation status, detected claims, conflicts, clarification questions, and agreement state.
4. **Voice Input:** Start/stop recording, replay, submit audio, microphone status, gracefully handle permissions.
5. **Speech-to-Text (STT):** Server-controlled provider abstraction for structured transcription.
6. **Multilingual Understanding:** Normalize semantic meaning while preserving original language.
7. **Claim Extraction:** Extract structured claims from turns.
8. **Contradiction Detection:** Detect meaningful conflicts (quantities, dates, prices, etc.).
9. **Clarification Agent:** Generate concise clarification questions for conflicts.
10. **Agreement Drafting:** Draft agreement once conflicts are resolved.
11. **Mutual Confirmation:** Require explicit confirmation from both participants (States: PENDING, PARTIALLY_CONFIRMED, VERIFIED, REJECTED, EXPIRED).
12. **Text-to-Speech (TTS):** Playable final agreement.
13. **Conversation History:** Dashboard of previous sessions and verified agreements.
14. **Agreement Export:** Print-friendly agreement view and structured summary.

## 4. User Flow
Landing Page → Register / Login → Dashboard → Create Conversation → Configure Participants → Select Languages → Start Conversation → Capture Voice → Transcribe → Extract Claims → Detect Conflicts
- **If No Conflict:** Draft Agreement → Participant A Confirmation → Participant B Confirmation → VERIFIED → Agreement Record
- **If Conflict:** Clarification → Participant Response → Recalculate State → (Back to Agreement Draft)

## 5. Target Domains
- **Business Negotiation:** quantity, price, delivery, payment
- **Procurement:** supplier, units, delivery date, payment terms
- **Logistics:** shipment, location, delivery window, responsible party
- **Construction:** material quantities, deadlines, work ownership, site delivery
- **Field Services:** job requirements, location, appointment, completion responsibility
- **Personal Commitments:** who will do something, when, where, what is required
- **Team Coordination:** task assignments, deadlines, responsibilities, dependencies
- **Customer Resolution:** promised refund, replacement, delivery, escalation

## 6. Acceptance Criteria
- Reliable end-to-end conversation, conflict detection, clarification, agreement, and confirmation.
- Responsive design, usable mobile layout, and clear UI states.
- AI must not blindly choose between conflicting statements, must distinguish ambiguity from contradiction, and preserve speaker attribution.
- Fully secure API with Row Level Security (RLS) and server-side API keys.
