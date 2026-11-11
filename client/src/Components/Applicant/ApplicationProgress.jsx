

const stages = [
  { id: 'submitted', label: 'Application Submitted' },
  { id: 'verification', label: 'Document Verification' },
  { id: 'board', label: 'Board Review' },
  { id: 'decision', label: 'Final Decision' },
  { id: 'disbursement', label: 'Disbursement' },
];

const statusOrder = {
  not_started: -1,
  pending: 0,
  submitted: 0,

  verified: 2,
  'clerk-verified': 2,
  'documents-verified': 2,
  'ready-for-board': 2,
  'board-review': 2,
  'under-board-review': 2,

  'board-approved': 3,
  approved: 3,
  'final-approved': 3,

  completed: 4,
  disbursed: 4,
};

export default function ApplicationProgress({
  status = 'not_started',
}) {
  const normalizedStatus = String(status)
    .trim()
    .toLowerCase()
    .replaceAll('_', '-')
    .replaceAll(' ', '-');

  const currentOrder =
    statusOrder[normalizedStatus] ?? -1;

  const isRejected = normalizedStatus === 'rejected';

  const isNotStarted =
    normalizedStatus === 'not-started' ||
    currentOrder === -1;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900">
          Application Progress
        </h2>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          Follow the stages of your bursary application.
        </p>
      </div>

      {isNotStarted ? (
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="font-semibold text-slate-800">
            No application submitted yet
          </p>
        </div>
      ) : isRejected ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="font-semibold text-red-800">
            Application rejected
          </p>
          <p className="mt-1 text-sm text-red-700">
            Please check feedback from the bursary office.
          </p>
        </div>
      ) : (
        <ol className="space-y-5">
          {stages.map((stage, index) => {
            const isComplete = index < currentOrder;
            const isCurrent = index === currentOrder;

            return (
              <li key={stage.id} className="flex gap-3 sm:gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      isComplete
                        ? 'bg-green-700 text-white'
                        : isCurrent
                          ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-400'
                          : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isComplete ? '✓' : index + 1}
                  </div>

                  {index < stages.length - 1 && (
                    <div
                      className={`mt-2 min-h-6 w-0.5 flex-1 ${
                        isComplete
                          ? 'bg-green-700'
                          : 'bg-slate-200'
                      }`}
                    />
                  )}
                </div>

                <div className="pb-2 pt-1">
                  <p className={`text-sm font-semibold ${
                    isCurrent || isComplete
                      ? 'text-slate-900'
                      : 'text-slate-500'
                  }`}>
                    {stage.label}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {isComplete
                      ? 'Completed'
                      : isCurrent
                        ? 'Current stage'
                        : 'Awaiting previous stages'}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">
        Progress reflects the latest application status.
        Approval and payment are separate stages.
      </p>
    </section>
  );
}
