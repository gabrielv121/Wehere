import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export function Profile() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);
    const result = await updateProfile(name, email);
    setLoading(false);
    if (result.ok) {
      setSuccess(true);
    } else {
      setError(result.error ?? 'Update failed');
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-1">Profile</h2>
      <p className="text-slate-500 text-sm mb-6">Update your name and email</p>

      <form onSubmit={handleSubmit} className="max-w-md space-y-5">
        {error && (
          <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg bg-teal-50 text-teal-700 px-4 py-3 text-sm">
            Profile updated successfully.
          </div>
        )}

        <div>
          <label htmlFor="profile-name" className="block text-sm font-medium text-slate-700 mb-1">
            Name
          </label>
          <input
            id="profile-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
            placeholder="Your name"
            required
          />
        </div>

        <div>
          <label htmlFor="profile-email" className="block text-sm font-medium text-slate-700 mb-1">
            Email
          </label>
          <input
            id="profile-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
            placeholder="you@example.com"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2.5 rounded-lg bg-teal-500 text-white font-semibold hover:bg-teal-600 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  );
}
