
export default function LoadingSpinner({
  message = 'Loading...',
  size = 'md',
  fullScreen = false,
}) {
  const sizeStyles = {
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-[3px]',
    lg: 'h-12 w-12 border-4',
  };

  const spinnerSize = sizeStyles[size] ?? sizeStyles.md;

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${
        fullScreen
          ? 'min-h-screen w-full'
          : 'w-full py-6'
      }`}
      role="status"
      aria-live="polite"
      aria-label={message || 'Loading'}
    >
      <div
        className={`${spinnerSize} animate-spin rounded-full border-green-100 border-t-green-700`}
        aria-hidden="true"
      />

      {message && (
        <p className="text-sm font-medium text-slate-600">
          {message}
        </p>
      )}

      <span className="sr-only">
        {message || 'Loading'}
      </span>
    </div>
  );
}
