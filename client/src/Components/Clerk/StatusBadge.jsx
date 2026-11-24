
const statusStyles = {
  Submitted: 'bg-blue-100 text-blue-800',
  Verified: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
  Approved: 'bg-emerald-100 text-emerald-800',
  Disbursed: 'bg-purple-100 text-purple-800',
  'Payment-Failed': 'bg-rose-100 text-rose-800',
  Pending: 'bg-amber-100 text-amber-800',
  'Under Review': 'bg-yellow-100 text-yellow-800',
};

export default function StatusBadge({
  status = 'Pending',
  className = '',
}) {
  const normalizedStatus = status?.trim() || 'Pending';

  const badgeStyle =
    statusStyles[normalizedStatus] || 'bg-slate-100 text-slate-700';

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badgeStyle} ${className}`}
    >
      {normalizedStatus.replaceAll('-', ' ')}
    </span>
  );
}
