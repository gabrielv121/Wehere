import { Link, NavLink, Outlet } from 'react-router-dom';

const NAV = [
  { to: '/admin', end: true, label: 'Dashboard' },
  { to: '/admin/events', end: false, label: 'Events' },
  { to: '/admin/orders', end: false, label: 'Orders' },
  { to: '/admin/users', end: false, label: 'Users' },
];

export function AdminLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <header className="sticky top-0 z-50 bg-slate-800 text-white border-b border-slate-700">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2 font-bold text-lg">
            <span className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-white text-sm font-extrabold">A</span>
            Admin
          </Link>
          <nav className="flex items-center gap-1">
            {NAV.map(({ to, end, label }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <Link
            to="/"
            className="text-sm font-medium text-slate-300 hover:text-white"
          >
            ← Back to site
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
