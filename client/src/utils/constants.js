export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'te', label: 'Telugu' },
  { code: 'ta', label: 'Tamil' },
  { code: 'kn', label: 'Kannada' },
  { code: 'ml', label: 'Malayalam' },
  { code: 'mr', label: 'Marathi' },
  { code: 'bn', label: 'Bengali' },
];

export const CATEGORIES = [
  { value: 'business_negotiation', label: 'Business Negotiation', icon: '💼' },
  { value: 'procurement', label: 'Procurement', icon: '📦' },
  { value: 'logistics', label: 'Logistics', icon: '🚚' },
  { value: 'construction', label: 'Construction', icon: '🏗️' },
  { value: 'field_services', label: 'Field Services', icon: '🔧' },
  { value: 'personal_commitments', label: 'Personal Commitments', icon: '🤝' },
  { value: 'team_coordination', label: 'Team Coordination', icon: '👥' },
  { value: 'customer_resolution', label: 'Customer Resolution', icon: '🎯' },
  { value: 'other', label: 'Other', icon: '📝' },
];

export const AGREEMENT_FIELDS = [
  'Price', 'Quantity', 'Date', 'Time', 'Location',
  'Responsible Person', 'Deadline', 'Payment Terms', 'Delivery Terms', 'Other',
];

export const CONVERSATION_STATES = {
  LISTENING: { label: 'Listening', color: 'info', icon: '🎙️' },
  PROCESSING: { label: 'Processing', color: 'warning', icon: '⏳' },
  UNDERSTANDING: { label: 'Understanding', color: 'info', icon: '🧠' },
  CONFLICT_DETECTED: { label: 'Conflict Detected', color: 'danger', icon: '⚠️' },
  CLARIFICATION_REQUIRED: { label: 'Clarification Required', color: 'warning', icon: '❓' },
  AGREEMENT_DRAFTED: { label: 'Agreement Drafted', color: 'success', icon: '📋' },
  AWAITING_CONFIRMATION: { label: 'Awaiting Confirmation', color: 'warning', icon: '⏳' },
  VERIFIED: { label: 'Verified', color: 'success', icon: '✅' },
  REJECTED: { label: 'Rejected', color: 'danger', icon: '❌' },
};
