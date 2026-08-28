import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { ProgressIndicator } from '../components/ui/ProgressIndicator';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi (हिंदी)' },
  { code: 'te', label: 'Telugu (తెలుగు)' },
  { code: 'ta', label: 'Tamil (தமிழ்)' },
  { code: 'kn', label: 'Kannada (ಕನ್ನಡ)' },
  { code: 'ml', label: 'Malayalam (മലയാളം)' },
  { code: 'mr', label: 'Marathi (मराठी)' },
  { code: 'bn', label: 'Bengali (বাংলা)' },
];

const CATEGORIES = [
  'Business & Commercial',
  'Real Estate & Renting',
  'Freelance & Contract',
  'Partnership & Co-founding',
  'Family & Household',
  'Other / General',
];

const DEFAULT_FIELDS = [
  'Quantity',
  'Price / Budget',
  'Delivery Date',
  'Time / Timeline',
  'Location',
  'Responsible Party',
];

export default function NewConversationPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Business & Commercial',
    description: '',
    participantAName: 'Alice',
    participantBName: 'Bob',
    participantALanguage: 'en',
    participantBLanguage: 'en',
    agreementFields: ['Quantity', 'Delivery Date', 'Responsible Party'],
  });

  const steps = [
    { title: 'Conversation' },
    { title: 'Participants' },
    { title: 'Languages' },
    { title: 'Agreement Fields' },
    { title: 'Review' },
  ];

  const updateField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleAgreementField = (field) => {
    setFormData((prev) => {
      const exists = prev.agreementFields.includes(field);
      return {
        ...prev,
        agreementFields: exists
          ? prev.agreementFields.filter((f) => f !== field)
          : [...prev.agreementFields, field],
      };
    });
  };

  const validateStep = (step) => {
    setError('');
    if (step === 1) {
      if (!formData.title.trim()) {
        setError('Please enter a conversation title.');
        return false;
      }
    }
    if (step === 2) {
      if (!formData.participantAName.trim() || !formData.participantBName.trim()) {
        setError('Please enter names for both participants.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const handleBack = () => {
    setError('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/conversations', {
        title: formData.title.trim(),
        category: formData.category,
        description: formData.description.trim(),
        participantAName: formData.participantAName.trim(),
        participantBName: formData.participantBName.trim(),
        participantALanguage: formData.participantALanguage,
        participantBLanguage: formData.participantBLanguage,
        agreementFields: formData.agreementFields,
      });

      const convId = res.data.conversation.id;
      navigate(`/conversations/${convId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create conversation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Stepper Progress */}
      <ProgressIndicator
        steps={steps}
        currentStep={currentStep}
        onStepClick={(step) => {
          if (step < currentStep) setCurrentStep(step);
        }}
      />

      {/* Main Form Card */}
      <Card className="mt-6 shadow-sm">
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: CONVERSATION BASICS */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Step 1: Conversation Details
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Give your conversation a clear topic and category.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Conversation Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="e.g. Q3 Product Delivery & Schedule Agreement"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => updateField('category', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Purpose / Context (Optional)
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Briefly describe the context or what terms are being negotiated..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}

        {/* STEP 2: PARTICIPANTS */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Step 2: Participants
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Who is participating in this conversation?
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2">
                <span className="text-xs font-bold text-indigo-900 block">
                  👤 Participant A
                </span>
                <input
                  type="text"
                  value={formData.participantAName}
                  onChange={(e) => updateField('participantAName', e.target.value)}
                  placeholder="e.g. Alice"
                  className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100 space-y-2">
                <span className="text-xs font-bold text-purple-900 block">
                  👤 Participant B
                </span>
                <input
                  type="text"
                  value={formData.participantBName}
                  onChange={(e) => updateField('participantBName', e.target.value)}
                  placeholder="e.g. Bob"
                  className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: LANGUAGES */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Step 3: Preferred Spoken Languages
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                AccordVoice supports cross-lingual mediation across Indian and global languages.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-indigo-900 mb-1">
                  {formData.participantAName}'s Language
                </label>
                <select
                  value={formData.participantALanguage}
                  onChange={(e) => updateField('participantALanguage', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-purple-900 mb-1">
                  {formData.participantBName}'s Language
                </label>
                <select
                  value={formData.participantBLanguage}
                  onChange={(e) => updateField('participantBLanguage', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: AGREEMENT FIELDS */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Step 4: Agreement Terms & Fields
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select key dimensions to extract and compare for discrepancies.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {DEFAULT_FIELDS.map((field) => {
                const selected = formData.agreementFields.includes(field);
                return (
                  <button
                    key={field}
                    type="button"
                    onClick={() => toggleAgreementField(field)}
                    className={`p-3 rounded-lg text-left text-xs font-medium border transition-all ${
                      selected
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{field}</span>
                      <span>{selected ? '✓' : '+'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5: REVIEW */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Step 5: Review & Start
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review your configuration before launching the live mediation workspace.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Title:</span>
                <span className="font-bold text-slate-900">{formData.title}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Category:</span>
                <span className="font-semibold text-slate-800">{formData.category}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Participant A:</span>
                <span className="font-semibold text-indigo-700">
                  {formData.participantAName} ({formData.participantALanguage})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Participant B:</span>
                <span className="font-semibold text-purple-700">
                  {formData.participantBName} ({formData.participantBLanguage})
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Monitored Fields:</span>
                <span className="font-semibold text-slate-800">
                  {formData.agreementFields.join(', ')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Stepper Navigation Buttons */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
          {currentStep > 1 ? (
            <Button variant="secondary" size="md" onClick={handleBack}>
              Back
            </Button>
          ) : (
            <div />
          )}

          {currentStep < 5 ? (
            <Button variant="primary" size="md" onClick={handleNext}>
              Continue ➜
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              loading={loading}
              onClick={handleSubmit}
              className="shadow-md"
            >
              Start Conversation 🎙️
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
