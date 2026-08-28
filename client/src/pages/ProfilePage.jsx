import React from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function ProfilePage() {
  const { user, signOut, isLocalMode } = useAuth();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Account & Profile</h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your account credentials and mediation preferences.
        </p>
      </div>

      <Card padding="p-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-700 text-2xl font-bold flex items-center justify-center">
            {user?.user_metadata?.full_name ? user.user_metadata.full_name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {user?.user_metadata?.full_name || 'AccordVoice User'}
            </h2>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-4 pt-6 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              disabled
              value={user?.user_metadata?.full_name || 'User'}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="text"
              disabled
              value={user?.email || ''}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Storage Mode</label>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600">
              {isLocalMode ? '⚡ Local Fallback Storage' : '☁️ Live Cloud Supabase Database & Auth'}
            </div>
          </div>
        </div>

        <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end">
          <Button variant="danger" size="sm" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </Card>
    </div>
  );
}
