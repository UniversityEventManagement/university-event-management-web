const slots = [
  { day: 'Monday', time: '09:00 - 11:00', title: 'AI Foundations', venue: 'Lab 3' },
  { day: 'Tuesday', time: '13:00 - 15:00', title: 'Startup Workshop', venue: 'Hall A' },
  { day: 'Wednesday', time: '10:00 - 12:00', title: 'Cloud Clinic', venue: 'Lab 2' },
  { day: 'Thursday', time: '14:00 - 16:00', title: 'Design Sprint', venue: 'Studio 1' },
  { day: 'Friday', time: '11:00 - 13:00', title: 'Career Masterclass', venue: 'Seminar 4' },
];

export default function TimetablePage() {
  return (
    <main id="main-content" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Weekly Timetable</h1>
      <p className="mt-2 text-gray-600">Track learning sessions and event schedules in one timeline.</p>
      <div className="mt-6 dashboard-surface overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Day</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Time</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Session</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Venue</th>
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <tr key={`${slot.day}-${slot.title}`} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900 font-medium">{slot.day}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{slot.time}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{slot.title}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{slot.venue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
