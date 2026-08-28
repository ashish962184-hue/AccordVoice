# Demo & Evaluation Document

## 1. The "Golden Test" Scenario & Script
This 3–5 minute scenario proves AccordVoice is a true AI mediator, not just a transcription bot.

**Step 1: The Conflicting Statements**
- **Participant A:** "I will deliver 50 units on Friday."
- **Participant B:** "We agreed on 20 units on Monday."

**Step 2: AI Intervention & Conflict Detection**
- **AccordVoice AI:** "There's a conflict. I heard 50 units versus 20 units, and Friday versus Monday. Which terms should be included in the agreement?"

**Step 3: Resolution**
- **Participant (A or B):** "50 units on Monday."
- **AccordVoice AI:** "Understood."

**Step 4: Agreement Generation & Confirmation**
- **System:** Drafts an agreement showing 50 units on Monday.
- **Participant A:** Confirms.
- **Participant B:** Confirms.
- **System:** "AGREEMENT VERIFIED".

## 2. Innovation Claims for Judges
- **Semantic Conflict Detection:** It doesn't just match words; it understands semantic contradictions in dates, quantities, and responsibilities.
- **Active Clarification Loop:** When disagreement is found, the app pauses the workflow and asks targeted questions rather than randomly picking a winner.
- **Strict Mutual Confirmation:** Zero implicit agreements. Both parties must explicitly confirm, preventing misrepresentation.
- **Multilingual Normalization:** It can parse Participant A speaking English and Participant B speaking Telugu, normalizing claims accurately.

## 3. Evaluation Metrics & Expected Outputs
- **Reliability:** The end-to-end flow from audio input to VERIFIED status must complete without errors.
- **Accuracy of Claims:** Entity extraction must precisely capture the spoken quantities and dates without fabricating context.
- **Graceful Fallbacks:** If STT fails, an error is reported cleanly. If the user denies microphone access, the app alerts them properly.
- **Prompt Injection Defense:** Attempts to tell the AI to "Ignore previous instructions" are logged as conversation data, not executed as commands.

## 4. Edge Cases Handled
- **Partial Confirmation:** If one participant confirms and the other rejects/modifies, the agreement returns to draft state and requires re-confirmation.
- **Unclear Audio / Ambiguity:** AI explicitly asks for clarification rather than hallucinating details.
- **Mismatched Expectations:** Validates all required "Expected Agreement Fields" before allowing agreement generation.
