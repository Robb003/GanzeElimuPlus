
import { useCallback, useEffect, useMemo, useState } from 'react';

import ClerkHeader from '../Components/Clerk/ClerkHeader';
import ApplicationReview from '../Components/Clerk/ApplicationReview';
import LoadingSpinner from '../Components/Clerk/LoadingSpinner';
import { getReviewQueue } from '../Service/api';
import { useAuth } from '../Context/useAuth';

export default function ClerkDashboard() {
  // Get the logged-in clerk's details.
  const { user } = useAuth();

  const clerkName =
    user?.fullName ||
    user?.profile?.fullName ||
    'Clerk';

  const [applications, setApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch applications awaiting document review.
  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await getReviewQueue();

      // Handle common Axios and API response structures.
      const payload = response?.data ?? response;

      const queue =
        payload?.applications ??
        payload?.data?.applications ??
        payload?.data ??
        payload;

      if (!Array.isArray(queue)) {
        throw new Error('Unexpected application queue response.');
      }

      setApplications(queue);
    } catch (err) {
      console.error('Failed to fetch review queue:', err);

      setError(
        err.response?.data?.message ||
        err.message ||
        'Unable to load applications. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Search by application number.
  const filteredApplications = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return applications;

    return applications.filter((application) =>
      application.applicationNumber
        ?.toLowerCase()
        .includes(query)
    );
  }, [applications, searchTerm]);

  // Open application review.
  const handleSelectApplication = (application) => {
    setSelectedApplication(application);
  };

  // Update the selected application after a successful clerk decision.
  const handleDecisionComplete = useCallback((response) => {
    const result = response?.data ?? response;

    setSelectedApplication((previous) => {
      if (!previous) return previous;

      return {
        ...previous,

        documentReviews:
          result?.documentReviews ??
          previous.documentReviews,

        awardDetails: {
          ...(previous.awardDetails || {}),
          status:
            result?.status ??
            previous.awardDetails?.status,
        },
      };
    });
  }, []);

  // Return to the queue and reload applications.
  const handleBackToQueue = () => {
    setSelectedApplication(null);
    fetchApplications();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <ClerkHeader clerkName={clerkName} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {selectedApplication ? (
          <div>
            <button
              type="button"
              onClick={handleBackToQueue}
              className="mb-6 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              <span aria-hidden="true">←</span>
              Back to applications
            </button>

            <ApplicationReview
              application={selectedApplication}
              onDecisionComplete={handleDecisionComplete}
            />
          </div>
        ) : (
          <>
            {/* Dashboard heading */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900">
                Welcome, {clerkName}
              </h1>

              <p className="mt-2 text-sm text-slate-600">
                Review submitted bursary applications and verify
                their supporting documents.
              </p>
            </div>

            {/* Review queue */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Application Review Queue
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Applications awaiting document verification.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fetchApplications}
                  disabled={loading}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Refreshing...' : 'Refresh queue'}
                </button>
              </div>

              {/* Search */}
              <div className="mb-6">
                <label
                  htmlFor="application-search"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Search by application number
                </label>

                <input
                  id="application-search"
                  type="search"
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                  placeholder="Enter application number..."
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-green-700 focus:ring-2 focus:ring-green-100"
                />
              </div>

              {/* Loading */}
              {loading ? (
                <div className="py-12">
                  <LoadingSpinner message="Loading applications..." />
                </div>

              ) : error ? (

                /* Error */
                <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center">
                  <p className="text-sm text-red-700">
                    {error}
                  </p>

                  <button
                    type="button"
                    onClick={fetchApplications}
                    className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-800"
                  >
                    Try again
                  </button>
                </div>

              ) : filteredApplications.length === 0 ? (

                /* Empty queue */
                <div className="rounded-xl border border-dashed border-slate-300 px-4 py-12 text-center">
                  <h3 className="font-semibold text-slate-800">
                    {searchTerm
                      ? 'No matching applications'
                      : 'No applications awaiting review'}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    {searchTerm
                      ? 'Check the application number and try again.'
                      : 'New applications will appear here when submitted.'}
                  </p>
                </div>

              ) : (

                /* Application table */
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                        <th className="px-4 py-3">
                          Application number
                        </th>

                        <th className="px-4 py-3">
                          Submitted
                        </th>

                        <th className="px-4 py-3">
                          Documents
                        </th>

                        <th className="px-4 py-3 text-right">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredApplications.map((application) => (
                        <tr
                          key={
                            application._id ||
                            application.applicationNumber
                          }
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                        >
                          <td className="px-4 py-4">
                            <span className="font-medium text-slate-900">
                              {application.applicationNumber ||
                                'Not available'}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-sm text-slate-600">
                            {application.createdAt &&
                            !Number.isNaN(
                              new Date(application.createdAt).getTime()
                            )
                              ? new Date(
                                  application.createdAt
                                ).toLocaleDateString()
                              : 'Not available'}
                          </td>

                          <td className="px-4 py-4 text-sm text-slate-600">
                            {application.documents
                              ? Object.keys(application.documents).length
                              : 0}{' '}
                            submitted
                          </td>

                          <td className="px-4 py-4 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                handleSelectApplication(application)
                              }
                              className="rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-900"
                            >
                              Review application
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Queue summary */}
              {!loading && !error && (
                <p className="mt-5 text-xs text-slate-500">
                  Showing {filteredApplications.length} of{' '}
                  {applications.length} applications
                </p>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
