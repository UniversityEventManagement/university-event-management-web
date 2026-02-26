import TimetableManager from '@/components/TimetableManager';

export default function TimetablePage() {
  return (
    <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Weekly Timetable
          </h1>
          <p className="mt-2 text-gray-600">
            Public schedule view. Updates are managed by Admin and Faculty in their dashboards.
          </p>
        </div>
        <div className="inline-flex px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700">
          Public View (Read Only)
        </div>
      </div>

      <div className="mt-6">
        <TimetableManager canEdit={false} />
      </div>
    </main>
  );
}
