import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const links = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/programs', label: 'Programs' },
  { to: '/instructors', label: 'Instructors' },
  { to: '/timetable', label: 'Timetable' },
  { to: '/learning', label: 'Learning' },
  { to: '/contact', label: 'Contact' },
  { to: '/faq', label: 'FAQ' },
];

export default function PublicLayout({ user }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen dashboard-shell">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="text-2xl font-bold gradient-text" style={{ fontFamily: 'Outfit, sans-serif' }}>
            CampusHub
          </Link>
          <nav className="hidden lg:flex items-center gap-5">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `text-sm font-semibold transition-colors ${isActive ? 'text-indigo-900' : 'text-gray-600 hover:text-indigo-900'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <Link to="/app" className="px-4 py-2 rounded-lg bg-indigo-900 text-white font-semibold hover:bg-indigo-800 transition-colors">
                Open Dashboard
              </Link>
            ) : (
              <Link to="/login" className="px-4 py-2 rounded-lg bg-indigo-900 text-white font-semibold hover:bg-indigo-800 transition-colors">
                Sign In
              </Link>
            )}
          </div>
          <button
            className="lg:hidden p-2 rounded-lg border border-gray-200"
            onClick={() => setOpen((s) => !s)}
            aria-label="Toggle navigation"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {open && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-2">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-indigo-900 text-white' : 'text-gray-700 bg-gray-50'}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <Link
                to={user ? '/app' : '/login'}
                onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-semibold bg-indigo-900 text-white"
              >
                {user ? 'Open Dashboard' : 'Sign In'}
              </Link>
            </div>
          </div>
        )}
      </header>

      <Outlet />

      <footer className="mt-14 border-t border-gray-200 bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-gray-900">CampusHub</p>
            <p className="text-sm text-gray-600">Learning + events platform for modern campuses.</p>
          </div>
          <p className="text-sm text-gray-500">Built for students, faculty, and admins.</p>
        </div>
      </footer>
    </div>
  );
}
