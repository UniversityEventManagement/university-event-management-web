import { useEffect, useState } from 'react';
import { getPrograms } from '@/utils/contentStore';

export default function ProgramsPage() {
  const [programs, setPrograms] = useState([]);

  useEffect(() => {
    setPrograms(getPrograms());
  }, []);

  return (
    <main id="main-content" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Programs</h1>
      <p className="mt-2 text-gray-600">Course-style offerings mapped to real events and hands-on assessments.</p>
      <div className="mt-6 grid md:grid-cols-2 gap-4">
        {programs.map((program) => (
          <article key={program.title} className="dashboard-surface p-5">
            <div
              className="h-36 rounded-xl mb-4 bg-cover bg-center"
              style={{
                backgroundImage: `url(${program.image || '/img/other.jpg'})`,
              }}
            />
            <h2 className="text-xl font-bold text-gray-900">{program.title}</h2>
            {program.summary && <p className="mt-2 text-sm text-gray-600">{program.summary}</p>}
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-600">
              <p><span className="font-semibold text-gray-900">Level:</span> {program.level}</p>
              <p><span className="font-semibold text-gray-900">Department:</span> {program.dept}</p>
              <p><span className="font-semibold text-gray-900">Seats:</span> {program.seats}</p>
              <p><span className="font-semibold text-gray-900">Duration:</span> {program.duration}</p>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
