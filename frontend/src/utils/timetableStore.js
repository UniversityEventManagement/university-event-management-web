const storageKey = 'campushub_timetable_v1';
const updateEvent = 'campushub-timetable-updated';

const defaultSlots = [
  { id: 'm1', day: 'Monday', time: '09:00 - 11:00', title: 'AI Foundations', venue: 'Lab 3', track: 'Academic', instructor: 'Dr. Riya Sharma' },
  { id: 't1', day: 'Tuesday', time: '13:00 - 15:00', title: 'Startup Workshop', venue: 'Hall A', track: 'Innovation', instructor: 'Prof. Arjun Menon' },
  { id: 'w1', day: 'Wednesday', time: '10:00 - 12:00', title: 'Cloud Clinic', venue: 'Lab 2', track: 'Technical', instructor: 'Dr. Sana Khan' },
  { id: 'th1', day: 'Thursday', time: '14:00 - 16:00', title: 'Design Sprint', venue: 'Studio 1', track: 'Design', instructor: 'Prof. Neha Iyer' },
  { id: 'f1', day: 'Friday', time: '11:00 - 13:00', title: 'Career Masterclass', venue: 'Seminar 4', track: 'Career', instructor: 'Prof. Mehul Patel' },
];

export function getTimetableSlots() {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || 'null');
    return Array.isArray(parsed) && parsed.length ? parsed : defaultSlots;
  } catch {
    return defaultSlots;
  }
}

export function saveTimetableSlots(slots) {
  localStorage.setItem(storageKey, JSON.stringify(slots));
  window.dispatchEvent(new CustomEvent(updateEvent));
}

export function subscribeTimetableUpdates(onUpdate) {
  const onStorage = (event) => {
    if (event.key === storageKey) onUpdate(getTimetableSlots());
  };
  const onCustom = () => onUpdate(getTimetableSlots());
  window.addEventListener('storage', onStorage);
  window.addEventListener(updateEvent, onCustom);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(updateEvent, onCustom);
  };
}
