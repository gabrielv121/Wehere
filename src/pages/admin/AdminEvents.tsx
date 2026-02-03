import { Link } from 'react-router-dom';
import { useEvents } from '../../context/EventsContext';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function AdminEvents() {
  const { events, setFeatured, setVisible, deleteEvent } = useEvents();

  function handleDelete(id: string, title: string) {
    if (window.confirm(`Delete "${title}"? This cannot be undone.`)) {
      deleteEvent(id);
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Events</h1>
          <p className="text-slate-500 text-sm">Add, edit, delete, and control featured & visibility</p>
        </div>
        <Link
          to="/admin/events/new"
          className="inline-flex px-4 py-2 rounded-lg bg-teal-500 text-white font-semibold hover:bg-teal-600 transition-colors"
        >
          + New event
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-5 py-3 font-medium text-slate-600">Event</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">Venue</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">Date</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">Category</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">Featured</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">Visible</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr
                  key={event.id}
                  className={`border-b border-slate-100 hover:bg-slate-50 ${event.visible === false ? 'bg-slate-50/50' : ''}`}
                >
                  <td className="px-5 py-3">
                    <Link
                      to={`/events/${event.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-slate-900 hover:text-teal-600"
                    >
                      {event.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{event.venue.name}</td>
                  <td className="px-5 py-3 text-slate-600">{formatDate(event.date)}</td>
                  <td className="px-5 py-3">
                    <span className="capitalize text-slate-600">{event.category}</span>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => setFeatured(event.id, !event.featured)}
                      className={`rounded-full text-xs font-medium px-2 py-0.5 ${
                        event.featured ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'
                      } hover:opacity-90`}
                    >
                      {event.featured ? 'Yes' : 'No'}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => setVisible(event.id, event.visible === false)}
                      className={`rounded-full text-xs font-medium px-2 py-0.5 ${
                        event.visible !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      } hover:opacity-90`}
                    >
                      {event.visible !== false ? 'Yes' : 'Hidden'}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <Link
                        to={`/admin/events/${event.id}/edit`}
                        className="text-teal-600 font-medium hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(event.id, event.title)}
                        className="text-red-600 font-medium hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {events.length === 0 && (
        <p className="text-slate-500 py-8 text-center">No events yet. Add one with “New event”.</p>
      )}
    </div>
  );
}
