import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div style={{ minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <Link to="/dashboard" style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem', display: 'inline-block' }}>← Back to Dashboard</Link>
        <div className="card">
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>Profile</h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
            <div>
              <label>Email</label>
              <input className="input" value={user?.email || ''} disabled />
            </div>
            <div>
              <label>User ID</label>
              <input className="input" value={user?.id || ''} disabled />
            </div>
            <div>
              <label>Account Created</label>
              <input className="input" value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : ''} disabled />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
