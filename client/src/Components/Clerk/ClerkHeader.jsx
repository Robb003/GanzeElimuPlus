
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/useAuth';

export default function ClerkHeader({
  title = 'Clerk Dashboard',
  subtitle = 'Review bursary applications and verify supporting documents.',
  clerkName = 'Clerk',
  onMenuClick,
  onNotificationsClick,
  notificationCount = 0,
}) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const displayName = clerkName?.trim() || 'Clerk';
  const initial = displayName.charAt(0).toUpperCase();

  // Log out the clerk and return to login.
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex min-h-20 items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">

        {/* Page title */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
            className="rounded-xl border border-slate-200 p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-slate-900 sm:text-2xl">
              {title}
            </h1>

            <p className="mt-1 hidden text-sm text-slate-500 sm:block">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Clerk actions */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">

          {/* Notifications */}
          <button
            type="button"
            onClick={onNotificationsClick}
            aria-label={`Notifications, ${notificationCount} unread`}
            className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-green-50 hover:text-green-800"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
              <path d="M10 21h4" />
            </svg>

            {notificationCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-xs font-bold text-white">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          <div className="hidden h-10 w-px bg-slate-200 sm:block" />

          {/* Clerk profile */}
          <div className="hidden items-center gap-2 sm:flex sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 font-bold text-green-800">
              {initial}
            </div>

            <div>
              <p className="max-w-36 truncate text-sm font-semibold text-slate-800">
                {displayName}
              </p>

              <p className="text-xs text-slate-500">
                Document Verification Clerk
              </p>
            </div>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            aria-label="Log out"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>

            <span>Logout</span>
          </button>

        </div>
      </div>
    </header>
  );
}
