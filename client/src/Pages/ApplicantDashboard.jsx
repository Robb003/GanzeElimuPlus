
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/useAuth';

import ApplicantSidebar from '../Components/Applicant/ApplicantSidebar';
import ApplicantHeader from '../Components/Applicant/ApplicantHeader';
import StatCard from '../Components/Applicant/StatCard';
import ApplicationProgress from '../Components/Applicant/ApplicationProgress';
import RecentNotifications from '../Components/Applicant/RecentNotifications';
import ApplicationForm from '../Components/Applicant/ApplicationForm';
import ApplicationCountdown from '../Components/ApplicationCountdown';

import {
  getActiveBursaryCycle,
  getMyApplicationDetails,
} from '../Service/api';

export default function ApplicantDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [activePage, setActivePage] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Bursary cycle state
  const [activeCycle, setActiveCycle] = useState(null);
  const [cycleLoading, setCycleLoading] = useState(true);
  const [cycleError, setCycleError] = useState('');

  // Applicant application state
  const [application, setApplication] = useState(null);
  const [applicationLoading, setApplicationLoading] = useState(true);
  const [applicationError, setApplicationError] = useState('');

  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');

  const applicantName =
    storedUser?.profile?.fullName ||
    storedUser?.fullName ||
    'Applicant';

  const notifications = [];

  // Fetch application data without directly updating React state
  const fetchMyApplication = useCallback(async () => {
    try {
      const response = await getMyApplicationDetails();

      const responseData = response?.data ?? response;

      const applicationData =
        responseData?.application ??
        responseData?.data?.application ??
        responseData?.data ??
        null;

      return {
        application: applicationData?.application ?? applicationData,
        error: '',
      };
    } catch (error) {
      if (error.response?.status === 404) {
        return {
          application: null,
          error: '',
        };
      }

      console.error('Error fetching applicant application:', error);

      return {
        application: null,
        error:
          error.response?.data?.message ||
          'Unable to retrieve your application information.',
      };
    }
  }, []);

  // Load application when the dashboard first opens
  useEffect(() => {
    let cancelled = false;

    const loadApplication = async () => {
      const result = await fetchMyApplication();

      if (!cancelled) {
        setApplication(result.application);
        setApplicationError(result.error);
        setApplicationLoading(false);
      }
    };

    loadApplication();

    return () => {
      cancelled = true;
    };
  }, [fetchMyApplication]);

  // Refresh application when requested
  const refreshMyApplication = useCallback(async () => {
    const result = await fetchMyApplication();

    setApplication(result.application);
    setApplicationError(result.error);
    setApplicationLoading(false);
  }, [fetchMyApplication]);

  // Refresh application when user returns to the browser tab
  useEffect(() => {
    const handleWindowFocus = () => {
      setApplicationLoading(true);
      setApplicationError('');
      refreshMyApplication();
    };

    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [refreshMyApplication]);

  // Fetch the active bursary cycle
  useEffect(() => {
    let cancelled = false;

    async function fetchActiveCycle() {
      try {
        setCycleLoading(true);
        setCycleError('');

        const response = await getActiveBursaryCycle();

        if (!cancelled) {
          setActiveCycle(response?.data ?? response ?? null);
        }
      } catch (error) {
        if (!cancelled) {
          setCycleError(
            error.response?.data?.message ||
            'Unable to load bursary cycle information. Please try again.'
          );
        }
      } finally {
        if (!cancelled) {
          setCycleLoading(false);
        }
      }
    }

    fetchActiveCycle();

    return () => {
      cancelled = true;
    };
  }, []);

  // Read the actual status returned by getMyApplication.
  // The backend returns application.status, not awardDetails.status.
  const backendStatus = application?.status || 'not_started';

  const normalizedBackendStatus = String(backendStatus)
    .trim()
    .toLowerCase()
    .replaceAll('_', '-')
    .replaceAll(' ', '-');

  // Dashboard status labels and descriptions
  const statusConfiguration = {
    pending: {
      label: 'Submitted',
      progress: 'submitted',
      description:
        'Your application has been received and is awaiting document verification.',
    },

    submitted: {
      label: 'Submitted',
      progress: 'submitted',
      description:
        'Your application has been successfully submitted.',
    },

    verified: {
      label: 'Verified',
      progress: 'verified',
      description:
        'Your application documents have been verified and are awaiting board review.',
    },

    'board-approved': {
      label: 'Board Approved',
      progress: 'board-approved',
      description:
        'The board has approved your bursary award. Payment is pending.',
    },

    approved: {
      label: 'Approved',
      progress: 'board-approved',
      description:
        'Your bursary application has been approved.',
    },

    disbursed: {
      label: 'Disbursed',
      progress: 'disbursed',
      description:
        'Your bursary payment has been processed.',
    },

    completed: {
      label: 'Disbursed',
      progress: 'disbursed',
      description:
        'Your bursary payment has been completed.',
    },

    rejected: {
      label: 'Rejected',
      progress: 'rejected',
      description:
        'Your application was rejected. Please check the feedback provided.',
    },
  };

  const currentStatus = statusConfiguration[normalizedBackendStatus] || {
    label: application ? 'Submitted' : 'Not Started',
    progress: application ? 'submitted' : 'not_started',
    description: application
      ? 'Your application has been received.'
      : 'You have not submitted an application yet.',
  };

  const applicationStatus = currentStatus.progress;

  const pageTitles = {
    overview: {
      title: 'Applicant Dashboard',
      subtitle: 'Your bursary application at a glance.',
    },

    application: {
      title: 'My Application',
      subtitle: 'View and manage your bursary application.',
    },

    notifications: {
      title: 'Notifications',
      subtitle: 'Stay updated on your bursary application.',
    },
  };

  const currentPage = pageTitles[activePage] || pageTitles.overview;

  function formatDate(date) {
    if (!date) return 'Not provided';

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return 'Invalid date';
    }

    return parsed.toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Africa/Nairobi',
    });
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function handleNavigation(page) {
    setActivePage(page);
    setSidebarOpen(false);

    if (page === 'overview') {
      setApplicationLoading(true);
      setApplicationError('');
      refreshMyApplication();
    }
  }

  function renderCycleCard() {
    if (cycleLoading) {
      return (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-500">
            Loading bursary cycle information...
          </p>
        </section>
      );
    }

    if (cycleError) {
      return (
        <section
          className="rounded-2xl border border-red-200 bg-white p-6"
          role="alert"
        >
          <h2 className="font-bold text-slate-900">
            Bursary Cycle
          </h2>

          <p className="mt-2 text-sm text-red-600">
            {cycleError}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-900"
          >
            Try Again
          </button>
        </section>
      );
    }

    if (!activeCycle) {
      return (
        <section className="rounded-2xl border border-amber-200 bg-white p-6">
          <h2 className="font-bold text-slate-900">
            Bursary Cycle
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            No active bursary cycle is currently configured.
            Please check again later.
          </p>
        </section>
      );
    }

    const isOpen = activeCycle.applicationWindowOpen === true;

    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Current Bursary Cycle
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
              {activeCycle.cycleName}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Check the application dates before starting your application.
            </p>
          </div>

          <span
            className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-sm font-semibold ${
              isOpen
                ? 'bg-green-100 text-green-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {isOpen ? 'Applications Open' : 'Applications Closed'}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">
              Opening Date
            </p>

            <p className="mt-1 font-semibold text-slate-900">
              {formatDate(activeCycle.openingDate)}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">
              Closing Date
            </p>

            <p className="mt-1 font-semibold text-slate-900">
              {formatDate(activeCycle.closingDate)}
            </p>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-slate-600">
          {isOpen
            ? 'The application window is open. You can proceed to the application section to begin.'
            : 'The application window is not currently open. Please check the dates and wait for the next application period if necessary.'}
        </p>

        {isOpen && !application && (
          <button
            type="button"
            onClick={() => handleNavigation('application')}
            className="mt-5 w-full rounded-xl bg-green-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-900 sm:w-auto"
          >
            Go to My Application
          </button>
        )}
      </section>
    );
  }

  function renderContent() {
    switch (activePage) {
      case 'application':
        return (
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-bold text-slate-900">
              My Application
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Complete the application form and upload the required documents.
            </p>

            <div className="mt-6">
              <ApplicationForm />
            </div>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <p className="mb-3 text-sm text-slate-600">
                Already submitted your application?
              </p>

              <button
                type="button"
                onClick={() => navigate('/my-application')}
                className="rounded-xl bg-green-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-900"
              >
                View Submitted Application
              </button>
            </div>
          </section>
        );

      case 'notifications':
        return (
          <RecentNotifications
            notifications={notifications}
            onViewAll={() => {}}
          />
        );

      default:
        return (
          <>
            <section>
              <h2 className="text-xl font-bold text-slate-900">
                Welcome, {applicantName}
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Manage your bursary application from one place.
              </p>
            </section>

            {renderCycleCard()}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <StatCard
                title="Application Status"
                value={
                  applicationLoading
                    ? 'Loading...'
                    : currentStatus.label
                }
                description={
                  applicationLoading
                    ? 'Retrieving your application information.'
                    : applicationError || currentStatus.description
                }
                icon="▤"
                accent="green"
              />

              <StatCard
                title="Notifications"
                value={notifications.length}
                description="Notifications currently available in this demo."
                icon="♧"
                accent="blue"
              />
            </div>

            {applicationError && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4"
              >
                <p className="text-sm text-red-700">
                  {applicationError}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setApplicationLoading(true);
                    setApplicationError('');
                    refreshMyApplication();
                  }}
                  className="mt-2 text-sm font-semibold text-red-800 underline"
                >
                  Try again
                </button>
              </div>
            )}

            {applicationLoading ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">
                  Loading application progress...
                </p>
              </section>
            ) : (
              <ApplicationProgress status={applicationStatus} />
            )}

            <RecentNotifications
              notifications={notifications}
              onViewAll={() => handleNavigation('notifications')}
            />

            <div className="mt-5">
              <ApplicationCountdown />
            </div>
          </>
        );
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <ApplicantSidebar
        activePage={activePage}
        onNavigate={handleNavigation}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <div className="min-w-0 flex-1">
        <ApplicantHeader
          title={currentPage.title}
          subtitle={currentPage.subtitle}
          applicantName={applicantName}
          onMenuClick={() => setSidebarOpen(true)}
          onNotificationsClick={() => handleNavigation('notifications')}
          notificationCount={notifications.length}
        />

        <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
