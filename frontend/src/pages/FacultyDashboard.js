import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  Calendar,
  Clock3,
  House,
  Users,
  Plus,
  LogOut,
  Edit2,
  Trash2,
  Download,
  TrendingUp,
  CheckCircle,
  Megaphone,
  BarChart3,
  Search,
  X,
  UserCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, cachedGet, clearApiCache } from '../utils/api';
import TimetableManager from '@/components/TimetableManager';

export default function FacultyDashboard({ user, onLogout }) {
  const [activeView, setActiveView] = useState('dashboard');
  const [events, setEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [checkinCode, setCheckinCode] = useState('');
  const [checkinCodeExpires, setCheckinCodeExpires] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [attendanceInsights, setAttendanceInsights] = useState([]);
  const [globalQuery, setGlobalQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    target_roles: ['student'],
    target_departments: [],
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

  const fetchData = async () => {
    try {
      const [eventsData, statsData] = await Promise.all([
        cachedGet('/events'),
        cachedGet('/dashboard/stats'),
      ]);
      
      // Filter events created by this faculty
      const myEvents = eventsData.filter(e => e.created_by === user.id);
      setEvents(myEvents);
      setAllEvents(eventsData);
      setStats(statsData);
      try {
        const [annData, analyticsData, insightsData] = await Promise.all([
          cachedGet('/announcements'),
          cachedGet('/dashboard/analytics'),
          cachedGet('/attendance/insights'),
        ]);
        setAnnouncements(annData);
        setAnalytics(analyticsData);
        setAttendanceInsights(insightsData);
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
      toast.error('You can only delete your own events');
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

  const viewParticipants = async (event) => {
    setSelectedEvent(event);
    setCheckinCode('');
    setCheckinCodeExpires('');
    try {
      const response = await api.get(`/registrations/event/${event.id}`);
      setParticipants(response.data);
      setShowParticipantsModal(true);
    } catch (error) {
      toast.error('Failed to load participants');
    }
  };

  const generateCheckinCode = async () => {
    if (!selectedEvent) return;
    try {
      const response = await api.post(`/events/${selectedEvent.id}/checkin-code`);
      setCheckinCode(response.data.code);
      setCheckinCodeExpires(new Date(response.data.expires_at).toLocaleString());
      toast.success('Check-in code generated');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate check-in code');
    }
  };

  const downloadReport = (event) => {
    const csvContent = [
      ['Name', 'Email', 'Registration Date', 'Status'],
      ...participants.map(p => [
        p.user_name,
        p.user_email,
        new Date(p.registered_at).toLocaleDateString(),
        p.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title.replace(/\s+/g, '_')}_participants.csv`;
    a.click();
    toast.success('Report downloaded!');
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
      setAnnouncementForm({ title: '', message: '', target_roles: ['student'], target_departments: [] });
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
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-pulse text-indigo-900 font-semibold text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dashboard-shell lg:flex" data-testid="faculty-dashboard">
      {/* Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 sidebar-modern text-white lg:min-h-screen lg:fixed lg:left-0 lg:top-0 p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
            CampusHub
          </h1>
          <p className="text-indigo-300 text-sm mt-1">Faculty Panel</p>
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
            <span className="font-medium">My Events</span>
          </button>

          <button
            onClick={() => setActiveView('all-events')}
            data-testid="all-events-nav"
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeView === 'all-events' ? 'bg-white text-indigo-900' : 'text-white hover:bg-indigo-800'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="font-medium">All Events</span>
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
            onClick={() => setActiveView('insights')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeView === 'insights' ? 'bg-white text-indigo-900' : 'text-white hover:bg-indigo-800'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="font-medium">Insights</span>
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
              <p className="text-sm text-gray-500">Faculty Panel</p>
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
              My Events
            </button>
            <button
              onClick={() => setActiveView('all-events')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === 'all-events' ? 'bg-indigo-900 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              All Events
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
              onClick={() => setActiveView('insights')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === 'insights' ? 'bg-indigo-900 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Insights
            </button>
          </div>
        </div>
        {/* Dashboard View */}
        {activeView === 'dashboard' && stats && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Faculty Dashboard
              </h2>
              <p className="text-gray-600 mt-2">Manage your events and track participation</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="stat-card">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-600 font-medium uppercase tracking-wide">My Events</p>
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
                  <p className="text-sm text-gray-600 font-medium uppercase tracking-wide">Total Participants</p>
                  <Users className="w-8 h-8 text-amber-400" />
                </div>
                <p className="text-4xl font-bold text-gray-900">{stats.total_registrations}</p>
                <p className="text-sm text-gray-500 mt-2">Across all events</p>
              </div>
            </div>

            {/* Recent Events */}
            <div className="dashboard-surface p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
                My Recent Events
              </h3>
              {events.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">You haven't created any events yet</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 btn-primary flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    Create Your First Event
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {events.slice(0, 5).map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{event.title}</p>
                        <p className="text-sm text-gray-600">{event.date} • {event.venue}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-900 rounded-full text-xs font-semibold">
                          {event.category}
                        </span>
                        <button
                          onClick={() => viewParticipants(event)}
                          data-testid={`view-participants-${event.id}`}
                          className="text-sm text-indigo-900 hover:underline font-medium"
                        >
                          {event.registered_count} participants
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* My Events View */}
        {activeView === 'events' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  My Events
                </h2>
                <p className="text-gray-600 mt-2">{events.length} events created by you</p>
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
                      backgroundImage: `url(${event.image_url || 'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?crop=entropy&cs=srgb&fm=jpg&q=85'})`,
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

                  <div className="grid grid-cols-2 gap-3 text-sm mb-4">
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

                  <button
                    onClick={() => viewParticipants(event)}
                    className="w-full px-4 py-2 bg-indigo-50 text-indigo-900 rounded-lg hover:bg-indigo-100 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    View Participants
                  </button>
                </div>
              ))}
            </div>

            {events.length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-600">No events created yet</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-6 btn-primary"
                >
                  Create Your First Event
                </button>
              </div>
            )}
          </div>
        )}

        {/* All Events View */}
        {activeView === 'all-events' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                All University Events
              </h2>
              <p className="text-gray-600 mt-2">{allEvents.length} total events</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {allEvents.map((event) => (
                <div key={event.id} className="dashboard-surface p-6">
                  <div
                    className="event-image-strip mb-4"
                    style={{
                      backgroundImage: `url(${event.image_url || 'https://images.unsplash.com/photo-1511578314322-379afb476865?crop=entropy&cs=srgb&fm=jpg&q=85'})`,
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
                  </div>

                  <p className="text-sm text-gray-600 mb-4">{event.description}</p>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Date</p>
                      <p className="font-semibold text-gray-900">{event.date}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Venue</p>
                      <p className="font-semibold text-gray-900">{event.venue}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Organizer</p>
                      <p className="font-semibold text-gray-900">{event.organizer}</p>
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

        {activeView === 'insights' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Insights & Communication
              </h2>
              <p className="text-gray-600 mt-2">Track attendance intelligence, share announcements, and export records.</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <section className="dashboard-surface p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Megaphone className="w-5 h-5 text-indigo-900" />
                  <h3 className="text-xl font-bold text-gray-900">Faculty Announcement</h3>
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
                    {['student', 'faculty'].map((role) => (
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
                  <button type="submit" className="btn-primary px-5 py-2 rounded-lg">
                    Publish
                  </button>
                </form>
                <div className="mt-4 max-h-48 overflow-y-auto scroll-container space-y-2">
                  {announcements.slice(0, 5).map((a) => (
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
                <div className="flex gap-2 mb-3">
                  <input
                    value={globalQuery}
                    onChange={(e) => setGlobalQuery(e.target.value)}
                    placeholder="Search events/users/instructors/workshops"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200"
                  />
                  <button onClick={runGlobalSearch} className="btn-primary px-4 py-2 rounded-lg">
                    Search
                  </button>
                </div>
                {searchResults && (
                  <div className="text-sm text-gray-700 space-y-1">
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
                <h3 className="text-lg font-bold text-gray-900 mb-3">Top Categories (My scope)</h3>
                <div className="space-y-2">
                  {(analytics?.top_categories || []).slice(0, 8).map((c) => (
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
              <p className="text-gray-600 mt-2">Manage timetable slots from faculty panel. Public timetable updates automatically.</p>
            </div>
            <TimetableManager canEdit />
          </div>
        )}
      </main>

      {/* Create Event Modal - Same as Admin */}
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

      {/* Edit Event Modal - Similar to Create */}
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

              <button type="submit" className="w-full btn-primary py-4 mt-6">
                Update Event
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Participants Modal */}
      {showParticipantsModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto scroll-container">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Participants - {selectedEvent.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{participants.length} registered</p>
                {checkinCode && (
                  <p className="text-sm text-indigo-700 mt-1">
                    Active check-in code: <span className="font-bold">{checkinCode}</span> (expires {checkinCodeExpires})
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={generateCheckinCode}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                >
                  <UserCheck className="w-4 h-4" />
                  Generate Check-in Code
                </button>
                <button
                  onClick={() => downloadReport(selectedEvent)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-900 text-white rounded-lg hover:bg-indigo-800 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
                <button
                  onClick={() => setShowParticipantsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {participants.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No participants yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 uppercase tracking-wide">Name</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 uppercase tracking-wide">Email</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 uppercase tracking-wide">Registration Date</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 uppercase tracking-wide">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {participants.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-900 font-medium">{p.user_name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{p.user_email}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(p.registered_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold uppercase">
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
