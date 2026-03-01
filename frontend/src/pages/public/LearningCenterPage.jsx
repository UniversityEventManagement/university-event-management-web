import { useMemo, useState } from 'react';

const workshopData = [
  {
    id: 'ws-ai-1',
    title: 'AI in Campus Operations',
    category: 'technical',
    format: 'Workshop',
    organizer: 'Computer Science Department',
    department: 'CSE',
    duration: '3 Hours',
    venue: 'Innovation Lab 2',
    summary: 'Hands-on workshop on automation, scheduling intelligence, and analytics for university events.',
  },
  {
    id: 'ws-ev-2',
    title: 'Large Event Logistics Bootcamp',
    category: 'operations',
    format: 'Training',
    organizer: 'Student Affairs Office',
    department: 'Admin',
    duration: '2 Hours',
    venue: 'Seminar Hall A',
    summary: 'Operational planning for registrations, crowd flow, and contingency response.',
  },
  {
    id: 'ws-pr-3',
    title: 'Sponsorship and Outreach Masterclass',
    category: 'management',
    format: 'Masterclass',
    organizer: 'Marketing Cell',
    department: 'MBA',
    duration: '90 Minutes',
    venue: 'Conference Room 1',
    summary: 'Build outreach plans for inter-college fests and secure high-quality sponsor partnerships.',
  },
];

export default function LearningCenterPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [department, setDepartment] = useState('all');

  const filteredItems = useMemo(
    () =>
      workshopData.filter((item) => {
        const matchesQuery =
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.organizer.toLowerCase().includes(query.toLowerCase()) ||
          item.venue.toLowerCase().includes(query.toLowerCase());
        const matchesCategory = category === 'all' || item.category === category;
        const matchesDept = department === 'all' || item.department === department;
        return matchesQuery && matchesCategory && matchesDept;
      }),
    [query, category, department]
  );

  return (
    <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
        Programs and Workshops
      </h1>
      <p className="mt-2 text-gray-600">
        Event-focused training programs, workshops, and operational sessions for campus organizers.
      </p>

      <section className="mt-6 dashboard-surface p-4 grid md:grid-cols-3 gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, organizer, venue"
          className="px-3 py-2 rounded-lg border border-gray-200"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200"
        >
          <option value="all">All Categories</option>
          <option value="technical">Technical</option>
          <option value="operations">Operations</option>
          <option value="management">Management</option>
        </select>
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200"
        >
          <option value="all">All Departments</option>
          <option value="CSE">CSE</option>
          <option value="Admin">Admin</option>
          <option value="MBA">MBA</option>
        </select>
      </section>

      <section className="mt-6 grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <article key={item.id} className="dashboard-surface p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-gray-900">{item.title}</h2>
              <span className="px-2 py-1 rounded-full bg-indigo-100 text-indigo-900 text-xs font-semibold uppercase">
                {item.format}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-600">{item.summary}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-gray-600">
              <p><span className="font-semibold text-gray-900">Organizer:</span> {item.organizer}</p>
              <p><span className="font-semibold text-gray-900">Department:</span> {item.department}</p>
              <p><span className="font-semibold text-gray-900">Duration:</span> {item.duration}</p>
              <p><span className="font-semibold text-gray-900">Venue:</span> {item.venue}</p>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
