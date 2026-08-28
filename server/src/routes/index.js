const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  ConversationCreateSchema,
  ConversationUpdateSchema,
  TurnCreateSchema,
  ClarificationAnswerSchema,
  AgreementConfirmSchema,
} = require('../schemas');

const conversationCtrl = require('../controllers/conversationController');
const turnCtrl = require('../controllers/turnController');
const { upload, processAudio } = require('../controllers/audioController');
const analysisCtrl = require('../controllers/analysisController');
const clarificationCtrl = require('../controllers/clarificationController');
const agreementCtrl = require('../controllers/agreementController');
const ttsCtrl = require('../controllers/ttsController');

// ─── Health ───
router.get('/health', (req, res) => res.json({ status: 'ok' }));

// ─── Dashboard Stats ───
router.get('/dashboard/stats', authMiddleware, conversationCtrl.getDashboardStats);

// ─── Conversations ───
router.post('/conversations', authMiddleware, validate(ConversationCreateSchema), conversationCtrl.createConversation);
router.get('/conversations', authMiddleware, conversationCtrl.listConversations);
router.get('/conversations/:id', authMiddleware, conversationCtrl.getConversation);
router.patch('/conversations/:id', authMiddleware, validate(ConversationUpdateSchema), conversationCtrl.updateConversation);
router.delete('/conversations/:id', authMiddleware, conversationCtrl.deleteConversation);

// ─── Turns ───
router.post('/conversations/:id/turns', authMiddleware, validate(TurnCreateSchema), turnCtrl.addTurn);
router.get('/conversations/:id/turns', authMiddleware, turnCtrl.listTurns);

// ─── Audio Upload & STT ───
router.post('/conversations/:id/audio', authMiddleware, upload.single('audio'), processAudio);

// ─── Analysis (AI Mediation) ───
router.post('/conversations/:id/analyze', authMiddleware, analysisCtrl.analyzeConversation);
router.post('/conversations/:id/analysis', authMiddleware, analysisCtrl.analyzeConversation);
router.get('/conversations/:id/claims', authMiddleware, analysisCtrl.getClaims);
router.get('/conversations/:id/conflicts', authMiddleware, analysisCtrl.getConflicts);

// ─── Clarifications ───
router.post('/conversations/:id/clarifications', authMiddleware, clarificationCtrl.createClarification);
router.get('/conversations/:id/clarifications', authMiddleware, clarificationCtrl.listClarifications);
router.post('/conversations/:id/clarifications/:clarificationId/answer', authMiddleware, validate(ClarificationAnswerSchema), clarificationCtrl.answerClarification);
router.post('/conversations/:id/clarifications/:clarificationId/resolve', authMiddleware, validate(ClarificationAnswerSchema), clarificationCtrl.answerClarification);

// ─── Agreements & Verification ───
router.post('/conversations/:id/agreements', authMiddleware, agreementCtrl.generateAgreement);
router.post('/conversations/:id/agreement/generate', authMiddleware, agreementCtrl.generateAgreement);
router.get('/conversations/:id/agreements', authMiddleware, agreementCtrl.getAgreement);
router.get('/conversations/:id/agreement', authMiddleware, agreementCtrl.getAgreement);
router.post('/conversations/:id/agreements/:agreementId/confirm', authMiddleware, validate(AgreementConfirmSchema), agreementCtrl.confirmAgreement);
router.post('/conversations/:id/agreement/confirm', authMiddleware, validate(AgreementConfirmSchema), agreementCtrl.confirmAgreement);
router.post('/conversations/:id/agreements/:agreementId/reject', authMiddleware, validate(AgreementConfirmSchema), agreementCtrl.rejectAgreement);
router.post('/conversations/:id/agreement/reject', authMiddleware, validate(AgreementConfirmSchema), agreementCtrl.rejectAgreement);

// ─── TTS ───
router.post('/conversations/:id/tts', authMiddleware, ttsCtrl.generateTTS);

module.exports = router;
