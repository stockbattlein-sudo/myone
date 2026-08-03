/**
 * Auth layout — centered card on dark background.
 * Used by /login, /signup, /verify-otp pages.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold">
            <span className="text-accent-green">Stock</span>
            <span className="text-text-primary">Battle</span>
          </h1>
          <p className="text-text-muted text-sm mt-1">
            AI-Native Prop Trading Evaluation
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-8 animate-pulse-glow">
          {children}
        </div>
      </div>
    </div>
  );
}
