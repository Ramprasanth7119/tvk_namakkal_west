"use client";

interface AnalyticsEmptyStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export default function AnalyticsEmptyState({
  title = "தகவல்கள் தற்போது கிடைக்கவில்லை",
  message = "நேரடி தரவைப் பெற முடியவில்லை. இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.",
  onRetry,
  retryLabel = "மீண்டும் முயற்சிக்கவும்",
}: AnalyticsEmptyStateProps) {
  return (
    <div className="analytics-empty-state" role="alert">
      <div className="analytics-empty-icon" aria-hidden="true">
        <svg viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2" opacity="0.25" />
          <path
            d="M32 20v18M32 44h.02"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <h3>{title}</h3>
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="analytics-empty-retry" onClick={onRetry}>
          {retryLabel}
        </button>
      )}
    </div>
  );
}
