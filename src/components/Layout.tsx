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
            {user?.role !== 'admin' && (
              <Link to="/sell" className="text-slate-600 hover:text-teal-600 font-medium transition-colors">
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
      </header>

      {/* Mobile menu panel: compact right-aligned dropdown (TickPick-style) */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/10 md:hidden"
            aria-hidden
            onClick={closeMenu}
          />
          <nav
            className="fixed right-4 top-14 z-40 md:hidden w-56 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-4rem)] bg-white border border-slate-200 shadow-lg rounded-xl py-2 overflow-y-auto"
            aria-label="Mobile menu"
          >
            <div className="flex flex-col gap-0.5 px-2">
              <Link to="/events" onClick={closeMenu} className="py-2 px-2 rounded-md text-slate-700 font-medium hover:bg-slate-100 hover:text-teal-600 text-sm">
                Events
              </Link>
              {user?.role !== 'admin' && (
                <Link to="/sell" onClick={closeMenu} className="py-2 px-2 rounded-md text-slate-700 font-medium hover:bg-slate-100 hover:text-teal-600 text-sm">
                  Sell tickets
                </Link>
              )}
              <Link to="/events?category=concert" onClick={closeMenu} className="py-2 px-2 rounded-md text-slate-700 font-medium hover:bg-slate-100 hover:text-teal-600 text-sm">
                Concerts
              </Link>
              <Link to="/events?category=sports" onClick={closeMenu} className="py-2 px-2 rounded-md text-slate-700 font-medium hover:bg-slate-100 hover:text-teal-600 text-sm">
                Sports
              </Link>
              {!isLoading && (
                user ? (
                  <>
                    {user.role === 'admin' && (
                      <Link to="/admin" onClick={closeMenu} className="py-2 px-2 rounded-md text-slate-700 font-medium hover:bg-slate-100 hover:text-teal-600 text-sm">
                        Dashboard
                      </Link>
                    )}
                    <Link to="/account" onClick={closeMenu} className="py-2 px-2 rounded-md text-slate-700 font-medium hover:bg-slate-100 hover:text-teal-600 text-sm">
                      {user.name}
                    </Link>
                    <button
                      type="button"
                      onClick={() => { closeMenu(); logout(); }}
                      className="py-2 px-2 rounded-md text-left text-slate-500 font-medium hover:bg-slate-100 hover:text-slate-700 text-sm"
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={closeMenu} className="py-2 px-2 rounded-md text-slate-700 font-medium hover:bg-slate-100 hover:text-teal-600 text-sm">
                      Log in
                    </Link>
                    <Link to="/signup" onClick={closeMenu} className="py-2 px-2 rounded-md mt-1 bg-teal-500 text-white font-semibold text-center hover:bg-teal-600 text-sm">
                      Sign up
                    </Link>
                  </>
                )
              )}
            </div>
          </nav>
        </>
      )}
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
