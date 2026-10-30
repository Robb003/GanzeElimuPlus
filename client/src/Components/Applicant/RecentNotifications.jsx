
import React from 'react';

export default function RecentNotifications({
  notifications = [],
  onViewAll,
}) {
  const getNotificationStyle = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-amber-100 text-amber-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'warning':
        return '!';
      case 'error':
        return '×';
      default:
        return 'i';
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Recent Notifications
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Updates about your bursary application.
          </p>
        </div>

        <button
          type="button"
          onClick={onViewAll}
          className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-green-800 hover:bg-green-50"
        >
          View all
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="mt-6 rounded-xl bg-slate-50 px-4 py-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500">
            ♧
          </div>

          <p className="mt-3 text-sm font-semibold text-slate-800">
            No notifications yet
          </p>

          <p className="mt-1 text-sm leading-5 text-slate-500">
            Important application updates will appear here.
          </p>
        </div>
      ) : (
        <ul className="mt-5 divide-y divide-slate-100">
          {notifications.slice(0, 5).map((notification) => (
            <li
              key={notification.id}
              className="flex gap-3 py-4 first:pt-0 last:pb-0"
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${getNotificationStyle(
                  notification.type
                )}`}
                aria-hidden="true"
              >
                {getNotificationIcon(notification.type)}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800">
                  {notification.title}
                </p>

                <p className="mt-1 break-words text-sm leading-5 text-slate-600">
                  {notification.message}
                </p>

                {notification.date && (
                  <p className="mt-2 text-xs text-slate-400">
                    {notification.date}
                  </p>
                )}
              </div>

              {!notification.read && (
                <span
                  className="mt-2 h-2 w-2 shrink-0 rounded-full bg-green-600"
                  aria-label="Unread notification"
                  title="Unread"
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
