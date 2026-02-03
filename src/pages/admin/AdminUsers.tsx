/**
 * User management for admins.
 * In a real app this would list users from an API; here we show a placeholder and demo message.
 */
export function AdminUsers() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Users</h1>
      <p className="text-slate-500 text-sm mb-8">Manage user accounts (admin-only area)</p>

      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-slate-600 mb-4">
          User management is admin-only. Regular users cannot access <strong>/admin</strong> and are redirected to the home page.
        </p>
        <p className="text-slate-500 text-sm mb-6">
          This demo has no backend user database. Connect an API to list, edit, and manage users. Only users logged in as <strong>admin@wehere.com</strong> can see this dashboard.
        </p>
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
          <h3 className="font-medium text-slate-700 mb-2">Route protection</h3>
          <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
            <li>Regular users → cannot access /admin (redirected to home)</li>
            <li>Not logged in → redirected to login, then back to /admin after login</li>
            <li>Admins → full access to Dashboard, Events, Users</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
