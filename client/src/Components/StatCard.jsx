
import React from 'react';

export default function StatCard({
  title,
  value,
  description,
  icon,
  accent = 'green',
}) {
  const accentStyles = {
    green: {
      iconBg: 'bg-green-100',
      iconText: 'text-green-800',
      border: 'border-l-green-700',
    },
    amber: {
      iconBg: 'bg-amber-100',
      iconText: 'text-amber-800',
      border: 'border-l-amber-500',
    },
    blue: {
      iconBg: 'bg-blue-100',
      iconText: 'text-blue-800',
      border: 'border-l-blue-600',
    },
    red: {
      iconBg: 'bg-red-100',
      iconText: 'text-red-800',
      border: 'border-l-red-600',
    },
  };

  const styles = accentStyles[accent] || accentStyles.green;

  return (
    <article
      className={`min-w-0 rounded-2xl border border-slate-200 border-l-4 ${styles.border} bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 break-words text-2xl font-bold text-slate-900 sm:text-3xl">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${styles.iconBg} ${styles.iconText}`}
          aria-hidden="true"
        >
          {icon || '•'}
        </div>
      </div>

      {description && (
        <p className="mt-4 text-xs leading-5 text-slate-500 sm:text-sm">
          {description}
        </p>
      )}
    </article>
  );
}
