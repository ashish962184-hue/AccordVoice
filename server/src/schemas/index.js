const { z } = require('zod');

// ─── Supported Languages ───
const SUPPORTED_LANGUAGES = [
  'en', 'hi', 'te', 'ta', 'kn', 'ml', 'mr', 'bn',
  'gu', 'pa', 'or', 'ur', 'fr', 'es', 'de', 'pt', 'ar', 'zh', 'ja', 'ko',
];

const LANGUAGE_LABELS = {
  en: 'English', hi: 'Hindi', te: 'Telugu', ta: 'Tamil',
  kn: 'Kannada', ml: 'Malayalam', mr: 'Marathi', bn: 'Bengali',
  gu: 'Gujarati', pa: 'Punjabi', or: 'Odia', ur: 'Urdu',
  fr: 'French', es: 'Spanish', de: 'German', pt: 'Portuguese',
  ar: 'Arabic', zh: 'Chinese', ja: 'Japanese', ko: 'Korean',
};

// ─── Categories ───
const CATEGORIES = [
  'business_negotiation', 'procurement', 'logistics', 'construction',
  'field_services', 'personal_commitments', 'team_coordination', 'customer_resolution',
  'other',
];

const CATEGORY_LABELS = {
  business_negotiation: 'Business Negotiation',
  procurement: 'Procurement',
  logistics: 'Logistics',
  construction: 'Construction',
  field_services: 'Field Services',
  personal_commitments: 'Personal Commitments',
  team_coordination: 'Team Coordination',
  customer_resolution: 'Customer Resolution',
  other: 'Other',
};

// ─── Conversation Status ───
const CONVERSATION_STATUSES = ['active', 'completed', 'archived'];
const AGREEMENT_STATUSES = ['pending', 'draft', 'awaiting_confirmation', 'partially_confirmed', 'verified', 'rejected', 'expired'];

// ─── Participant Schema ───
const ParticipantSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  language: z.string().min(2).max(10),
  role: z.string().trim().max(100).optional().default(''),
});

// ─── Conversation Create ───
const ConversationCreateSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120),
  category: z.string().trim().min(1).max(50),
  purpose: z.string().trim().max(500).optional().default(''),
  participantA: ParticipantSchema,
  participantB: ParticipantSchema,
  expectedFields: z.array(z.string().trim().max(50)).optional().default([]),
});

// ─── Conversation Update ───
const ConversationUpdateSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  status: z.enum(CONVERSATION_STATUSES).optional(),
  purpose: z.string().trim().max(500).optional(),
});

// ─── Conversation Turn ───
const TurnCreateSchema = z.object({
  speaker: z.enum(['participant_a', 'participant_b']),
  originalText: z.string().trim().min(1, 'Text is required').max(5000),
  language: z.string().min(2).max(10).optional(),
});

// ─── Clarification Answer ───
const ClarificationAnswerSchema = z.object({
  answer: z.string().trim().min(1, 'Answer is required').max(2000),
  speaker: z.enum(['participant_a', 'participant_b']),
});

// ─── Agreement Confirmation ───
const AgreementConfirmSchema = z.object({
  participant: z.enum(['participant_a', 'participant_b']),
});

// ─── AI Output Schemas ───
const ClaimOutputSchema = z.object({
  claims: z.array(z.object({
    speaker: z.string(),
    subject: z.string(),
    attribute: z.string(),
    value: z.any(),
    unit: z.string().optional().default(''),
    confidence: z.number().min(0).max(1).optional().default(0.9),
    source_turn_id: z.string().optional().default(''),
  })),
});

const ConflictOutputSchema = z.object({
  conflicts: z.array(z.object({
    type: z.string(),
    claim_a_index: z.number().optional(),
    claim_b_index: z.number().optional(),
    description: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium'),
    target_speaker: z.string().optional().default('participant_a'),
    clarification_question: z.string(),
    status: z.string().optional().default('open'),
  })),
});

const ConversationStateSchema = z.object({
  state: z.enum([
    'LISTENING', 'PROCESSING', 'UNDERSTANDING', 'CONFLICT_DETECTED',
    'CLARIFICATION_REQUIRED', 'AGREEMENT_DRAFTED', 'AWAITING_CONFIRMATION',
    'VERIFIED', 'REJECTED',
  ]),
  open_conflict_count: z.number().optional().default(0),
  missing_information: z.array(z.string()).optional().default([]),
  reason: z.string().optional().default(''),
});

const AgreementOutputSchema = z.object({
  agreement: z.record(z.any()),
  summary: z.string(),
  unresolved_items: z.array(z.string()).optional().default([]),
});

const ClarificationOutputSchema = z.object({
  question: z.string(),
  language: z.string().optional().default('en'),
  target_speaker: z.string().optional().default('participant_a'),
});

module.exports = {
  SUPPORTED_LANGUAGES,
  LANGUAGE_LABELS,
  CATEGORIES,
  CATEGORY_LABELS,
  CONVERSATION_STATUSES,
  AGREEMENT_STATUSES,
  ParticipantSchema,
  ConversationCreateSchema,
  ConversationUpdateSchema,
  TurnCreateSchema,
  ClarificationAnswerSchema,
  AgreementConfirmSchema,
  ClaimOutputSchema,
  ConflictOutputSchema,
  ConversationStateSchema,
  AgreementOutputSchema,
  ClarificationOutputSchema,
};
