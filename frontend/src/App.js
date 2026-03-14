import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { Moon, Sun } from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary';
import '@/App.css';

const Login = lazy(() => import('./pages/Login'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const FacultyDashboard = lazy(() => import('./pages/FacultyDashboard'));
const PublicLayout = lazy(() => import('./components/PublicLayout'));
const HomePage = lazy(() => import('./pages/public/HomePage'));
const AboutPage = lazy(() => import('./pages/public/AboutPage'));
const ProgramsPage = lazy(() => import('./pages/public/ProgramsPage'));
const InstructorsPage = lazy(() => import('./pages/public/InstructorsPage'));
const TimetablePage = lazy(() => import('./pages/public/TimetablePage'));
const LearningCenterPage = lazy(() => import('./pages/public/LearningCenterPage'));
const ContactPage = lazy(() => import('./pages/public/ContactPage'));
const FaqPage = lazy(() => import('./pages/public/FaqPage'));

function AppLoader({ progress = null, label = 'Preparing CampusHub...' }) {
  const safeProgress = typeof progress === 'number'
    ? Math.max(0, Math.min(100, Math.round(progress)))
    : null;
  const progressLabel = safeProgress === null ? 'Loading' : `${safeProgress}%`;

  return (
    <div className="app-loader-screen">
      <div className="loader-ambient loader-ambient-a" />
      <div className="loader-ambient loader-ambient-b" />
      <div
        className={`load ${safeProgress === null ? 'is-indeterminate' : 'is-determinate'}`}
        aria-label="Loading progress"
        data-progress-label={progressLabel}
        style={safeProgress === null ? undefined : { '--p-load': safeProgress }}
      />
      <p className="loader-label">
        {safeProgress === null ? label : `${label} ${safeProgress}%`}
      </p>
    </div>
  );
}

function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    if (window.posthog?.capture) {
      window.posthog.capture('page_view', { path: location.pathname });
    }
  }, [location.pathname]);

  return null;
}

function DashboardRoute({ user, onLogout }) {
  if (!user) return <Navigate to="/login" />;

  if (user.role === 'admin') return <AdminDashboard user={user} onLogout={onLogout} />;
  if (user.role === 'faculty') return <FacultyDashboard user={user} onLogout={onLogout} />;
  return <StudentDashboard user={user} onLogout={onLogout} />;
}

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [bootProgress, setBootProgress] = useState(0);
  const [bootReady, setBootReady] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData?.length) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setAuthLoading(false);
  }, []);

  useEffect(() => {
    const bootSeen = sessionStorage.getItem('campushub_boot_done') === '1';
    if (bootSeen) {
      setBootProgress(100);
      setBootReady(true);
      return;
    }

    let progress = 0;
    const timer = window.setInterval(() => {
      progress += Math.floor(Math.random() * 8) + 4;
      if (progress >= 100) {
        progress = 100;
        window.clearInterval(timer);
        sessionStorage.setItem('campushub_boot_done', '1');
        setBootReady(true);
      }
      setBootProgress(progress);
    }, 120);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const onError = (event) => {
      if (window.posthog?.capture) {
        window.posthog.capture('ui_error', {
          message: event.message,
          source: event.filename,
          line: event.lineno,
          column: event.colno,
        });
      }
    };

    const onRejection = (event) => {
      if (window.posthog?.capture) {
        window.posthog.capture('unhandled_rejection', {
          reason: String(event.reason || 'unknown'),
        });
      }
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  if (authLoading || !bootReady) return <AppLoader progress={bootProgress} label="Preparing CampusHub" />;

  return (
    <ErrorBoundary>
      <div className="App">
        <a href="#main-content" className="skip-link">Skip to content</a>
        <BrowserRouter>
          <RouteTracker />
          <Suspense fallback={<AppLoader />}>
            <Routes>
              <Route element={<PublicLayout user={user} />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/programs" element={<ProgramsPage />} />
                <Route path="/instructors" element={<InstructorsPage />} />
                <Route path="/timetable" element={<TimetablePage />} />
                <Route path="/workshops" element={<LearningCenterPage />} />
                <Route path="/learning" element={<Navigate to="/workshops" />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/faq" element={<FaqPage />} />
              </Route>
              <Route
                path="/login"
                element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/app" />}
              />
              <Route
                path="/app"
                element={<DashboardRoute user={user} onLogout={handleLogout} />}
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <button
          onClick={toggleTheme}
          className="theme-toggle-btn"
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          <span>{theme === 'light' ? 'Dark' : 'Light'}</span>
        </button>
        <Toaster position="top-right" />
      </div>
    </ErrorBoundary>
  );
}

export default App;
