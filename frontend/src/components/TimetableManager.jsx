import { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock3, PencilLine, Plus, Trash2, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { getTimetableSlots, saveTimetableSlots, subscribeTimetableUpdates } from '@/utils/timetableStore';

export default function TimetableManager({ canEdit = false, compact = false }) {
  const [slots, setSlots] = useState(getTimetableSlots);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    day: 'Monday',
    time: '',
    title: '',
    venue: '',
    track: 'Academic',
    instructor: '',
  });

  useEffect(() => subscribeTimetableUpdates(setSlots), []);

  const orderedSlots = useMemo(() => {
    const order = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7 };
    return [...slots].sort((a, b) => (order[a.day] || 99) - (order[b.day] || 99));
  }, [slots]);

  const dayPalette = {
    Monday: 'from-blue-500/20 to-cyan-500/20 border-blue-200',
    Tuesday: 'from-violet-500/20 to-fuchsia-500/20 border-violet-200',
    Wednesday: 'from-emerald-500/20 to-teal-500/20 border-emerald-200',
    Thursday: 'from-amber-500/20 to-orange-500/20 border-amber-200',
    Friday: 'from-rose-500/20 to-pink-500/20 border-rose-200',
    Saturday: 'from-slate-500/20 to-gray-500/20 border-slate-200',
    Sunday: 'from-indigo-500/20 to-blue-500/20 border-indigo-200',
  };

  const trackPalette = {
    Academic: 'bg-blue-100 text-blue-800',
    Technical: 'bg-violet-100 text-violet-800',
    Innovation: 'bg-emerald-100 text-emerald-800',
    Design: 'bg-amber-100 text-amber-800',
    Career: 'bg-rose-100 text-rose-800',
  };

  const persist = (next) => {
    setSlots(next);
    saveTimetableSlots(next);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ day: 'Monday', time: '', title: '', venue: '', track: 'Academic', instructor: '' });
  };

  const saveSlot = () => {
    if (!form.title.trim() || !form.time.trim() || !form.venue.trim()) {
      toast.error('Please fill title, time, and venue.');
      return;
    }
    const next = editingId
      ? slots.map((slot) => (slot.id === editingId ? { ...slot, ...form } : slot))
      : [...slots, { id: `${Date.now()}`, ...form }];
    persist(next);
    toast.success(editingId ? 'Timetable slot updated.' : 'Timetable slot added.');
    resetForm();
  };

  const startEdit = (slot) => {
    setEditingId(slot.id);
    setForm({
      day: slot.day,
      time: slot.time,
      title: slot.title,
      venue: slot.venue,
      track: slot.track || 'Academic',
      instructor: slot.instructor || '',
    });
  };

  const removeSlot = (id) => {
    persist(slots.filter((slot) => slot.id !== id));
    if (editingId === id) resetForm();
    toast.success('Timetable slot deleted.');
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-600 via-sky-600 to-fuchsia-600 p-5 text-white">
        <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -bottom-12 -right-8 w-40 h-40 rounded-full bg-amber-300/25 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-indigo-100">Weekly View</p>
            <h3 className="text-2xl font-bold mt-1" style={{ fontFamily: 'Outfit, sans-serif' }}>Campus Timetable Board</h3>
          </div>
          <p className="text-sm text-indigo-50">
            {canEdit ? 'You can manage slots here.' : 'Read-only public schedule.'}
          </p>
        </div>
      </section>

      {!compact && (
        <section className="grid md:grid-cols-3 gap-4">
          <div className="stat-card">
            <div className="flex items-center gap-2 text-gray-600 text-sm"><Calendar className="w-4 h-4" /> Total Slots</div>
            <p className="mt-2 text-3xl font-bold text-gray-900">{slots.length}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2 text-gray-600 text-sm"><Clock3 className="w-4 h-4" /> Days Covered</div>
            <p className="mt-2 text-3xl font-bold text-gray-900">{new Set(slots.map((s) => s.day)).size}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2 text-gray-600 text-sm"><UserRound className="w-4 h-4" /> Faculty Assigned</div>
            <p className="mt-2 text-3xl font-bold text-gray-900">{new Set(slots.map((s) => s.instructor).filter(Boolean)).size}</p>
          </div>
        </section>
      )}

      <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {Object.keys(dayPalette).map((day) => {
          const count = orderedSlots.filter((slot) => slot.day === day).length;
          return (
            <div key={day} className={`rounded-xl border p-4 bg-gradient-to-br ${dayPalette[day] || 'from-gray-100 to-gray-50 border-gray-200'}`}>
              <p className="text-sm font-semibold text-gray-900">{day}</p>
              <p className="text-xs text-gray-600 mt-1">{count} slot{count === 1 ? '' : 's'} scheduled</p>
            </div>
          );
        })}
      </section>

      {canEdit && (
        <section className="dashboard-surface p-5">
          <h3 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Timetable Slot' : 'Add Timetable Slot'}</h3>
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <select value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-200">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              className="px-3 py-2 rounded-lg border border-gray-200"
            />
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Session title" className="px-3 py-2 rounded-lg border border-gray-200" />
            <input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="Venue" className="px-3 py-2 rounded-lg border border-gray-200" />
            <input value={form.instructor} onChange={(e) => setForm({ ...form, instructor: e.target.value })} placeholder="Instructor" className="px-3 py-2 rounded-lg border border-gray-200" />
            <select value={form.track} onChange={(e) => setForm({ ...form, track: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-200">
              {['Academic', 'Technical', 'Innovation', 'Design', 'Career'].map((track) => (
                <option key={track} value={track}>{track}</option>
              ))}
            </select>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={saveSlot} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-900 text-white text-sm font-semibold hover:bg-indigo-800">
              <Plus className="w-4 h-4" />
              {editingId ? 'Update Slot' : 'Add Slot'}
            </button>
            {editingId && (
              <button onClick={resetForm} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel Edit
              </button>
            )}
          </div>
        </section>
      )}

      <section className="dashboard-surface overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Day</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Time</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Session</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Track</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Instructor</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Venue</th>
              {canEdit && <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {orderedSlots.map((slot) => (
              <tr key={slot.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{slot.day}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{slot.time}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{slot.title}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${trackPalette[slot.track] || 'bg-indigo-100 text-indigo-900'}`}>
                    {slot.track}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{slot.instructor || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{slot.venue}</td>
                {canEdit && (
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button onClick={() => startEdit(slot)} className="p-2 rounded-lg text-indigo-900 hover:bg-indigo-50" aria-label="Edit slot">
                        <PencilLine className="w-4 h-4" />
                      </button>
                      <button onClick={() => removeSlot(slot.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50" aria-label="Delete slot">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
