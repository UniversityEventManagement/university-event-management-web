import { useEffect, useState } from 'react';
import { getInstructors } from '@/utils/contentStore';

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState([]);

  useEffect(() => {
    setInstructors(getInstructors());
  }, []);

  return (
    <main id="main-content" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Instructors</h1>
      <p className="mt-2 text-gray-600">Faculty profiles with practical mentorship across programs and events.</p>
      <div className="mt-6 grid md:grid-cols-2 gap-4">
        {instructors.map((ins) => (
          <article key={ins.id || ins.name} className="dashboard-surface p-5 flex gap-4 items-start">
            <img
              src={ins.image || '/img/other.jpg'}
              alt={ins.name}
              className="w-20 h-20 rounded-xl object-cover border border-gray-200"
              onError={(event) => {
                event.currentTarget.src = '/img/other.jpg';
              }}
            />
            <div>
            <h2 className="text-xl font-bold text-gray-900">{ins.name}</h2>
            <p className="mt-1 text-sm text-indigo-900 font-semibold">{ins.dept}</p>
            <p className="mt-2 text-sm text-gray-600">{ins.expertise}</p>
            <p className="mt-3 text-sm text-gray-700">Rating: <span className="font-semibold text-gray-900">{ins.rating}/5</span></p>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
