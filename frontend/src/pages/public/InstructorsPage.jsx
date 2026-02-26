const instructors = [
  { name: 'Dr. Riya Sharma', dept: 'CSE', expertise: 'Machine Learning, NLP', rating: 4.9 },
  { name: 'Prof. Arjun Menon', dept: 'IT', expertise: 'Web Architecture, Security', rating: 4.8 },
  { name: 'Dr. Sana Khan', dept: 'ECE', expertise: 'Cloud Systems, IoT', rating: 4.7 },
  { name: 'Prof. Mehul Patel', dept: 'MBA', expertise: 'Leadership, Product Strategy', rating: 4.8 },
];

export default function InstructorsPage() {
  return (
    <main id="main-content" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Instructors</h1>
      <p className="mt-2 text-gray-600">Faculty profiles with practical mentorship across programs and events.</p>
      <div className="mt-6 grid md:grid-cols-2 gap-4">
        {instructors.map((ins) => (
          <article key={ins.name} className="dashboard-surface p-5">
            <h2 className="text-xl font-bold text-gray-900">{ins.name}</h2>
            <p className="mt-1 text-sm text-indigo-900 font-semibold">{ins.dept}</p>
            <p className="mt-2 text-sm text-gray-600">{ins.expertise}</p>
            <p className="mt-3 text-sm text-gray-700">Rating: <span className="font-semibold text-gray-900">{ins.rating}/5</span></p>
          </article>
        ))}
      </div>
    </main>
  );
}
