import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Calendar,
  Bell,
  LogOut,
  House,
  Search,
  Filter,
  MapPin,
  Clock,
  Users,
  CheckCircle,
  X,
  Copy,
  Trophy,
  Star,
  Sparkles,
  Download,
  Link as LinkIcon,
  Share2,
} from 'lucide-react';
import { api, cachedGet, clearApiCache } from '../utils/api';
import { getEventCardImage } from '../utils/eventImages';

const INTEREST_OPTIONS = ['seminar', 'workshop', 'cultural', 'sports', 'technical', 'career', 'startup'];

export default function StudentDashboard({ user, onLogout }) {
  const [events, setEvents] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(user);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState('explore');
  const [interests, setInterests] = useState([]);
  const [inviteCode, setInviteCode] = useState('');
  const [checkInCode, setCheckInCode] = useState('');
  const [feedbackByEvent, setFeedbackByEvent] = useState({});
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventsData, regsData, notifsData, statsData, meData, leaderboardData] = await Promise.all([
        cachedGet('/events/recommended'),
        cachedGet('/registrations/my'),
        cachedGet('/notifications'),
        cachedGet('/dashboard/stats'),
        cachedGet('/auth/me'),
        cachedGet('/leaderboard', { params: { limit: 5 } }),
      ]);
      setEvents(eventsData);
      setMyRegistrations(regsData);
      setNotifications(notifsData);
      setStats(statsData);
      setProfile(meData);
      setInterests(meData.interests || []);
      setLeaderboard(leaderboardData);
      try {
        const annData = await cachedGet('/announcements');
        setAnnouncements(annData);
      } catch (announcementError) {
        console.error('Announcements unavailable', announcementError);
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (eventId) => {
    try {
      await api.post('/registrations', { event_id: eventId });
      toast.success('Successfully registered for event! +10 points');
      clearApiCache();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    }
  };

  const handleJoinWithInviteCode = async () => {
    if (!inviteCode.trim()) {
      toast.error('Enter an invite code');
      return;
    }
    try {
      await api.post(`/registrations/invite/${inviteCode.trim()}`);
      toast.success('Joined event with invite code');
      setInviteCode('');
      clearApiCache();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid invite code');
    }
  };

  const handleGenerateInvite = async (registrationId) => {
    try {
      const response = await api.get(`/registrations/${registrationId}/invite`);
      const code = response.data.invite_code;
      await navigator.clipboard.writeText(code);
      toast.success(`Invite code copied: ${code}`);
    } catch (error) {
      toast.error('Failed to generate invite code');
    }
  };

  const handleCheckIn = async () => {
    if (!checkInCode.trim()) {
      toast.error('Enter check-in code');
      return;
    }
    try {
      await api.post('/registrations/checkin', { code: checkInCode.trim().toUpperCase() });
      toast.success('Check-in successful! +20 points');
      setCheckInCode('');
      clearApiCache();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Check-in failed');
    }
  };

  const handleSubmitFeedback = async (eventId) => {
    const data = feedbackByEvent[eventId];
    if (!data?.rating) {
      toast.error('Please select a rating');
      return;
    }
    try {
      const response = await api.post('/feedback', {
        event_id: eventId,
        rating: Number(data.rating),
        comment: data.comment || '',
      });
      toast.success('Feedback submitted! +5 points');
      const suggested = response.data?.next_recommended_events || [];
      if (suggested.length > 0) {
        const names = suggested.map((e) => e.title).join(', ');
        toast.message(`Recommended next: ${names}`);
      }
      clearApiCache();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Feedback failed');
    }
  };

  const handleCancelRegistration = async (registrationId) => {
    try {
      await api.delete(`/registrations/${registrationId}`);
      toast.success('Registration cancelled');
      clearApiCache();
      fetchData();
    } catch (error) {
      toast.error('Failed to cancel registration');
    }
  };

  const handleInterestsSave = async () => {
    try {
      await api.put('/users/interests', { interests });
      toast.success('Interests updated');
      clearApiCache();
      fetchData();
    } catch (error) {
      toast.error('Failed to save interests');
    }
  };

  const toggleInterest = (interest) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((item) => item !== interest) : [...prev, interest]
    );
  };

  const markNotificationRead = async (notifId) => {
    try {
      await api.put(`/notifications/${notifId}/read`);
      clearApiCache();
      fetchData();
    } catch (error) {
      console.error('Failed to mark as read');
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      clearApiCache();
      fetchData();
    } catch (error) {
      console.error('Failed to mark all as read');
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const isRegistered = (eventId) => {
    return myRegistrations.some((reg) => reg.event_id === eventId && reg.status !== 'cancelled');
  };

  const getRegistration = (eventId) => myRegistrations.find((r) => r.event_id === eventId);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const categories = ['all', 'seminar', 'workshop', 'cultural', 'sports', 'technical', 'other'];

  const getEventCountdown = (date, time) => {
    const parsed = new Date(`${date}T${time || '00:00'}`);
    if (Number.isNaN(parsed.getTime())) return '';
    const diffMs = parsed.getTime() - Date.now();
    if (diffMs <= 0) return 'Live / Completed';
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    if (diffDays > 0) return `${diffDays}d ${diffHours}h left`;
    const diffMins = Math.floor((diffMs / (1000 * 60)) % 60);
    return `${diffHours}h ${diffMins}m left`;
  };

  const handleCopyEventLink = async (eventId) => {
    try {
      const eventLink = `${window.location.origin}/?event=${eventId}`;
      await navigator.clipboard.writeText(eventLink);
      toast.success('Event link copied');
    } catch (error) {
      toast.error('Failed to copy event link');
    }
  };

  const handleAddToCalendar = (event) => {
    const toUtcStamp = (date, time) => {
      const parsed = new Date(`${date}T${time || '00:00'}`);
      return parsed.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const start = toUtcStamp(event.date, event.time);
    const endDate = new Date(`${event.date}T${event.time || '00:00'}`);
    endDate.setHours(endDate.getHours() + 2);
    const end = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(event.description || 'University event');
    const location = encodeURIComponent(event.venue || 'Campus');
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
    window.open(url, '_blank');
  };

  const handleDownloadCertificate = async (eventId, eventTitle) => {
    try {
      const response = await api.get(`/certificates/${eventId}/download`, {
        params: { format: 'pdf' },
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(eventTitle || 'certificate').replace(/\s+/g, '_')}_certificate.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Certificate downloaded');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Certificate not available yet');
    }
  };

  if (loading) {
    return (
      <div className="app-loader-screen">
        <div className="loader-ambient loader-ambient-a" />
        <div className="loader-ambient loader-ambient-b" />
        <div className="load" aria-label="Loading progress" />
        <p className="loader-label">Loading student dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen dashboard-shell" data-testid="student-dashboard">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold gradient-text" style={{ fontFamily: 'Outfit, sans-serif' }}>
                CampusHub
              </h1>
              <p className="text-sm text-gray-600 mt-1">Welcome back, {profile.name}</p>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-700">
                  <Trophy className="w-4 h-4" />
                  <span className="font-semibold">{profile.points || 0} XP</span>
                </div>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Bell className="w-6 h-6 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-rose-400 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="fixed left-4 right-4 top-20 sm:absolute sm:right-0 sm:left-auto sm:top-auto sm:mt-2 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 z-50">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs text-indigo-900 hover:text-indigo-700 font-medium">
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto scroll-container">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No notifications</div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => !notif.read && markNotificationRead(notif.id)}
                            className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${!notif.read ? 'bg-indigo-50' : ''}`}
                          >
                            <p className="font-semibold text-sm text-gray-900">{notif.title}</p>
                            <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                            <p className="text-xs text-gray-400 mt-2">{new Date(notif.created_at).toLocaleDateString()}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 sm:gap-2">
                <Link to="/" className="flex items-center gap-2 px-3 sm:px-4 py-2 text-gray-700 hover:text-indigo-900 transition-colors">
                  <House className="w-5 h-5" />
                  <span className="font-medium hidden sm:inline">Home</span>
                </Link>
                <button onClick={onLogout} className="flex items-center gap-2 px-3 sm:px-4 py-2 text-gray-700 hover:text-indigo-900 transition-colors">
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-4 sm:gap-6 mt-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('explore')}
              className={`pb-3 px-2 font-semibold transition-all relative ${activeTab === 'explore' ? 'text-indigo-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Explore Events
              {activeTab === 'explore' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-900"></div>}
            </button>
            <button
              onClick={() => setActiveTab('registered')}
              className={`pb-3 px-2 font-semibold transition-all relative ${activeTab === 'registered' ? 'text-indigo-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              My Events ({myRegistrations.length})
              {activeTab === 'registered' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-900"></div>}
            </button>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium uppercase tracking-wide">Upcoming Events</p>
                <p className="text-3xl font-bold text-indigo-900 mt-2">{stats?.upcoming_events || 0}</p>
              </div>
              <Calendar className="w-8 h-8 text-indigo-900" />
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium uppercase tracking-wide">My Registrations</p>
                <p className="text-3xl font-bold text-rose-400 mt-2">{stats?.total_registrations || 0}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-rose-400" />
            </div>
          </div>
          <div className="stat-card">
            <p className="text-sm text-gray-600 font-medium uppercase tracking-wide mb-2">Leaderboard</p>
            <div className="space-y-2">
              {leaderboard.map((entry, index) => (
                <div key={entry.user_id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">
                    #{index + 1} {entry.name}
                  </span>
                  <span className="font-semibold text-indigo-900">{entry.points}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {announcements.length > 0 && (
          <div className="bg-white rounded-xl p-5 border border-gray-100 mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-5 h-5 text-indigo-700" />
              <h3 className="font-semibold text-gray-900">Latest Announcements</h3>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto scroll-container">
              {announcements.slice(0, 4).map((item) => (
                <div key={item.id} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{item.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl p-5 border border-gray-100 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-indigo-700" />
            <h3 className="font-semibold text-gray-900">Personalize Your Feed</h3>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {INTEREST_OPTIONS.map((interest) => (
              <button
                key={interest}
                onClick={() => toggleInterest(interest)}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  interests.includes(interest)
                    ? 'bg-indigo-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
          <button onClick={handleInterestsSave} className="btn-primary text-sm px-5 py-2 rounded-lg">
            Save Interests
          </button>
          <div className="mt-3 text-sm text-gray-600">
            Badges: {(profile.badges || []).length > 0 ? profile.badges.join(', ') : 'No badges yet'}
          </div>
        </div>

        {activeTab === 'explore' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <div className="relative lg:col-span-2">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Join with invite code"
                  className="w-full px-4 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500"
                />
                <button onClick={handleJoinWithInviteCode} className="btn-primary px-4 py-3 rounded-xl">
                  Join
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap mb-6">
              <Filter className="w-5 h-5 text-gray-600" />
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${
                    selectedCategory === cat
                      ? 'bg-indigo-900 text-white'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => {
                const registration = getRegistration(event.id);
                return (
                  <div key={event.id} className="event-card card-hover">
                    <div
                      className="h-48 bg-cover bg-center rounded-t-xl"
                      style={{
                        backgroundImage: `url(${getEventCardImage(event)})`,
                      }}
                    >
                      <div className="h-full bg-gradient-to-t from-black/70 to-transparent rounded-t-xl flex items-end p-4">
                        <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-indigo-900 uppercase tracking-wide">
                          {event.category}
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        {event.title}
                      </h3>
                      <div className="mb-3 flex items-center gap-2 flex-wrap">
                        <span className="countdown-chip">{getEventCountdown(event.date, event.time)}</span>
                        {event.registered_count >= Math.max(10, Math.floor(event.max_participants * 0.6)) && (
                          <span className="trending-chip">
                            <Sparkles className="w-3 h-3" />
                            Trending
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{event.description}</p>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Calendar className="w-4 h-4 text-indigo-900" />
                          <span>{event.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Clock className="w-4 h-4 text-indigo-900" />
                          <span>{event.time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <MapPin className="w-4 h-4 text-indigo-900" />
                          <span>{event.venue}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Users className="w-4 h-4 text-indigo-900" />
                          <span>
                            {event.registered_count}/{event.max_participants} registered
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-4">
                        <button
                          onClick={() => handleAddToCalendar(event)}
                          className="flex-1 px-3 py-2 rounded-lg border border-indigo-100 text-indigo-800 bg-indigo-50 hover:bg-indigo-100 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                        >
                          <Calendar className="w-4 h-4" />
                          Add to Calendar
                        </button>
                        <button
                          onClick={() => handleCopyEventLink(event.id)}
                          className="px-3 py-2 rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                          title="Copy event link"
                        >
                          <LinkIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCopyEventLink(event.id)}
                          className="px-3 py-2 rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                          title="Share event"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>

                      {isRegistered(event.id) ? (
                        <div className="space-y-2">
                          <div className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-center font-semibold text-sm">
                            Registered
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleGenerateInvite(registration.id)}
                              className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-900 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                            >
                              <Copy className="w-4 h-4" />
                              Invite Squad
                            </button>
                            <button
                              onClick={() => handleCancelRegistration(registration.id)}
                              className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRegister(event.id)}
                          disabled={event.registered_count >= event.max_participants}
                          className={`w-full py-3 rounded-full font-semibold transition-all ${
                            event.registered_count >= event.max_participants
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'btn-primary'
                          }`}
                        >
                          {event.registered_count >= event.max_participants ? 'Event Full' : 'Register Now'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === 'registered' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 border border-gray-100 flex gap-3">
              <input
                type="text"
                value={checkInCode}
                onChange={(e) => setCheckInCode(e.target.value)}
                placeholder="Enter check-in code shared by organizer"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500"
              />
              <button onClick={handleCheckIn} className="btn-primary px-6 py-3 rounded-xl">
                Check In
              </button>
            </div>

            {myRegistrations.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-600">No registrations yet</p>
              </div>
            ) : (
              myRegistrations.map((reg) => {
                const event = events.find((e) => e.id === reg.event_id);
                if (!event) return null;
                const feedbackState = feedbackByEvent[event.id] || { rating: 5, comment: '' };
                return (
                  <div key={reg.id} className="bg-white rounded-xl p-6 border border-gray-100">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                          {event.title}
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-indigo-900" />
                            <span>{event.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-indigo-900" />
                            <span>{event.time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-indigo-900" />
                            <span>{event.venue}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="font-semibold capitalize">{reg.status}</span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex items-center gap-2">
                        {reg.status === 'attended' && (
                          <button
                            onClick={() => handleDownloadCertificate(event.id, event.title)}
                            className="px-4 py-2 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors font-medium flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Certificate
                          </button>
                        )}
                        <button
                          onClick={() => handleCancelRegistration(reg.id)}
                          className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-gray-100 pt-4">
                      <p className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500" />
                        Quick Feedback
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <select
                          value={feedbackState.rating}
                          onChange={(e) =>
                            setFeedbackByEvent((prev) => ({
                              ...prev,
                              [event.id]: { ...feedbackState, rating: e.target.value },
                            }))
                          }
                          className="px-3 py-2 rounded-lg border border-gray-200"
                        >
                          <option value="5">5 - Excellent</option>
                          <option value="4">4 - Good</option>
                          <option value="3">3 - Average</option>
                          <option value="2">2 - Poor</option>
                          <option value="1">1 - Bad</option>
                        </select>
                        <input
                          type="text"
                          value={feedbackState.comment}
                          onChange={(e) =>
                            setFeedbackByEvent((prev) => ({
                              ...prev,
                              [event.id]: { ...feedbackState, comment: e.target.value },
                            }))
                          }
                          placeholder="One-line feedback"
                          className="md:col-span-2 px-3 py-2 rounded-lg border border-gray-200"
                        />
                        <button
                          onClick={() => handleSubmitFeedback(event.id)}
                          className="px-3 py-2 bg-indigo-900 text-white rounded-lg hover:bg-indigo-800"
                        >
                          Submit
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>
    </div>
  );
}
