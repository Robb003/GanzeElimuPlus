
const DOCUMENT_TYPES = [
  {
    type: 'chiefLetter',
    label: "Chief's Letter",
    description: "Letter confirming the applicant's circumstances",
  },
  {
    type: 'feeStructure',
    label: 'School Fee Structure',
    description: 'Official school fee structure',
  },
  {
    type: 'reportCard',
    label: 'Academic Report Card',
    description: 'Latest academic performance record',
  },
  {
    type: 'parentIDOrDeathCertificate',
    label: 'Parent ID / Death Certificate',
    description: 'Parent identification or death certificate',
  },
  {
    type: 'studentIDOrBirthCert',
    label: 'Student ID / Birth Certificate',
    description: 'Student identification document',
  },
];

const STATUS_STYLES = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Verified: 'bg-green-50 text-green-700 border-green-200',
  Rejected: 'bg-red-50 text-red-700 border-red-200',
  Missing: 'bg-slate-100 text-slate-500 border-slate-200',
};

export default function DocumentChecklist({
  documents = {},
  documentReviews = {},
  selectedDocument = '',
  onSelectDocument,
}) {
  // Determine submission using safe metadata.
  // Never depend on Cloudinary publicId in the frontend.
  const isDocumentSubmitted = (documentType) => {
    const document = documents?.[documentType];

    return Boolean(
      document &&
      typeof document === 'object' &&
      document.originalName
    );
  };

  // Determine the document's review status.
  const getDocumentStatus = (documentType) => {
    if (!isDocumentSubmitted(documentType)) {
      return 'Missing';
    }

    const review = documentReviews?.[documentType];

    if (typeof review === 'string') {
      return review;
    }

    return review?.status || 'Pending';
  };

  const getStatusStyle = (status) => {
    return (
      STATUS_STYLES[status] ||
      'bg-slate-100 text-slate-600 border-slate-200'
    );
  };

  const submittedCount = DOCUMENT_TYPES.filter(
    ({ type }) => isDocumentSubmitted(type)
  ).length;

  const verifiedCount = DOCUMENT_TYPES.filter(
    ({ type }) => getDocumentStatus(type) === 'Verified'
  ).length;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      {/* Header */}
      <div className="border-b border-slate-200 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Document checklist
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Review the applicant's submitted documents.
            </p>
          </div>

          <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
            {submittedCount}/5 submitted
          </span>
        </div>

        {/* Verification progress */}
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600">
              Verification progress
            </span>

            <span className="font-semibold text-slate-800">
              {verifiedCount}/5 verified
            </span>
          </div>

          <div
            className="h-2 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-label="Document verification progress"
            aria-valuemin={0}
            aria-valuemax={5}
            aria-valuenow={verifiedCount}
          >
            <div
              className="h-full rounded-full bg-green-600 transition-all duration-300"
              style={{
                width: `${(verifiedCount / 5) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Document list */}
      <div className="divide-y divide-slate-100">
        {DOCUMENT_TYPES.map((document, index) => {
          const status = getDocumentStatus(document.type);
          const isSelected = selectedDocument === document.type;
          const isSubmitted = isDocumentSubmitted(document.type);

          return (
            <button
              key={document.type}
              type="button"
              disabled={!isSubmitted}
              onClick={() => onSelectDocument?.(document.type)}
              aria-pressed={isSelected}
              className={`flex w-full items-center gap-3 p-4 text-left transition ${
                isSelected
                  ? 'bg-green-50 ring-1 ring-inset ring-green-200'
                  : isSubmitted
                    ? 'hover:bg-slate-50'
                    : 'cursor-not-allowed opacity-60'
              }`}
            >
              {/* Document icon */}
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  isSelected
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.7}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14 3v5h5M9 13h6m-6 4h6"
                  />
                </svg>
              </div>

              {/* Document details */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-slate-400">
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <h3 className="text-sm font-semibold text-slate-800">
                    {document.label}
                  </h3>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  {isSubmitted
                    ? document.description
                    : 'Document not submitted'}
                </p>
              </div>

              {/* Status */}
              <span
                className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusStyle(status)}`}
              >
                {status}
              </span>

              {/* Selection indicator */}
              {isSubmitted && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 shrink-0 ${
                    isSelected
                      ? 'text-green-700'
                      : 'text-slate-400'
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m9 18 6-6-6-6"
                  />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 bg-slate-50 px-5 py-3">
        <p className="text-xs text-slate-500">
          Select a submitted document to open its private PDF preview.
        </p>
      </div>
    </section>
  );
}
