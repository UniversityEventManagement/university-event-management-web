export default function AboutPage() {
  return (
    <main id="main-content" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="dashboard-surface p-6 sm:p-8">
        <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>About CampusHub</h1>
        <p className="mt-4 text-gray-600 leading-relaxed">
          CampusHub is built as a university event management system. Instead of fragmented tools for planning,
          registration, attendance, and reporting, departments can manage the full event lifecycle from one platform.
        </p>
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <div className="stat-card">
            <p className="text-sm text-gray-500">Mission</p>
            <p className="mt-2 font-semibold text-gray-900">Improve campus engagement with measurable outcomes.</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-gray-500">Vision</p>
            <p className="mt-2 font-semibold text-gray-900">Every university event delivered with clarity, speed, and measurable impact.</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-gray-500">Core Value</p>
            <p className="mt-2 font-semibold text-gray-900">Reliable workflows for students, faculty, and admins.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
