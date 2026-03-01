const items = [
  { q: 'Can CampusHub manage workshops and events?', a: 'Yes. Programs, workshops, and event workflows are supported.' },
  { q: 'Can students register and track event participation?', a: 'Yes. Students can register, check in, and view their registrations.' },
  { q: 'Can faculty manage attendance and reports?', a: 'Yes. Faculty can manage participants and export reports.' },
  { q: 'Does it support mobile devices?', a: 'Yes. The platform is responsive across phones, tablets, and desktops.' },
];

export default function FaqPage() {
  return (
    <main id="main-content" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Frequently Asked Questions</h1>
      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <article key={item.q} className="dashboard-surface p-5">
            <h2 className="text-lg font-semibold text-gray-900">{item.q}</h2>
            <p className="mt-2 text-sm text-gray-600">{item.a}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
