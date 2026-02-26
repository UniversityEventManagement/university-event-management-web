const programs = [
  { title: 'AI and Data Foundations', level: 'Beginner', dept: 'CSE', seats: 120, duration: '8 Weeks' },
  { title: 'Full Stack Engineering', level: 'Intermediate', dept: 'IT', seats: 80, duration: '10 Weeks' },
  { title: 'Cloud and DevOps Lab', level: 'Advanced', dept: 'ECE', seats: 60, duration: '6 Weeks' },
  { title: 'Communication and Leadership', level: 'All Levels', dept: 'MBA', seats: 200, duration: '4 Weeks' },
];

export default function ProgramsPage() {
  return (
    <main id="main-content" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Programs</h1>
      <p className="mt-2 text-gray-600">Course-style offerings mapped to real events and hands-on assessments.</p>
      <div className="mt-6 grid md:grid-cols-2 gap-4">
        {programs.map((program) => (
          <article key={program.title} className="dashboard-surface p-5">
            <h2 className="text-xl font-bold text-gray-900">{program.title}</h2>
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
