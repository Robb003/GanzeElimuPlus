
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import  {getMyApplicationDetails}  from '../Service/api';

const MyApplicationDetails = () => {
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Retrieve the applicant's submitted application
  useEffect(() => {
    const fetchApplicationDetails = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await getMyApplicationDetails();

        setApplication(response.application);
      } catch (err) {
        setError(
          err.response?.data?.message ||
          'Unable to retrieve your application details.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchApplicationDetails();
  }, []);

  // Format dates
  const formatDate = (date) => {
    if (!date) return 'Not available';

    return new Date(date).toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Format document file sizes
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Size unavailable';

    if (bytes < 1024) return `${bytes} Bytes`;

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Convert stored values into readable labels
  const formatLabel = (value) => {
    if (!value) return 'Not provided';

    return value
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  // Application status styling
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Submitted':
        return 'bg-blue-100 text-blue-700';

      case 'Verified':
        return 'bg-green-100 text-green-700';

      case 'Board-Approved':
        return 'bg-emerald-100 text-emerald-700';

      case 'Disbursed':
        return 'bg-purple-100 text-purple-700';

      case 'Rejected':
        return 'bg-red-100 text-red-700';

      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Friendly status description
  const getStatusLabel = (status) => {
    if (status === 'Submitted') return 'Pending Review';

    if (status === 'Board-Approved') return 'Board Approved';

    return status || 'Unknown';
  };

  // Document labels
  const documentLabels = {
    chiefLetter: "Chief's Letter",
    feeStructure: 'School Fee Structure',
    reportCard: 'Latest Report Card',
    parentIDOrDeathCertificate: "Parent's ID / Death Certificate",
    studentIDOrBirthCert: "Student ID / Birth Certificate",
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-green-700 border-t-transparent"></div>

          <p className="mt-4 text-sm font-medium text-gray-600">
            Loading your application details...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-sm border border-gray-100">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 text-2xl">
            !
          </div>

          <h2 className="mt-4 text-xl font-bold text-gray-900">
            Application Details Unavailable
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            {error}
          </p>

          <button
            onClick={() => navigate('/applicant-dashboard')}
            className="mt-6 rounded-lg bg-green-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-800"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!application) return null;

  const education = application.educationDetails || {};
  const vulnerability = application.vulnerabilityMetrics || {};
  const documents = application.documents || {};

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-5xl">

        {/* Page Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/applicant-dashboard')}
            className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-900"
          >
            <span aria-hidden="true">←</span>
            Back to Dashboard
          </button>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-green-700">
              Ganze's Future
            </p>

            <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
              My Application Details
            </h1>

            <p className="mt-2 text-sm text-gray-600 sm:text-base">
              Review the information and supporting documents you submitted
              for your bursary application.
            </p>
          </div>
        </div>

        {/* Application Overview */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

            <div>
              <p className="text-sm font-medium text-gray-500">
                Application Reference
              </p>

              <h2 className="mt-1 break-all text-xl font-bold tracking-wide text-gray-900">
                {application.applicationNumber}
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Submitted on {formatDate(application.submittedAt)}
              </p>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-gray-500">
                Current Status
              </p>

              <span
                className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${getStatusStyle(application.status)}`}
              >
                {getStatusLabel(application.status)}
              </span>
            </div>

          </div>

          <div className="mt-6 border-t border-gray-100 pt-5">
            <p className="text-sm leading-6 text-gray-600">
              Keep your application reference number for future enquiries.
              You can return to this page to check your application details.
            </p>
          </div>

        </div>

        {/* Education Details */}
        <section className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-100 px-5 py-5 sm:px-7">
            <h2 className="text-lg font-bold text-gray-900">
              Education Details
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              School and academic information provided in your application.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-2 sm:p-7">

            <DetailItem
              label="School Name"
              value={education.schoolName}
            />

            <DetailItem
              label="Student Category"
              value={education.studentCategory}
            />

            <DetailItem
              label="Admission Number"
              value={education.admissionNumber}
            />

            <DetailItem
              label="Outstanding School Fees"
              value={
                education.outstandingFees !== undefined
                  ? `KES ${Number(education.outstandingFees).toLocaleString('en-KE')}`
                  : 'Not provided'
              }
            />

          </div>
        </section>

        {/* Family and Vulnerability Details */}
        <section className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-100 px-5 py-5 sm:px-7">
            <h2 className="text-lg font-bold text-gray-900">
              Family and Vulnerability Information
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Personal circumstances provided for bursary consideration.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-2 sm:p-7">

            <DetailItem
              label="Family Status"
              value={formatLabel(vulnerability.familyStatus)}
            />

            <DetailItem
              label="Household Income Bracket"
              value={formatLabel(vulnerability.householdIncomeBracket)}
            />

            <DetailItem
              label="Parent with Disability"
              value={
                vulnerability.disabledParents === undefined
                  ? 'Not provided'
                  : vulnerability.disabledParents ? 'Yes' : 'No'
              }
            />

            <DetailItem
              label="Chronic Illness in Family"
              value={
                vulnerability.chronicIllnessInFamily === undefined
                  ? 'Not provided'
                  : vulnerability.chronicIllnessInFamily ? 'Yes' : 'No'
              }
            />

            <DetailItem
              label="Siblings in School"
              value={
                vulnerability.siblingsInSchool !== undefined
                  ? vulnerability.siblingsInSchool
                  : 'Not provided'
              }
            />

          </div>
        </section>

        {/* Supporting Documents */}
        <section className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-100 px-5 py-5 sm:px-7">
            <h2 className="text-lg font-bold text-gray-900">
              Supporting Documents
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Documents uploaded with your bursary application.
            </p>
          </div>

          <div className="divide-y divide-gray-100">

            {Object.entries(documentLabels).map(([key, label]) => {
              const document = documents[key];

              return (
                <div
                  key={key}
                  className="flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7"
                >
                  <div className="flex min-w-0 items-start gap-3">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-700">
                      <span className="text-lg">📄</span>
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {label}
                      </h3>

                      {document ? (
                        <>
                          <p className="mt-1 break-all text-sm text-gray-600">
                            {document.originalName || 'Uploaded document'}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            {document.format?.toUpperCase() || 'FILE'} ·{' '}
                            {formatFileSize(document.bytes)}
                          </p>
                        </>
                      ) : (
                        <p className="mt-1 text-sm text-gray-500">
                          No document information available
                        </p>
                      )}
                    </div>

                  </div>

                  <div className="sm:shrink-0">
                    {document ? (
                      <span className="inline-flex rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                        Uploaded
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">
                        Not Available
                      </span>
                    )}
                  </div>

                </div>
              );
            })}

          </div>
        </section>

        {/* Footer Information */}
        <div className="mb-8 rounded-xl border border-blue-100 bg-blue-50 p-5">

          <div className="flex items-start gap-3">
            <span className="text-xl">ℹ️</span>

            <div>
              <h3 className="text-sm font-bold text-blue-900">
                Important Information
              </h3>

              <p className="mt-1 text-sm leading-6 text-blue-800">
                This page displays the information submitted with your
                application. It does not allow changes to your application
                or supporting documents. For assistance, contact the
                relevant bursary office.
              </p>
            </div>
          </div>

        </div>

        <div className="flex justify-center pb-6">
          <button
            onClick={() => navigate('/applicant-dashboard')}
            className="w-full rounded-lg bg-green-700 px-8 py-3 font-semibold text-white transition hover:bg-green-800 sm:w-auto"
          >
            Return to Dashboard
          </button>
        </div>

      </div>
    </div>
  );
};

// Reusable detail item
const DetailItem = ({ label, value }) => (
  <div>
    <p className="text-sm font-medium text-gray-500">
      {label}
    </p>

    <p className="mt-1 break-words text-sm font-semibold text-gray-900">
      {value !== undefined && value !== null && value !== ''
        ? value
        : 'Not provided'}
    </p>
  </div>
);

export default MyApplicationDetails;
