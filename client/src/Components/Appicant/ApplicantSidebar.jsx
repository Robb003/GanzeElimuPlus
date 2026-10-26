
import React from 'react';

const navigationItems = [
  { id: 'overview', label: 'Overview', icon: '⌂' },
  { id: 'application', label: 'My Application', icon: '▤' },
  { id: 'documents', label: 'Documents', icon: '▧' },
  { id: 'school', label: 'School Details', icon: '⌂' },
  { id: 'notifications', label: 'Notifications', icon: '♧' },
];

export default function ApplicantSidebar({
  activePage = 'overview',
  onNavigate,
  isOpen = false,
  onClose,
  onLogout,
}) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col
        border-r border-slate-200 bg-white transition-transform duration-300
        lg:sticky lg:top-0 lg:z-20 lg:h-screen lg:translate-x-0
        ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-green-800">
              Elimu<span className="text-amber-500">Plus</span>
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Applicant Portal
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
          <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Main Menu
          </p>

          {navigationItems.map((item) => {
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onNavigate?.(item.id);
                  onClose?.();
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-green-800 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-green-50 hover:text-green-800'
                }`}
              >
                <span className="w-6 text-lg" aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.label}</span>

                {isActive && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-amber-400" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Help and logout */}
        <div className="border-t border-slate-100 p-4">
          <div className="mb-4 rounded-xl bg-green-50 p-4">
            <p className="text-sm font-semibold text-green-900">
              Need assistance?
            </p>
            <p className="mt-1 text-xs leading-5 text-green-800">
              Contact your bursary office if you need help with your application.
            </p>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
          >
            <span aria-hidden="true">↪</span>
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
