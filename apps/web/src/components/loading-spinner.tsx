/**
 * Animated loading spinner with StockBattle branding.
 */
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = {
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-[3px]',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`
          ${sizeMap[size]}
          rounded-full
          border-border-default
          border-t-accent-green
          animate-spin
        `}
      />
    </div>
  );
}
