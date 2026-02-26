export default function ContactPage() {
  return (
    <main id="main-content" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="dashboard-surface p-6 sm:p-8">
        <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Contact</h1>
        <p className="mt-2 text-gray-600">Need onboarding, migration, or institutional setup support?</p>
        <form className="mt-6 grid gap-4">
          <input className="w-full px-4 py-3 rounded-xl border border-gray-200" placeholder="Name" />
          <input className="w-full px-4 py-3 rounded-xl border border-gray-200" placeholder="Email" />
          <input className="w-full px-4 py-3 rounded-xl border border-gray-200" placeholder="Institution" />
          <textarea className="w-full px-4 py-3 rounded-xl border border-gray-200 min-h-32" placeholder="Message" />
          <button type="button" className="w-full sm:w-auto px-5 py-3 rounded-xl bg-indigo-900 text-white font-semibold">
            Send Inquiry
          </button>
        </form>
      </div>
    </main>
  );
}
