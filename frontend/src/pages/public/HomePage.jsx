import { Link } from 'react-router-dom';
import { CalendarDays, GraduationCap, Layers, Sparkles, Users } from 'lucide-react';

const highlights = [
  { icon: CalendarDays, title: 'Event Operations', text: 'Plan seminars, festivals, workshops, and registrations in one place.' },
  { icon: GraduationCap, title: 'Learning Paths', text: 'Publish modules, lessons, and quizzes with progress tracking.' },
  { icon: Users, title: 'Faculty + Student Hub', text: 'Connect course delivery with event participation and points.' },
  { icon: Layers, title: 'Role-Based Panels', text: 'Dedicated experiences for admin, faculty, and students.' },
];

export default function HomePage() {
  return (
    <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <section className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-600 via-sky-600 to-fuchsia-600 p-8 sm:p-10 lg:p-14 text-white">
        <div className="absolute -top-24 -left-20 w-72 h-72 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute -bottom-20 -right-16 w-72 h-72 rounded-full bg-yellow-300/25 blur-3xl" />
        <div className="relative grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-white/20 border border-white/30">
              <Sparkles className="w-3.5 h-3.5" />
              CampusHub Platform
            </p>
            <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Build a Vibrant Learning Campus
            </h1>
            <p className="mt-5 text-base sm:text-lg text-indigo-50 max-w-xl">
              Blend classes, AI programs, faculty mentorship, and event operations in one high-engagement platform.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/learning" className="px-5 py-3 rounded-xl bg-white text-indigo-700 font-semibold hover:bg-indigo-50 transition-colors">
                Explore Learning Center
              </Link>
              <Link to="/programs" className="px-5 py-3 rounded-xl bg-indigo-900/40 border border-white/30 text-white font-semibold hover:bg-indigo-900/60 transition-colors">
                View Programs
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-2xl min-h-44 bg-cover bg-center border border-white/25"
              style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=80)' }}
            />
            <div
              className="rounded-2xl min-h-44 bg-cover bg-center border border-white/25"
              style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80)' }}
            />
            <div
              className="rounded-2xl min-h-44 bg-cover bg-center border border-white/25"
              style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80)' }}
            />
            <div className="rounded-2xl bg-white/15 border border-white/25 p-4 flex flex-col justify-center">
              <p className="text-sm uppercase tracking-wide text-indigo-100">Live Impact</p>
              <p className="text-3xl font-bold mt-1">120+</p>
              <p className="text-sm text-indigo-100 mt-1">Events monthly</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10 grid md:grid-cols-2 xl:grid-cols-4 gap-4">
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
      </section>

      <section className="mt-10 grid md:grid-cols-2 xl:grid-cols-4 gap-4">
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

      <section className="mt-10 grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
          <h3 className="text-2xl font-bold text-gray-900">Campus Visual Board</h3>
          <p className="mt-2 text-gray-600">Highlight upcoming festivals, innovation sprints, and AI showcases.</p>
          <div className="mt-5 grid sm:grid-cols-3 gap-3">
            {[
              'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=900&q=80',
              'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=900&q=80',
              'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=900&q=80',
            ].map((img, i) => (
              <div key={i} className="h-32 rounded-xl bg-cover bg-center" style={{ backgroundImage: `url(${img})` }} />
            ))}
          </div>
        </div>
        <div className="dashboard-surface p-5">
          <h3 className="text-lg font-bold text-gray-900">Quick Access</h3>
          <div className="mt-4 space-y-2">
            <Link to="/timetable" className="block px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium">Open Timetable</Link>
            <Link to="/instructors" className="block px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium">Meet Instructors</Link>
            <Link to="/contact" className="block px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium">Book a Demo</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
