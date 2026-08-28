import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { StatusBadge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/ProgressIndicator';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, ACTIVE, CONFLICT, CLARIFICATION, VERIFIED
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/conversations');
      setConversations(res.data.conversations || []);
    } catch (err) {
      console.error('[Dashboard] Fetch error:', err);
      setError('Failed to load conversations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Dynamic real stats calculated directly from user's actual database records
  const stats = {
    total: conversations.length,
    active: conversations.filter((c) => !['VERIFIED', 'REJECTED'].includes(c.state)).length,
    conflicts: conversations.filter((c) => c.state === 'CONFLICT_DETECTED').length,
    clarifications: conversations.filter((c) => c.state === 'CLARIFICATION_REQUIRED').length,
    awaitingConfirmation: conversations.filter((c) => ['AWAITING_CONFIRMATION', 'PARTIALLY_CONFIRMED', 'AGREEMENT_DRAFTED'].includes(c.state)).length,
    verified: conversations.filter((c) => c.state === 'VERIFIED').length,
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.participant_a_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.participant_b_name.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'ACTIVE') return !['VERIFIED', 'REJECTED'].includes(c.state);
    if (filter === 'CONFLICT') return c.state === 'CONFLICT_DETECTED';
    if (filter === 'CLARIFICATION') return c.state === 'CLARIFICATION_REQUIRED';
    if (filter === 'VERIFIED') return c.state === 'VERIFIED';
    return true;
  });

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {user?.user_metadata?.full_name || 'there'} 👋
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Monitor active discussions, resolve detected conflicts, and verify mutual agreements.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => navigate('/conversations/new')}
          icon="+"
          className="shadow-sm"
        >
          New Conversation
        </Button>
      </div>

      {/* Real Statistics Command Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Total
          </span>
          <span className="text-2xl font-extrabold text-slate-900 block mt-1">
            {stats.total}
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider block">
            Active
          </span>
          <span className="text-2xl font-extrabold text-indigo-700 block mt-1">
            {stats.active}
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider block">
            Conflicts
          </span>
          <span className="text-2xl font-extrabold text-rose-700 block mt-1">
            {stats.conflicts}
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block">
            Clarifications
          </span>
          <span className="text-2xl font-extrabold text-amber-700 block mt-1">
            {stats.clarifications}
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">
            Verified
          </span>
          <span className="text-2xl font-extrabold text-emerald-700 block mt-1">
            {stats.verified}
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'ALL', label: 'All' },
            { key: 'ACTIVE', label: 'Active' },
            { key: 'CONFLICT', label: 'Conflicts' },
            { key: 'CLARIFICATION', label: 'Clarifications' },
            { key: 'VERIFIED', label: 'Verified' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                filter === tab.key
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by title or participant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Conversations Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-white rounded-xl border border-slate-200 animate-pulse p-5" />
          ))}
        </div>
      ) : filteredConversations.length === 0 ? (
        <EmptyState
          icon="💬"
          title={searchQuery ? 'No matching conversations' : 'No conversations found'}
          description={
            searchQuery
              ? 'Try searching with a different keyword.'
              : 'Create your first conversation to begin speech transcription and mediation.'
          }
          action={
            <Button variant="primary" size="sm" onClick={() => navigate('/conversations/new')}>
              + Start New Conversation
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredConversations.map((c) => (
            <Card
              key={c.id}
              hoverable
              padding="p-5"
              onClick={() => navigate(`/conversations/${c.id}`)}
              className="flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">
                    {c.category || 'General'}
                  </span>
                  <StatusBadge state={c.state} size="sm" />
                </div>

                {/* Title */}
                <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                  {c.title}
                </h3>

                {/* Participants */}
                <div className="space-y-1 text-xs text-slate-600 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span>👤</span>
                      <span className="font-medium text-slate-800">{c.participant_a_name}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono uppercase">
                      {c.participant_a_language}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span>👤</span>
                      <span className="font-medium text-slate-800">{c.participant_b_name}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono uppercase">
                      {c.participant_b_language}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">
                  {formatDate(c.updated_at || c.created_at)}
                </span>
                <span className="font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                  Open ➜
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
