
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ApplicantSidebar from '../components/applicant/ApplicantSidebar';
import ApplicantHeader from '../components/applicant/ApplicantHeader';
import StatCard from '../components/applicant/StatCard';
import ApplicationProgress from '../components/applicant/ApplicationProgress';
import RecentNotifications from '../components/applicant/RecentNotifications';

export default function ApplicantDashboard() {
  const navigate = useNavigate();

  const [activePage, setActivePage] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Temporary display data. We will replace this with backend data.
  const applicantName =
    JSON.parse(localStorage.getItem('user') || '{}')?.profile?.fullName ||
    JSON.parse(localStorage.getItem('user') || '{}')?.fullName ||
    'Applicant';

  const applicationStatus = 'not_started';

  const notifications = [];

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

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  function handleNavigation(page) {
    setActivePage(page);
    setSidebarOpen(false);
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
              Your application form will be added here as a reusable component.
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <StatCard
                title="Application Status"
                value="Not Started"
                description="Your application has not been loaded from the backend yet."
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
