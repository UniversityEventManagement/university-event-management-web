import { Link } from 'react-router-dom';
import { CalendarDays, GraduationCap, Layers, Users } from 'lucide-react';

const highlights = [
  { icon: CalendarDays, title: 'Event Operations', text: 'Plan seminars, festivals, workshops, and registrations in one place.' },
  { icon: GraduationCap, title: 'Learning Paths', text: 'Publish modules, lessons, and quizzes with progress tracking.' },
  { icon: Users, title: 'Faculty + Student Hub', text: 'Connect course delivery with event participation and points.' },
  { icon: Layers, title: 'Role-Based Panels', text: 'Dedicated experiences for admin, faculty, and students.' },
];

export default function HomePage() {
  return (
    <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <section className="grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <p className="inline-flex px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-indigo-100 text-indigo-900">CampusHub Platform</p>
          <h1 className="mt-4 text-4xl sm:text-5xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            One Campus Platform for Learning and Events
          </h1>
          <p className="mt-5 text-lg text-gray-600">
            Run classes, workshops, competitions, and student engagement programs with unified operations and analytics.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/learning" className="px-5 py-3 rounded-xl bg-indigo-900 text-white font-semibold hover:bg-indigo-800 transition-colors">
              Explore Learning Center
            </Link>
            <Link to="/programs" className="px-5 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors">
              View Programs
            </Link>
          </div>
        </div>
        <div className="dashboard-surface p-6 sm:p-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="stat-card">
              <p className="text-sm text-gray-500">Active Learners</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">4,800+</p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-gray-500">Monthly Events</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">120+</p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-gray-500">Faculty Mentors</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">95</p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-gray-500">Completion Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">87%</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-14 grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {highlights.map(({ icon: Icon, title, text }) => (
          <article key={title} className="dashboard-surface p-5">
            <Icon className="w-7 h-7 text-indigo-900" />
            <h2 className="mt-3 text-lg font-bold text-gray-900">{title}</h2>
            <p className="mt-2 text-sm text-gray-600">{text}</p>
          </article>
        ))}
      </section>

      <section className="mt-14 dashboard-surface p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-gray-900">Student Testimonials</h2>
        <div className="mt-5 grid md:grid-cols-3 gap-4">
          {[
            'CampusHub made registrations and reminders effortless.',
            'Our faculty workshops now run with less coordination overhead.',
            'I track my events and learning progress in one dashboard.',
          ].map((item, index) => (
            <div key={index} className="rounded-xl border border-gray-100 bg-white p-4">
              <p className="text-gray-700 text-sm">{item}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
