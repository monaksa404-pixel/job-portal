export function StcLogo({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="STC">
      <rect width="80" height="32" rx="6" fill="#4F008C" />
      <text
        x="40"
        y="21"
        textAnchor="middle"
        fill="white"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="14"
        fontWeight="700"
        letterSpacing="1"
      >
        stc
      </text>
    </svg>
  );
}
