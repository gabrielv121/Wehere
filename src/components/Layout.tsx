import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Footer } from './Footer';

export function Layout() {
  const { user, isLoading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-slate-900">
            <span className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-white text-sm font-extrabold">W</span>
            WeHere
          </Link>
          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6">
            <Link to="/events" className="text-slate-600 hover:text-teal-600 font-medium transition-colors">
              Events
            </Link>
            {user && user.role !== 'admin' && (
              <Link to="/account/list-tickets" className="text-slate-600 hover:text-teal-600 font-medium transition-colors">
                Sell tickets
              </Link>
            )}
            <Link to="/events?category=concert" className="text-slate-600 hover:text-teal-600 font-medium transition-colors">
              Concerts
            </Link>
            <Link to="/events?category=sports" className="text-slate-600 hover:text-teal-600 font-medium transition-colors">
              Sports
            </Link>
            {!isLoading && (
              user ? (
                <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                  {user.role === 'admin' && (
                    <Link to="/admin" className="text-slate-600 hover:text-teal-600 font-medium transition-colors text-sm">
                      Dashboard
                    </Link>
                  )}
                  <Link to="/account" className="text-slate-600 hover:text-teal-600 font-medium transition-colors text-sm lg:text-base">
                    {user.name}
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <>
                  <Link to="/login" className="text-slate-600 hover:text-teal-600 font-medium transition-colors">
                    Log in
                  </Link>
                  <Link to="/signup" className="px-3 py-1.5 rounded-lg bg-teal-500 text-white text-sm font-semibold hover:bg-teal-600 transition-colors">
                    Sign up
                  </Link>
                </>
              )
            )}
          </nav>

          {/* Mobile: hamburger button */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </>
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu panel */}
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/20 md:hidden"
              aria-hidden
              onClick={closeMenu}
            />
            <nav
              className="absolute left-0 right-0 top-14 z-40 md:hidden bg-white border-b border-slate-200 shadow-lg py-4 px-4"
              aria-label="Mobile menu"
            >
              <div className="flex flex-col gap-1">
                <Link to="/events" onClick={closeMenu} className="py-3 px-3 rounded-lg text-slate-700 font-medium hover:bg-slate-100 hover:text-teal-600">
                  Events
                </Link>
                {user && user.role !== 'admin' && (
                  <Link to="/account/list-tickets" onClick={closeMenu} className="py-3 px-3 rounded-lg text-slate-700 font-medium hover:bg-slate-100 hover:text-teal-600">
                    Sell tickets
                  </Link>
                )}
                <Link to="/events?category=concert" onClick={closeMenu} className="py-3 px-3 rounded-lg text-slate-700 font-medium hover:bg-slate-100 hover:text-teal-600">
                  Concerts
                </Link>
                <Link to="/events?category=sports" onClick={closeMenu} className="py-3 px-3 rounded-lg text-slate-700 font-medium hover:bg-slate-100 hover:text-teal-600">
                  Sports
                </Link>
                {!isLoading && (
                  user ? (
                    <>
                      {user.role === 'admin' && (
                        <Link to="/admin" onClick={closeMenu} className="py-3 px-3 rounded-lg text-slate-700 font-medium hover:bg-slate-100 hover:text-teal-600">
                          Dashboard
                        </Link>
                      )}
                      <Link to="/account" onClick={closeMenu} className="py-3 px-3 rounded-lg text-slate-700 font-medium hover:bg-slate-100 hover:text-teal-600">
                        {user.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => { closeMenu(); logout(); }}
                        className="py-3 px-3 rounded-lg text-left text-slate-500 font-medium hover:bg-slate-100 hover:text-slate-700"
                      >
                        Log out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" onClick={closeMenu} className="py-3 px-3 rounded-lg text-slate-700 font-medium hover:bg-slate-100 hover:text-teal-600">
                        Log in
                      </Link>
                      <Link to="/signup" onClick={closeMenu} className="py-3 px-3 rounded-lg mt-2 bg-teal-500 text-white font-semibold text-center hover:bg-teal-600">
                        Sign up
                      </Link>
                    </>
                  )
                )}
              </div>
            </nav>
          </>
        )}
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
