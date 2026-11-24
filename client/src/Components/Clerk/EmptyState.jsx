
export default function EmptySearch({
  applicationNumber = '',
  onClearSearch,
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
      {/* Search icon */}
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-slate-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.7}
        >
          <circle cx="11" cy="11" r="7" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m16 16 4 4"
          />
        </svg>
      </div>

      {/* Message */}
      <h3 className="text-lg font-semibold text-slate-900">
        No application found
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {applicationNumber ? (
          <>
            We could not find an application with the number{' '}
            <span className="font-semibold text-slate-700">
              {applicationNumber}
            </span>
            . Please check the number and try again.
          </>
        ) : (
          'We could not find a matching application. Please try searching again.'
        )}
      </p>

      {/* Try again button */}
      {onClearSearch && (
        <button
          type="button"
          onClick={onClearSearch}
          className="mt-6 rounded-lg bg-green-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
        >
          Try another search
        </button>
      )}
    </div>
  );
}
