import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  Calendar,
  Clock3,
  House,
  Users,
  BookOpen,
  Plus,
  LogOut,
  Edit2,
  Trash2,
  TrendingUp,
  CheckCircle,
  Megaphone,
  BarChart3,
  Download,
  Search,
  UserPlus,
  UserX,
  Sparkles,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, cachedGet, clearApiCache } from '../utils/api';
import { getInstructors, getPrograms, saveInstructors, savePrograms } from '@/utils/contentStore';
import { getEventCardImage } from '../utils/eventImages';
import TimetableManager from '@/components/TimetableManager';

export default function AdminDashboard({ user, onLogout }) {
  const [activeView, setActiveView] = useState('dashboard');
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [programs, setPrograms] = useState(() => getPrograms());
  const [instructors, setInstructors] = useState(() => getInstructors());
  const [announcements, setAnnouncements] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [attendanceInsights, setAttendanceInsights] = useState([]);
  const [globalQuery, setGlobalQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    target_roles: [],
    target_departments: [],
  });
  const [removalRequests, setRemovalRequests] = useState([]);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    role: 'student',
    password: '',
    department: '',
    student_id: '',
  });
  const [programForm, setProgramForm] = useState({
    title: '',
    level: 'Beginner',
    dept: 'CSE',
    seats: 60,
    duration: '8 Weeks',
    summary: '',
    image: '',
  });
  const [instructorForm, setInstructorForm] = useState({
    name: '',
    dept: 'CSE',
    expertise: '',
    rating: 4.7,
    image: '',
  });
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    category: 'seminar',
    date: '',
    time: '',
    venue: '',
    max_participants: 50,
    image_url: '',
    organizer: '',
    department: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setPrograms(getPrograms());
    setInstructors(getInstructors());
  }, []);

  const fetchData = async () => {
    try {
      const [eventsData, usersData, statsData] = await Promise.all([
        cachedGet('/events'),
        cachedGet('/users'),
        cachedGet('/dashboard/stats'),
      ]);
      setEvents(eventsData);
      setUsers(usersData);
      setStats(statsData);
      try {
        const [annData, analyticsData, insightsData, removalReqData] = await Promise.all([
          cachedGet('/announcements'),
          cachedGet('/dashboard/analytics'),
          cachedGet('/attendance/insights'),
          cachedGet('/user-removal-requests'),
        ]);
        setAnnouncements(annData);
        setAnalytics(analyticsData);
        setAttendanceInsights(insightsData);
        setRemovalRequests(removalReqData);
      } catch (extraError) {
        console.error('Advanced modules unavailable', extraError);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/events', eventForm);
      toast.success('Event created successfully!');
      setShowCreateModal(false);
      resetForm();
      clearApiCache();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create event');
    }
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/events/${selectedEvent.id}`, eventForm);
      toast.success('Event updated successfully!');
      setShowEditModal(false);
      resetForm();
      clearApiCache();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update event');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    try {
      await api.delete(`/events/${eventId}`);
      toast.success('Event deleted');
      clearApiCache();
      fetchData();
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  const openEditModal = (event) => {
    setSelectedEvent(event);
    setEventForm({
      title: event.title,
      description: event.description,
      category: event.category,
      date: event.date,
      time: event.time,
      venue: event.venue,
      max_participants: event.max_participants,
      image_url: event.image_url || '',
      organizer: event.organizer,
      department: event.department || '',
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setEventForm({
      title: '',
      description: '',
      category: 'seminar',
      date: '',
      time: '',
      venue: '',
      max_participants: 50,
      image_url: '',
      organizer: '',
      department: '',
    });
    setSelectedEvent(null);
  };

  const addProgram = (e) => {
    e.preventDefault();
    if (!programForm.title.trim()) return toast.error('Program title is required');
    const next = [{ id: `prog-${Date.now()}`, ...programForm }, ...programs];
    setPrograms(next);
    savePrograms(next);
    setProgramForm({
      title: '',
      level: 'Beginner',
      dept: 'CSE',
      seats: 60,
      duration: '8 Weeks',
      summary: '',
      image: '',
    });
    toast.success('Program added');
  };

  const removeProgram = (id) => {
    const next = programs.filter((program) => program.id !== id);
    setPrograms(next);
    savePrograms(next);
    toast.success('Program removed');
  };

  const addInstructor = (e) => {
    e.preventDefault();
    if (!instructorForm.name.trim()) return toast.error('Instructor name is required');
    const next = [{ id: `ins-${Date.now()}`, ...instructorForm }, ...instructors];
    setInstructors(next);
    saveInstructors(next);
    setInstructorForm({
      name: '',
      dept: 'CSE',
      expertise: '',
      rating: 4.7,
      image: '',
    });
    toast.success('Instructor added');
  };

  const removeInstructor = (id) => {
    const next = instructors.filter((ins) => ins.id !== id);
    setInstructors(next);
    saveInstructors(next);
    toast.success('Instructor removed');
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', newUserForm);
      toast.success('User created successfully');
      setNewUserForm({
        name: '',
        email: '',
        role: 'student',
        password: '',
        department: '',
        student_id: '',
      });
      clearApiCache();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (!window.confirm(`Delete user ${targetUser.name}?`)) return;
    try {
      await api.delete(`/users/${targetUser.id}`);
      toast.success('User removed');
      clearApiCache();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to remove user');
    }
  };

  const handleReviewRemovalRequest = async (requestId, decision) => {
    try {
      await api.put(`/user-removal-requests/${requestId}`, { decision });
      toast.success(`Request ${decision}`);
      clearApiCache();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update request');
    }
  };

  const toggleRoleTarget = (role) => {
    setAnnouncementForm((prev) => ({
      ...prev,
      target_roles: prev.target_roles.includes(role)
        ? prev.target_roles.filter((r) => r !== role)
        : [...prev.target_roles, role],
    }));
  };

  const publishAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await api.post('/announcements', announcementForm);
      toast.success('Announcement published');
      setAnnouncementForm({ title: '', message: '', target_roles: [], target_departments: [] });
      clearApiCache();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to publish announcement');
    }
  };

  const runGlobalSearch = async () => {
    if (!globalQuery.trim()) {
      setSearchResults(null);
      return;
    }
    try {
      const response = await api.get('/search', {
        params: { q: globalQuery.trim(), scope: 'all' },
      });
      setSearchResults(response.data);
    } catch (error) {
      toast.error('Search failed');
    }
  };

  const downloadExport = async (type, format = 'csv') => {
    try {
      const response = await api.get(`/exports/${type}`, {
        params: { format },
        responseType: 'blob',
      });
      const ext = format.toLowerCase() === 'pdf' ? 'pdf' : 'csv';
      const blob = new Blob([response.data], {
        type: format.toLowerCase() === 'pdf' ? 'application/pdf' : 'text/csv',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_export.${ext}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Export failed');
    }
  };

  if (loading) {
    return (
      <div className="app-loader-screen">
        <div className="loader-ambient loader-ambient-a" />
        <div className="loader-ambient loader-ambient-b" />
        <div className="loader-core">
          <div className="loader-orbit" />
          <div className="loader-dot" />
        </div>
        <p className="loader-label">Loading admin control center...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen dashboard-shell lg:flex" data-testid="admin-dashboard">
      {/* Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 sidebar-modern text-white lg:min-h-screen lg:fixed lg:left-0 lg:top-0 p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
            CampusHub
          </h1>
          <p className="text-indigo-300 text-sm mt-1">Admin Panel</p>
        </div>

        <nav className="space-y-2">
          <button
            onClick={() => setActiveView('dashboard')}
            data-testid="dashboard-nav"
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeView === 'dashboard' ? 'bg-white text-indigo-900' : 'text-white hover:bg-indigo-800'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </button>

          <button
            onClick={() => setActiveView('events')}
            data-testid="events-nav"
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeView === 'events' ? 'bg-white text-indigo-900' : 'text-white hover:bg-indigo-800'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="font-medium">Events</span>
          </button>

          <button
            onClick={() => setActiveView('users')}
            data-testid="users-nav"
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeView === 'users' ? 'bg-white text-indigo-900' : 'text-white hover:bg-indigo-800'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="font-medium">Users</span>
          </button>

          <button
            onClick={() => setActiveView('content')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeView === 'content' ? 'bg-white text-indigo-900' : 'text-white hover:bg-indigo-800'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="font-medium">Content</span>
          </button>

          <button
            onClick={() => setActiveView('timetable')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeView === 'timetable' ? 'bg-white text-indigo-900' : 'text-white hover:bg-indigo-800'
            }`}
          >
            <Clock3 className="w-5 h-5" />
            <span className="font-medium">Timetable</span>
          </button>
          <button
            onClick={() => setActiveView('ops')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeView === 'ops' ? 'bg-white text-indigo-900' : 'text-white hover:bg-indigo-800'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="font-medium">Ops Center</span>
          </button>
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-indigo-800 rounded-lg p-4 mb-4">
            <p className="text-sm text-indigo-200">Logged in as</p>
            <p className="font-semibold mt-1">{user.name}</p>
            <p className="text-xs text-indigo-300 mt-1">{user.email}</p>
          </div>
          <Link
            to="/"
            className="w-full mb-2 flex items-center justify-center gap-2 px-4 py-3 text-white hover:bg-indigo-800 rounded-lg transition-colors border border-indigo-500/50"
          >
            <House className="w-5 h-5" />
            <span className="font-medium">Home Page</span>
          </Link>
          <button
            onClick={onLogout}
            data-testid="logout-button"
            className="w-full flex items-center gap-2 px-4 py-3 text-white hover:bg-indigo-800 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main id="main-content" className="w-full lg:flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8">
        <div className="lg:hidden bg-white rounded-xl border border-gray-100 p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-500">Admin Panel</p>
              <p className="font-semibold text-gray-900">{user.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-indigo-900"
              >
                <House className="w-4 h-4" />
                Home
              </Link>
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-indigo-900"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === 'dashboard' ? 'bg-indigo-900 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveView('events')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === 'events' ? 'bg-indigo-900 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Events
            </button>
            <button
              onClick={() => setActiveView('users')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === 'users' ? 'bg-indigo-900 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveView('content')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === 'content' ? 'bg-indigo-900 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Content
            </button>
            <button
              onClick={() => setActiveView('timetable')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === 'timetable' ? 'bg-indigo-900 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Timetable
            </button>
            <button
              onClick={() => setActiveView('ops')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === 'ops' ? 'bg-indigo-900 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Ops
            </button>
          </div>
        </div>
        {/* Dashboard View */}
        {activeView === 'dashboard' && stats && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Dashboard Overview
              </h2>
              <p className="text-gray-600 mt-2">Monitor your university events at a glance</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="stat-card">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-600 font-medium uppercase tracking-wide">Total Events</p>
                  <Calendar className="w-8 h-8 text-indigo-900" />
                </div>
                <p className="text-4xl font-bold text-gray-900">{stats.total_events}</p>
                <div className="flex items-center gap-1 mt-2 text-green-600 text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>Active</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-600 font-medium uppercase tracking-wide">Upcoming</p>
                  <CheckCircle className="w-8 h-8 text-rose-400" />
                </div>
                <p className="text-4xl font-bold text-gray-900">{stats.upcoming_events}</p>
                <p className="text-sm text-gray-500 mt-2">Scheduled events</p>
              </div>

              <div className="stat-card">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-600 font-medium uppercase tracking-wide">Registrations</p>
                  <Users className="w-8 h-8 text-amber-400" />
                </div>
                <p className="text-4xl font-bold text-gray-900">{stats.total_registrations}</p>
                <p className="text-sm text-gray-500 mt-2">Total participants</p>
              </div>

              <div className="stat-card">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-600 font-medium uppercase tracking-wide">Total Users</p>
                  <Users className="w-8 h-8 text-purple-500" />
                </div>
                <p className="text-4xl font-bold text-gray-900">{stats.total_users}</p>
                <p className="text-sm text-gray-500 mt-2">Community members</p>
              </div>
            </div>

            {/* Recent Events */}
            <div className="dashboard-surface p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Recent Events
              </h3>
              <div className="space-y-3">
                {events.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{event.title}</p>
                      <p className="text-sm text-gray-600">{event.date} • {event.venue}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-900 rounded-full text-xs font-semibold">
                        {event.category}
                      </span>
                      <span className="text-sm text-gray-600">
                        {event.registered_count}/{event.max_participants}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Events View */}
        {activeView === 'events' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Manage Events
                </h2>
                <p className="text-gray-600 mt-2">{events.length} total events</p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                data-testid="create-event-button"
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Event
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {events.map((event) => (
                <div key={event.id} className="dashboard-surface p-6 hover:shadow-lg transition-shadow">
                  <div
                    className="event-image-strip mb-4"
                    style={{
                      backgroundImage: `url(${getEventCardImage(event)})`,
                    }}
                  />
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        {event.title}
                      </h3>
                      <span className="inline-block mt-2 px-3 py-1 bg-indigo-100 text-indigo-900 rounded-full text-xs font-semibold uppercase">
                        {event.category}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(event)}
                        data-testid={`edit-event-${event.id}`}
                        className="p-2 hover:bg-indigo-50 text-indigo-900 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        data-testid={`delete-event-${event.id}`}
                        className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">{event.description}</p>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Date</p>
                      <p className="font-semibold text-gray-900">{event.date}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Time</p>
                      <p className="font-semibold text-gray-900">{event.time}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Venue</p>
                      <p className="font-semibold text-gray-900">{event.venue}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Participants</p>
                      <p className="font-semibold text-gray-900">
                        {event.registered_count}/{event.max_participants}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users View */}
        {activeView === 'users' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                User Management
              </h2>
              <p className="text-gray-600 mt-2">{users.length} registered users</p>
            </div>

            <section className="dashboard-surface p-5">
              <div className="flex items-center gap-2 mb-4">
                <UserPlus className="w-5 h-5 text-indigo-900" />
                <h3 className="text-xl font-bold text-gray-900">Add User / Faculty</h3>
              </div>
              <form onSubmit={handleCreateUser} className="grid md:grid-cols-3 gap-3">
                <input
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  placeholder="Full name"
                  className="px-3 py-2 rounded-lg border border-gray-200"
                  required
                />
                <input
                  type="email"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="Email"
                  className="px-3 py-2 rounded-lg border border-gray-200"
                  required
                />
                <input
                  type="password"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  placeholder="Temporary password"
                  className="px-3 py-2 rounded-lg border border-gray-200"
                  required
                />
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-gray-200"
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                </select>
                <input
                  value={newUserForm.department}
                  onChange={(e) => setNewUserForm({ ...newUserForm, department: e.target.value })}
                  placeholder="Department"
                  className="px-3 py-2 rounded-lg border border-gray-200"
                />
                <input
                  value={newUserForm.student_id}
                  onChange={(e) => setNewUserForm({ ...newUserForm, student_id: e.target.value })}
                  placeholder="Student ID (optional)"
                  className="px-3 py-2 rounded-lg border border-gray-200"
                />
                <button type="submit" className="md:col-span-3 btn-primary px-5 py-2 rounded-lg w-fit">
                  Create User
                </button>
              </form>
            </section>

            <div className="dashboard-surface overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wide">Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wide">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wide">Role</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wide">Department</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wide">Joined</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 uppercase tracking-wide">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{u.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                              u.role === 'admin'
                                ? 'bg-purple-100 text-purple-700'
                                : u.role === 'faculty'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{u.department || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {u.id !== user.id && u.role !== 'admin' ? (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 text-sm font-medium"
                            >
                              <UserX className="w-4 h-4" />
                              Remove
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">Protected</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <section className="dashboard-surface p-5">
              <h3 className="text-xl font-bold text-gray-900">Faculty Removal Requests</h3>
              <p className="text-sm text-gray-600 mt-1">Faculty can request removal. Admin reviews and decides.</p>
              <div className="mt-4 space-y-3 max-h-80 overflow-y-auto scroll-container">
                {removalRequests.length === 0 ? (
                  <p className="text-sm text-gray-500">No requests yet.</p>
                ) : (
                  removalRequests.map((req) => (
                    <div key={req.id} className="p-3 rounded-lg border border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">
                        {req.requested_by_name} requested removal of {req.target_user_name} ({req.target_user_role})
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Reason: {req.reason || 'No reason provided'}</p>
                      <p className="text-xs text-gray-500 mt-1">Status: <span className="font-semibold capitalize">{req.status}</span></p>
                      {req.status === 'pending' && (
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => handleReviewRemovalRequest(req.id, 'approved')}
                            className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-500"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReviewRemovalRequest(req.id, 'rejected')}
                            className="px-3 py-1.5 rounded-lg bg-gray-700 text-white text-xs font-semibold hover:bg-gray-600"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {/* Content View */}
        {activeView === 'content' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Content Management
              </h2>
              <p className="text-gray-600 mt-2">Add instructors and AI-focused programs for the public website.</p>
            </div>

            <div className="grid xl:grid-cols-2 gap-6">
              <section className="dashboard-surface p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-indigo-900" />
                  <h3 className="text-xl font-bold text-gray-900">Add AI Program</h3>
                </div>
                <form onSubmit={addProgram} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    value={programForm.title}
                    onChange={(e) => setProgramForm({ ...programForm, title: e.target.value })}
                    placeholder="Program title"
                    className="sm:col-span-2 px-3 py-2 rounded-lg border border-gray-200"
                  />
                  <select
                    value={programForm.level}
                    onChange={(e) => setProgramForm({ ...programForm, level: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-gray-200"
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                    <option>All Levels</option>
                  </select>
                  <input
                    value={programForm.dept}
                    onChange={(e) => setProgramForm({ ...programForm, dept: e.target.value })}
                    placeholder="Department"
                    className="px-3 py-2 rounded-lg border border-gray-200"
                  />
                  <input
                    type="number"
                    min="1"
                    value={programForm.seats}
                    onChange={(e) => setProgramForm({ ...programForm, seats: Number(e.target.value) })}
                    placeholder="Seats"
                    className="px-3 py-2 rounded-lg border border-gray-200"
                  />
                  <input
                    value={programForm.duration}
                    onChange={(e) => setProgramForm({ ...programForm, duration: e.target.value })}
                    placeholder="Duration"
                    className="px-3 py-2 rounded-lg border border-gray-200"
                  />
                  <textarea
                    value={programForm.summary}
                    onChange={(e) => setProgramForm({ ...programForm, summary: e.target.value })}
                    placeholder="Summary"
                    className="sm:col-span-2 px-3 py-2 rounded-lg border border-gray-200 min-h-20"
                  />
                  <input
                    value={programForm.image}
                    onChange={(e) => setProgramForm({ ...programForm, image: e.target.value })}
                    placeholder="Image URL"
                    className="sm:col-span-2 px-3 py-2 rounded-lg border border-gray-200"
                  />
                  <button type="submit" className="sm:col-span-2 px-4 py-2 rounded-lg bg-indigo-900 text-white font-semibold hover:bg-indigo-800">
                    Save Program
                  </button>
                </form>
              </section>

              <section className="dashboard-surface p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-indigo-900" />
                  <h3 className="text-xl font-bold text-gray-900">Add Instructor</h3>
                </div>
                <form onSubmit={addInstructor} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    value={instructorForm.name}
                    onChange={(e) => setInstructorForm({ ...instructorForm, name: e.target.value })}
                    placeholder="Instructor name"
                    className="sm:col-span-2 px-3 py-2 rounded-lg border border-gray-200"
                  />
                  <input
                    value={instructorForm.dept}
                    onChange={(e) => setInstructorForm({ ...instructorForm, dept: e.target.value })}
                    placeholder="Department"
                    className="px-3 py-2 rounded-lg border border-gray-200"
                  />
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={instructorForm.rating}
                    onChange={(e) => setInstructorForm({ ...instructorForm, rating: Number(e.target.value) })}
                    placeholder="Rating"
                    className="px-3 py-2 rounded-lg border border-gray-200"
                  />
                  <textarea
                    value={instructorForm.expertise}
                    onChange={(e) => setInstructorForm({ ...instructorForm, expertise: e.target.value })}
                    placeholder="Expertise"
                    className="sm:col-span-2 px-3 py-2 rounded-lg border border-gray-200 min-h-20"
                  />
                  <input
                    value={instructorForm.image}
                    onChange={(e) => setInstructorForm({ ...instructorForm, image: e.target.value })}
                    placeholder="Profile image URL"
                    className="sm:col-span-2 px-3 py-2 rounded-lg border border-gray-200"
                  />
                  <button type="submit" className="sm:col-span-2 px-4 py-2 rounded-lg bg-indigo-900 text-white font-semibold hover:bg-indigo-800">
                    Save Instructor
                  </button>
                </form>
              </section>
            </div>

            <div className="grid xl:grid-cols-2 gap-6">
              <section className="dashboard-surface p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Published Programs</h3>
                <div className="space-y-2 max-h-80 overflow-y-auto scroll-container">
                  {programs.map((program) => (
                    <div key={program.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                      <div>
                        <p className="font-semibold text-gray-900">{program.title}</p>
                        <p className="text-xs text-gray-600">{program.level} • {program.dept}</p>
                      </div>
                      <button onClick={() => removeProgram(program.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              <section className="dashboard-surface p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Published Instructors</h3>
                <div className="space-y-2 max-h-80 overflow-y-auto scroll-container">
                  {instructors.map((ins) => (
                    <div key={ins.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                      <div>
                        <p className="font-semibold text-gray-900">{ins.name}</p>
                        <p className="text-xs text-gray-600">{ins.dept} • {ins.expertise}</p>
                      </div>
                      <button onClick={() => removeInstructor(ins.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {activeView === 'ops' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Ops Center
              </h2>
              <p className="text-gray-600 mt-2">Announcements, analytics, global search, and exports.</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <section className="dashboard-surface p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Megaphone className="w-5 h-5 text-indigo-900" />
                  <h3 className="text-xl font-bold text-gray-900">Publish Announcement</h3>
                </div>
                <form onSubmit={publishAnnouncement} className="space-y-3">
                  <input
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                    placeholder="Title"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200"
                    required
                  />
                  <textarea
                    value={announcementForm.message}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                    placeholder="Message"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 min-h-24"
                    required
                  />
                  <div className="flex gap-2 flex-wrap">
                    {['student', 'faculty', 'admin'].map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => toggleRoleTarget(role)}
                        className={`px-3 py-1 rounded-full text-sm ${
                          announcementForm.target_roles.includes(role)
                            ? 'bg-indigo-900 text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                  <input
                    value={announcementForm.target_departments.join(', ')}
                    onChange={(e) =>
                      setAnnouncementForm({
                        ...announcementForm,
                        target_departments: e.target.value
                          .split(',')
                          .map((d) => d.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="Departments (comma separated, optional)"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200"
                  />
                  <button type="submit" className="btn-primary px-5 py-2 rounded-lg">
                    Publish
                  </button>
                </form>
                <div className="mt-4 max-h-48 overflow-y-auto scroll-container space-y-2">
                  {announcements.slice(0, 6).map((a) => (
                    <div key={a.id} className="p-3 rounded-lg border border-gray-100 bg-gray-50">
                      <p className="font-semibold text-gray-900">{a.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{a.message}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="dashboard-surface p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Search className="w-5 h-5 text-indigo-900" />
                  <h3 className="text-xl font-bold text-gray-900">Global Search</h3>
                </div>
                <div className="flex gap-2">
                  <input
                    value={globalQuery}
                    onChange={(e) => setGlobalQuery(e.target.value)}
                    placeholder="Search events, users, instructors, workshops"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200"
                  />
                  <button onClick={runGlobalSearch} className="btn-primary px-4 py-2 rounded-lg">
                    Search
                  </button>
                </div>
                {searchResults && (
                  <div className="mt-4 text-sm text-gray-700 space-y-1">
                    <p>Events: {(searchResults.events || []).length}</p>
                    <p>Users: {(searchResults.users || []).length}</p>
                    <p>Instructors: {(searchResults.instructors || []).length}</p>
                    <p>Workshops: {(searchResults.workshops || []).length}</p>
                  </div>
                )}
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Download className="w-4 h-4 text-indigo-900" />
                    <p className="font-semibold text-gray-900">Export Center</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => downloadExport('events', 'csv')} className="px-3 py-2 rounded-lg bg-gray-100 text-gray-800 text-sm">Events CSV</button>
                    <button onClick={() => downloadExport('attendance', 'csv')} className="px-3 py-2 rounded-lg bg-gray-100 text-gray-800 text-sm">Attendance CSV</button>
                    <button onClick={() => downloadExport('participation', 'csv')} className="px-3 py-2 rounded-lg bg-gray-100 text-gray-800 text-sm">Participation CSV</button>
                  </div>
                </div>
              </section>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <section className="dashboard-surface p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Department Participation</h3>
                <div className="space-y-2">
                  {(analytics?.department_participation || []).slice(0, 8).map((d) => (
                    <div key={d.department} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{d.department}</span>
                      <span className="font-semibold text-indigo-900">{d.participants}</span>
                    </div>
                  ))}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mt-5 mb-3">Top Categories</h3>
                <div className="space-y-2">
                  {(analytics?.top_categories || []).slice(0, 6).map((c) => (
                    <div key={c.category} className="flex items-center justify-between text-sm">
                      <span className="capitalize text-gray-700">{c.category}</span>
                      <span className="font-semibold text-indigo-900">{c.registrations}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="dashboard-surface p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Attendance Intelligence</h3>
                <div className="space-y-2 max-h-72 overflow-y-auto scroll-container">
                  {attendanceInsights.slice(0, 12).map((insight) => (
                    <div key={insight.event_id} className="p-3 rounded-lg border border-gray-100">
                      <p className="font-semibold text-gray-900">{insight.event_title}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Attended {insight.attended}/{insight.total_registered} | Late {insight.late_entries} | No-show {insight.no_show}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {activeView === 'timetable' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Timetable Management
              </h2>
              <p className="text-gray-600 mt-2">Update weekly timetable here. Changes appear automatically on public timetable page.</p>
            </div>
            <TimetableManager canEdit />
          </div>
        )}
      </main>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scroll-container">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Create New Event
              </h3>
              <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Title</label>
                <input
                  type="text"
                  data-testid="event-title-input"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Annual Tech Fest 2026"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={eventForm.description}
                  data-testid="event-description-input"
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  required
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Describe your event..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={eventForm.category}
                    data-testid="event-category-select"
                    onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="seminar">Seminar</option>
                    <option value="workshop">Workshop</option>
                    <option value="cultural">Cultural</option>
                    <option value="sports">Sports</option>
                    <option value="technical">Technical</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Participants</label>
                  <input
                    type="number"
                    data-testid="event-max-participants-input"
                    value={eventForm.max_participants}
                    onChange={(e) => setEventForm({ ...eventForm, max_participants: parseInt(e.target.value) })}
                    required
                    min="1"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    data-testid="event-date-input"
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                  <input
                    type="time"
                    data-testid="event-time-input"
                    value={eventForm.time}
                    onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Venue</label>
                <input
                  type="text"
                  data-testid="event-venue-input"
                  value={eventForm.venue}
                  onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  placeholder="Main Auditorium"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Organizer</label>
                <input
                  type="text"
                  data-testid="event-organizer-input"
                  value={eventForm.organizer}
                  onChange={(e) => setEventForm({ ...eventForm, organizer: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  placeholder="Computer Science Department"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department (Optional)</label>
                <input
                  type="text"
                  value={eventForm.department}
                  onChange={(e) => setEventForm({ ...eventForm, department: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  placeholder="Computer Science"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image URL (Optional)</label>
                <input
                  type="url"
                  value={eventForm.image_url}
                  onChange={(e) => setEventForm({ ...eventForm, image_url: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <button type="submit" data-testid="submit-create-event" className="w-full btn-primary py-4 mt-6">
                Create Event
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scroll-container">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Edit Event
              </h3>
              <button onClick={() => { setShowEditModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Event Title</label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image URL (Optional)</label>
                <input
                  type="url"
                  value={eventForm.image_url}
                  onChange={(e) => setEventForm({ ...eventForm, image_url: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={eventForm.category}
                    onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="seminar">Seminar</option>
                    <option value="workshop">Workshop</option>
                    <option value="cultural">Cultural</option>
                    <option value="sports">Sports</option>
                    <option value="technical">Technical</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={eventForm.status || 'upcoming'}
                    onChange={(e) => setEventForm({ ...eventForm, status: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full btn-primary py-4 mt-6">
                Update Event
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
