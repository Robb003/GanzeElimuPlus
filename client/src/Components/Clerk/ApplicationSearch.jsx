
import { useState } from 'react';

export default function ApplicationSearch({
  onSearch,
  loading = false,
}) {
  const [applicationNumber, setApplicationNumber] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();

    const searchValue = applicationNumber.trim();

    if (!searchValue) {
      setError('Please enter an application number.');
      return;
    }

    setError('');

    if (onSearch) {
      onSearch(searchValue);
    }
  };

  const handleChange = (event) => {
    setApplicationNumber(event.target.value);

    if (error) {
      setError('');
    }
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

      {/* Search heading */}
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-900 sm:text-lg">
          Find an application
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Search for an applicant using their application number.
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-3 sm:flex-row">

          {/* Input field */}
          <div className="relative flex-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>

            <input
              type="text"
              value={applicationNumber}
              onChange={handleChange}
              placeholder="Enter application number"
              disabled={loading}
              aria-label="Application number"
              aria-invalid={Boolean(error)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-green-700 focus:bg-white focus:ring-2 focus:ring-green-100 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {/* Search button */}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />

                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>

                Searching...
              </>
            ) : (
              'Search'
            )}
          </button>
        </div>

        {/* Validation error */}
        {error && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </form>

    </div>
  );
}
