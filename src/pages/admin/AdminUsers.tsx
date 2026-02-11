import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { isApiEnabled } from '../../api/client';
import * as authApi from '../../api/auth';
import type { AdminUserRow } from '../../api/auth';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(isApiEnabled);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isApiEnabled) {
      setLoading(false);
      return;
    }
    authApi
      .getAdminUsers()
      .then(setUsers)
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Failed to load users');
        setUsers([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (!isApiEnabled) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Users</h1>
        <p className="text-slate-500 text-sm mb-8">Manage user accounts (admin-only area)</p>
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-slate-600 mb-4">
            User list is available when the app is connected to the backend API. Set <strong>VITE_API_URL</strong> and run the server, then restart the frontend.
          </p>
          <p className="text-slate-500 text-sm">
            Only users logged in as <strong>admin@wehere.com</strong> can see this dashboard. With the API running, you’ll see all registered users here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Users</h1>
      <p className="text-slate-500 text-sm mb-8">All registered users (admin-only). Signups and logins are stored on the server when the API is connected.</p>

      {error && (
        <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-slate-500">Loading users…</p>
      ) : users.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-slate-600">No users yet. New signups will appear here.</p>
          <p className="text-slate-500 text-sm mt-2">Make sure the backend is running and the frontend has VITE_API_URL set so sign up / log in use the API.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Email</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Name</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Role</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Seller info</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-900">
                      <Link to={`/admin/users/${u.id}`} className="text-teal-600 hover:underline">{u.email}</Link>
                    </td>
                    <td className="px-5 py-3 text-slate-700">{u.name}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full text-xs font-medium px-2 py-0.5 ${u.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {u.country && u.phone && u.paymentMethodOnFile ? 'Yes' : '—'}
                    </td>
                    <td className="px-5 py-3 text-slate-500">{u.createdAt ? formatDate(u.createdAt) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
