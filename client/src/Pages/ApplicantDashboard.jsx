
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ApplicantSidebar from '../Components/Applicant/ApplicantSidebar';
import ApplicantHeader from '../Components/Applicant/ApplicantHeader';
import StatCard from '../Components/Applicant/StatCard';
import ApplicationProgress from '../Components/Applicant/ApplicationProgress';
import RecentNotifications from '../Components/Applicant/RecentNotifications';
import ApplicationForm from '../Components/Applicant/ApplicationForm';

import { getActiveBursaryCycle } from '../Service/api';
export default function ApplicantDashboard() {
  const navigate = useNavigate();

  const [activePage, setActivePage] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Bursary cycle state
  const [activeCycle, setActiveCycle] = useState(null);
  const [cycleLoading, setCycleLoading] = useState(true);
  const [cycleError, setCycleError] = useState('');

  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');

  const applicantName =
    storedUser?.profile?.fullName ||
    storedUser?.fullName ||
    'Applicant';

  // Temporary until the applications endpoint is connected
  const applicationStatus = 'not_started';
  const notifications = [];

  // Fetch the active bursary cycle from the backend
  useEffect(() => {
    let cancelled = false;

    async function fetchActiveCycle() {
      try {
        setCycleLoading(true);
        setCycleError('');

        const response = await getActiveBursaryCycle();

        if (!cancelled) {
          setActiveCycle(response?.data ?? null);
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

  const pageTitles = {
    overview: {
      title: 'Applicant Dashboard',
      subtitle: 'Your bursary application at a glance.',
    },
    application: {
      title: 'My Application',
      subtitle: 'View and manage your bursary application.',
    },
    documents: {
      title: 'My Documents',
      subtitle: 'Track your required supporting documents.',
    },
    school: {
      title: 'School Details',
      subtitle: 'Review your selected school information.',
    },
    notifications: {
      title: 'Notifications',
      subtitle: 'Stay updated on your bursary application.',
    },
  };

  const currentPage = pageTitles[activePage] || pageTitles.overview;

  function formatDate(date) {
    if (!date) return 'Not provided';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return 'Invalid date';
    }

    return parsedDate.toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Africa/Nairobi',
    });
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  function handleNavigation(page) {
    setActivePage(page);
    setSidebarOpen(false);
  }

  function renderCycleCard() {
    if (cycleLoading) {
      return (
        <section
          className="rounded-2xl border border-slate-200 bg-white p-6"
          aria-live="polite"
        >
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

        {isOpen && (
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
              {<ApplicationForm />}
            </p>
          </section>
        );

      case 'documents':
        return (
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-bold text-slate-900">
              Required Documents
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              We will add the five-document checklist and upload controls here.
            </p>
          </section>
        );

      case 'school':
        return (
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-bold text-slate-900">
              School Details
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Verified school selection and school information will appear here.
            </p>
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
                value="Not Started"
                description="Your application information has not yet been connected to the backend."
                icon="▤"
                accent="green"
              />

              <StatCard
                title="Required Documents"
                value="5"
                description="Five supporting documents are required for review."
                icon="▧"
                accent="amber"
              />

              <StatCard
                title="Notifications"
                value={notifications.length}
                description="Notifications currently available in this demo."
                icon="♧"
                accent="blue"
              />
            </div>

            <ApplicationProgress status={applicationStatus} />

            <RecentNotifications
              notifications={notifications}
              onViewAll={() => handleNavigation('notifications')}
            />
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
