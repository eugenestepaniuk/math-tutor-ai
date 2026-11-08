import { useId } from "react";

export function Brand() {
  const gradientId = useId();

  return (
    <span className="brand">
      <svg className="brand-mark" width="40" height="32" viewBox="0 0 40 32" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="2" y1="26" x2="38" y2="6" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--brand-blue)" />
            <stop offset="1" stopColor="var(--brand-violet)" />
          </linearGradient>
        </defs>
        <path d="M5 25 14 8l7 14L32 6l3 19" stroke={`url(#${gradientId})`} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="brand-wordmark">MathTutor <span>AI</span></span>
    </span>
  );
}
