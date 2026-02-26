import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Calendar, Clock3, PencilLine, Plus, Trash2, UserRound } from 'lucide-react';
import { toast } from 'sonner';

const storageKey = 'campushub_timetable_v1';

const defaultSlots = [
  { id: 'm1', day: 'Monday', time: '09:00 - 11:00', title: 'AI Foundations', venue: 'Lab 3', track: 'Academic', instructor: 'Dr. Riya Sharma' },
  { id: 't1', day: 'Tuesday', time: '13:00 - 15:00', title: 'Startup Workshop', venue: 'Hall A', track: 'Innovation', instructor: 'Prof. Arjun Menon' },
  { id: 'w1', day: 'Wednesday', time: '10:00 - 12:00', title: 'Cloud Clinic', venue: 'Lab 2', track: 'Technical', instructor: 'Dr. Sana Khan' },
  { id: 'th1', day: 'Thursday', time: '14:00 - 16:00', title: 'Design Sprint', venue: 'Studio 1', track: 'Design', instructor: 'Prof. Neha Iyer' },
  { id: 'f1', day: 'Friday', time: '11:00 - 13:00', title: 'Career Masterclass', venue: 'Seminar 4', track: 'Career', instructor: 'Prof. Mehul Patel' },
];

function readSlots() {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || 'null');
    return Array.isArray(parsed) && parsed.length ? parsed : defaultSlots;
  } catch {
    return defaultSlots;
  }
}

export default function TimetablePage() {
  const { user } = useOutletContext() || {};
  const canEdit = user?.role === 'admin' || user?.role === 'faculty';

  const [slots, setSlots] = useState(readSlots);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    day: 'Monday',
    time: '',
    title: '',
    venue: '',
    track: 'Academic',
    instructor: '',
  });

  const orderedSlots = useMemo(() => {
    const order = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7 };
    return [...slots].sort((a, b) => (order[a.day] || 99) - (order[b.day] || 99));
  }, [slots]);

  const persist = (next) => {
    setSlots(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
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

    if (editingId) {
      const next = slots.map((slot) => (slot.id === editingId ? { ...slot, ...form } : slot));
      persist(next);
      toast.success('Timetable slot updated.');
    } else {
      const next = [...slots, { id: `${Date.now()}`, ...form }];
      persist(next);
      toast.success('Timetable slot added.');
    }

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
    const next = slots.filter((slot) => slot.id !== id);
    persist(next);
    if (editingId === id) resetForm();
    toast.success('Timetable slot deleted.');
  };

  return (
    <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Timetable Planner</h1>
          <p className="mt-2 text-gray-600">Structured weekly schedule for classes, workshops, and event-linked sessions.</p>
        </div>
        <div className="inline-flex px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700">
          {canEdit ? 'Edit access: Faculty/Admin' : 'View only: Student/Guest'}
        </div>
      </div>

      <section className="mt-6 grid md:grid-cols-3 gap-4">
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

      {canEdit && (
        <section className="mt-6 dashboard-surface p-5">
          <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Slot' : 'Add New Slot'}</h2>
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <select value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-200">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
            <input value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} placeholder="09:00 - 11:00" className="px-3 py-2 rounded-lg border border-gray-200" />
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

      <section className="mt-6 dashboard-surface overflow-x-auto">
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
              <tr key={slot.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{slot.day}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{slot.time}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{slot.title}</td>
                <td className="px-4 py-3 text-sm">
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-900">{slot.track}</span>
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
    </main>
  );
}
