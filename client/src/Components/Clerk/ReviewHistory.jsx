
import StatusBadge from './StatusBadge';

export default function ReviewHistory({
  history = [],
  loading = false,
}) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Review history
        </h2>

        <p className="mt-4 text-sm text-slate-500">
          Loading review history...
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">
          Review history
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Track previous verification decisions and review activities.
        </p>
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.7}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>

          <h3 className="text-sm font-semibold text-slate-800">
            No review history yet
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Review activities will appear here once an application has been reviewed.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {history.map((item, index) => (
            <div
              key={item._id || item.id || index}
              className="relative flex gap-4"
            >
              {/* Timeline indicator */}
              <div className="flex flex-col items-center">
                <span className="h-3 w-3 rounded-full bg-green-600 ring-4 ring-green-100" />

                {index !== history.length - 1 && (
                  <span className="mt-2 w-px flex-1 bg-slate-200" />
                )}
              </div>

              {/* Review details */}
              <div className="min-w-0 flex-1 pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    status={item.action || item.status || 'Pending'}
                  />

                  <span className="text-xs text-slate-500">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleString()
                      : 'Date unavailable'}
                  </span>
                </div>

                <p className="mt-2 text-sm font-medium text-slate-800">
                  {item.reviewerName || item.performedBy || 'Review activity'}
                </p>

                {item.notes && (
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {item.notes}
                  </p>
                )}

                {item.reason && (
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Reason: {item.reason}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
