
import { useEffect, useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

export default function DocumentViewer({
  documentName = 'Select a document',
  documentUrl = '',
  loading = false,
  onRetry,
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [documentUrl]);

  const handleOpenInNewTab = () => {
    if (!documentUrl) return;

    window.open(documentUrl, '_blank', 'noopener,noreferrer');
  };

  const handleRetry = () => {
    setHasError(false);
    onRetry?.();
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      {/* Viewer header */}
      <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900">
            Document preview
          </h2>

          <p className="mt-1 truncate text-sm text-slate-500">
            {documentName}
          </p>
        </div>

        {documentUrl && !loading && !hasError && (
          <button
            type="button"
            onClick={handleOpenInNewTab}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Open in new tab
          </button>
        )}
      </div>

      {/* PDF preview */}
      <div className="min-h-[450px] bg-slate-50">

        {loading ? (
          <LoadingSpinner message="Loading document..." />

        ) : !documentUrl ? (
          <div className="flex min-h-[450px] flex-col items-center justify-center px-6 text-center">
            <h3 className="text-sm font-semibold text-slate-800">
              No document selected
            </h3>

            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Select a document from the checklist to preview it here.
            </p>
          </div>

        ) : hasError ? (
          <div className="flex min-h-[450px] flex-col items-center justify-center px-6 text-center">
            <h3 className="text-sm font-semibold text-red-700">
              Unable to display document
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Your browser could not display this PDF. You can try again or open the document in a new tab.
            </p>

            {onRetry && (
              <button
                type="button"
                onClick={handleRetry}
                className="mt-4 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
              >
                Try again
              </button>
            )}
          </div>

        ) : (
          <iframe
            key={documentUrl}
            src={documentUrl}
            title={`${documentName} PDF preview`}
            aria-label={`Preview of ${documentName}`}
            className="h-[600px] w-full border-0 sm:h-[700px]"
            onError={() => setHasError(true)}
          />
        )}
      </div>
    </section>
  );
}
