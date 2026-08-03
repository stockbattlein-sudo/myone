import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  fullPage?: boolean;
}

/**
 * Standardized reusable error state component for all trader and admin pages.
 * Ensures clean, user-friendly error UI with retry action and no raw stack traces.
 */
export function ErrorState({
  title = 'Failed to load data',
  message = 'An unexpected error occurred while communicating with the server. Please try again.',
  onRetry,
  fullPage = false,
}: ErrorStateProps) {
  const content = (
    <div className="bg-[#1B1D24] border border-[#F87171]/20 rounded-2xl p-6 md:p-8 text-center max-w-md w-full mx-auto space-y-4 shadow-xl">
      <div className="w-12 h-12 rounded-full bg-[#F87171]/15 text-[#F87171] mx-auto flex items-center justify-center">
        <AlertCircle size={24} />
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-bold text-[#EEEFF3] tracking-tight">{title}</h3>
        <p className="text-xs text-[#9A9FAE] leading-relaxed">{message}</p>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#282A35] hover:bg-[#21232C] border border-[#2B2E39] text-xs font-semibold text-[#EEEFF3] transition-colors"
        >
          <RefreshCw size={14} className="text-[#9787FF]" />
          Try Again
        </button>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        {content}
      </div>
    );
  }

  return content;
}
