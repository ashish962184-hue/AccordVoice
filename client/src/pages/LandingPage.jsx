import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function LandingPage() {
  const pipelineSteps = [
    { step: '01', title: 'Speak', icon: '🎙️', desc: 'Each participant speaks in their preferred natural language.' },
    { step: '02', title: 'Understand', icon: '🧠', desc: 'Gemini AI extracts commitments and normalized semantic meaning.' },
    { step: '03', title: 'Detect', icon: '⚠️', desc: 'Identifies discrepancies in quantity, dates, prices, or deliverables.' },
    { step: '04', title: 'Clarify', icon: '❓', desc: 'Asks neutral clarification questions rather than picking a winner.' },
    { step: '05', title: 'Draft', icon: '📋', desc: 'Synthesizes verified terms into an unambiguous mutual agreement.' },
    { step: '06', title: 'Verify', icon: '✅', desc: 'Requires explicit 2-of-2 confirmation before finalizing.' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Header / Nav */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-lg shadow-sm">
              🎙️
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900 block leading-tight">
                AccordVoice
              </span>
              <span className="text-[10px] font-medium text-indigo-600 block uppercase tracking-wider">
                AI Mediation
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-6">
          <span>✨</span>
          <span>Conversational AI Mediation & Verification</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-6">
          Make sure everyone leaves the conversation with the{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-800">
            same understanding.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto mb-8 leading-relaxed font-normal">
          AccordVoice listens to multilingual conversations, identifies differences in what people said, asks neutral clarification questions, and verifies the final agreement with every participant.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/register">
            <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-md">
              Start a Conversation ➜
            </Button>
          </Link>
          <a href="#how-it-works">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              See How It Works
            </Button>
          </a>
        </div>
      </section>

      {/* Visual Golden Example Card */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto pb-16">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden">
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="ml-2 text-slate-400 font-sans font-medium">Real-Time Mediation Engine</span>
            </div>
            <span className="text-indigo-400 font-sans font-semibold">Gemini 2.0 + Supabase</span>
          </div>

          <div className="p-6 space-y-6">
            {/* Split turns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100">
                <span className="text-xs font-bold text-indigo-900 block mb-1">
                  Participant A (English)
                </span>
                <p className="text-sm text-slate-800 italic mb-2">
                  "I will deliver 50 units on Friday."
                </p>
                <div className="text-[11px] font-mono text-indigo-700 bg-white p-2 rounded border border-indigo-100">
                  Qty: 50 units | Date: Friday
                </div>
              </div>

              <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-100">
                <span className="text-xs font-bold text-purple-900 block mb-1">
                  Participant B (English)
                </span>
                <p className="text-sm text-slate-800 italic mb-2">
                  "We agreed on 20 units on Monday."
                </p>
                <div className="text-[11px] font-mono text-purple-700 bg-white p-2 rounded border border-purple-100">
                  Qty: 20 units | Date: Monday
                </div>
              </div>
            </div>

            {/* Conflict Detection Banner */}
            <div className="p-4 bg-rose-50 rounded-xl border-2 border-rose-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>Conflict Detected · AccordVoice Asks Neither To Concede</span>
                </span>
                <span className="text-[11px] font-semibold text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200">
                  2 Discrepancies
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 bg-white rounded border border-rose-100 text-rose-900">
                  <strong>Quantity:</strong> 50 ≠ 20
                </div>
                <div className="p-2 bg-white rounded border border-rose-100 text-rose-900">
                  <strong>Delivery:</strong> Friday ≠ Monday
                </div>
              </div>
            </div>

            {/* Neutral Clarification & Resolution */}
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-emerald-900 block">
                  Clarification Resolved ➜ "50 units on Monday"
                </span>
                <span className="text-xs text-emerald-700 block">
                  Both Participant A and Participant B explicitly confirmed.
                </span>
              </div>
              <span className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-sm">
                ✓ Agreement Verified
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 6-Step Mediation Pipeline */}
      <section id="how-it-works" className="py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">
              The AccordVoice Method
            </h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              From verbal conversation to verified agreement
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {pipelineSteps.map((s) => (
              <div
                key={s.step}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-indigo-300 transition-all hover:bg-white"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{s.icon}</span>
                  <span className="text-xs font-mono font-bold text-indigo-600">{s.step}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">{s.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Multilingual Support Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl">
          <div className="max-w-2xl">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-2">
              Cross-Language Intelligence
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-4">
              Participant A speaks English. Participant B speaks Telugu or Hindi.
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              AccordVoice preserves the original language spoken while extracting shared, normalized semantic commitments in a single unified schema.
            </p>
            <div className="flex flex-wrap gap-2 text-xs font-medium">
              {['English', 'Hindi (हिंदी)', 'Telugu (తెలుగు)', 'Tamil (தமிழ்)', 'Kannada (ಕನ್ನಡ)', 'Bengali (বাংলা)', 'Marathi (मराठी)'].map((l) => (
                <span key={l} className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-slate-200">
                  {l}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 py-8 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400">
        <p>© 2026 AccordVoice. AI-Powered Conversational Mediation & Agreement Verification.</p>
      </footer>
    </div>
  );
}
