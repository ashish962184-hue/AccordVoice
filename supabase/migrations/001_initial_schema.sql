-- ============================================================
-- AccordVoice — Initial Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ────────────────────────────────────────────────────────
-- 1. Profiles
-- ────────────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────
-- 2. Conversations
-- ────────────────────────────────────────────────────────
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  purpose TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'archived')),
  participant_a_name TEXT NOT NULL,
  participant_a_language TEXT NOT NULL,
  participant_a_role TEXT DEFAULT '',
  participant_b_name TEXT NOT NULL,
  participant_b_language TEXT NOT NULL,
  participant_b_role TEXT DEFAULT '',
  expected_fields JSONB DEFAULT '[]'::jsonb,
  agreement_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (agreement_status IN ('pending', 'draft', 'awaiting_confirmation', 'partially_confirmed', 'verified', 'rejected', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- ────────────────────────────────────────────────────────
-- 3. Conversation Turns
-- ────────────────────────────────────────────────────────
CREATE TABLE public.conversation_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  speaker TEXT NOT NULL,
  language TEXT,
  original_text TEXT NOT NULL,
  normalized_text TEXT,
  confidence NUMERIC,
  start_time NUMERIC,
  end_time NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────
-- 4. Claims
-- ────────────────────────────────────────────────────────
CREATE TABLE public.claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  turn_id UUID REFERENCES public.conversation_turns(id) ON DELETE SET NULL,
  speaker TEXT NOT NULL,
  subject TEXT NOT NULL,
  attribute TEXT NOT NULL,
  value_json JSONB NOT NULL,
  confidence NUMERIC,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'superseded', 'withdrawn')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────
-- 5. Conflicts
-- ────────────────────────────────────────────────────────
CREATE TABLE public.conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  conflict_type TEXT NOT NULL,
  description TEXT NOT NULL,
  claim_a_id UUID REFERENCES public.claims(id) ON DELETE SET NULL,
  claim_b_id UUID REFERENCES public.claims(id) ON DELETE SET NULL,
  severity TEXT NOT NULL DEFAULT 'medium'
    CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'resolved', 'dismissed')),
  clarification_question TEXT,
  clarification_language TEXT,
  target_speaker TEXT,
  resolution_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- ────────────────────────────────────────────────────────
-- 6. Clarifications
-- ────────────────────────────────────────────────────────
CREATE TABLE public.clarifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  conflict_id UUID REFERENCES public.conflicts(id) ON DELETE CASCADE,
  target_speaker TEXT NOT NULL,
  language TEXT,
  question TEXT NOT NULL,
  answer TEXT,
  answer_normalized TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'answered', 'dismissed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  answered_at TIMESTAMPTZ
);

-- ────────────────────────────────────────────────────────
-- 7. Agreements
-- ────────────────────────────────────────────────────────
CREATE TABLE public.agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL UNIQUE REFERENCES public.conversations(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  agreement_json JSONB NOT NULL,
  summary TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'awaiting_confirmation', 'verified', 'rejected')),
  participant_a_confirmed BOOLEAN NOT NULL DEFAULT false,
  participant_b_confirmed BOOLEAN NOT NULL DEFAULT false,
  participant_a_confirmed_at TIMESTAMPTZ,
  participant_b_confirmed_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────
-- 8. Agreement Events (Audit Trail)
-- ────────────────────────────────────────────────────────
CREATE TABLE public.agreement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID NOT NULL REFERENCES public.agreements(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_created_at ON public.conversations(created_at DESC);
CREATE INDEX idx_conversation_turns_conversation_id ON public.conversation_turns(conversation_id);
CREATE INDEX idx_claims_conversation_id ON public.claims(conversation_id);
CREATE INDEX idx_conflicts_conversation_id ON public.conflicts(conversation_id);
CREATE INDEX idx_conflicts_status ON public.conflicts(status);
CREATE INDEX idx_clarifications_conversation_id ON public.clarifications(conversation_id);
CREATE INDEX idx_agreements_conversation_id ON public.agreements(conversation_id);
CREATE INDEX idx_agreement_events_agreement_id ON public.agreement_events(agreement_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_conversations_updated
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_agreements_updated
  BEFORE UPDATE ON public.agreements
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own conversations"
  ON public.conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own conversations"
  ON public.conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations"
  ON public.conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own conversations"
  ON public.conversations FOR DELETE USING (auth.uid() = user_id);

-- Conversation Turns
ALTER TABLE public.conversation_turns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view turns of own conversations"
  ON public.conversation_turns FOR SELECT
  USING (conversation_id IN (SELECT id FROM public.conversations WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert turns into own conversations"
  ON public.conversation_turns FOR INSERT
  WITH CHECK (conversation_id IN (SELECT id FROM public.conversations WHERE user_id = auth.uid()));

-- Claims
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view claims of own conversations"
  ON public.claims FOR SELECT
  USING (conversation_id IN (SELECT id FROM public.conversations WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert claims into own conversations"
  ON public.claims FOR INSERT
  WITH CHECK (conversation_id IN (SELECT id FROM public.conversations WHERE user_id = auth.uid()));

-- Conflicts
ALTER TABLE public.conflicts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view conflicts of own conversations"
  ON public.conflicts FOR SELECT
  USING (conversation_id IN (SELECT id FROM public.conversations WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert conflicts into own conversations"
  ON public.conflicts FOR INSERT
  WITH CHECK (conversation_id IN (SELECT id FROM public.conversations WHERE user_id = auth.uid()));
CREATE POLICY "Users can update conflicts of own conversations"
  ON public.conflicts FOR UPDATE
  USING (conversation_id IN (SELECT id FROM public.conversations WHERE user_id = auth.uid()));

-- Clarifications
ALTER TABLE public.clarifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view clarifications of own conversations"
  ON public.clarifications FOR SELECT
  USING (conversation_id IN (SELECT id FROM public.conversations WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert clarifications into own conversations"
  ON public.clarifications FOR INSERT
  WITH CHECK (conversation_id IN (SELECT id FROM public.conversations WHERE user_id = auth.uid()));
CREATE POLICY "Users can update clarifications of own conversations"
  ON public.clarifications FOR UPDATE
  USING (conversation_id IN (SELECT id FROM public.conversations WHERE user_id = auth.uid()));

-- Agreements
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view agreements of own conversations"
  ON public.agreements FOR SELECT
  USING (conversation_id IN (SELECT id FROM public.conversations WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert agreements into own conversations"
  ON public.agreements FOR INSERT
  WITH CHECK (conversation_id IN (SELECT id FROM public.conversations WHERE user_id = auth.uid()));
CREATE POLICY "Users can update agreements of own conversations"
  ON public.agreements FOR UPDATE
  USING (conversation_id IN (SELECT id FROM public.conversations WHERE user_id = auth.uid()));

-- Agreement Events
ALTER TABLE public.agreement_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view events of own agreements"
  ON public.agreement_events FOR SELECT
  USING (agreement_id IN (
    SELECT a.id FROM public.agreements a
    JOIN public.conversations c ON a.conversation_id = c.id
    WHERE c.user_id = auth.uid()
  ));
CREATE POLICY "Users can insert events into own agreements"
  ON public.agreement_events FOR INSERT
  WITH CHECK (agreement_id IN (
    SELECT a.id FROM public.agreements a
    JOIN public.conversations c ON a.conversation_id = c.id
    WHERE c.user_id = auth.uid()
  ));
