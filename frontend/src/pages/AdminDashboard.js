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
  Sparkles,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, cachedGet, clearApiCache } from '../utils/api';
import { getInstructors, getPrograms, saveInstructors, savePrograms } from '@/utils/contentStore';
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
      toast.error('Failed to update event');
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-pulse text-indigo-900 font-semibold text-xl">Loading...</div>
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
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
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
                      backgroundImage: `url(${event.image_url || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?crop=entropy&cs=srgb&fm=jpg&q=85'})`,
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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
