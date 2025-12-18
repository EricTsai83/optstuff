export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <LogoIcon />
      <OptStuff />
    </div>
  );
}

const LogoIcon = () => {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[conic-gradient(from_225deg,#84cc16,#22c55e,#10b981,#0d9488,#10b981,#22c55e,#84cc16)]">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        className="text-white"
        aria-hidden="true"
      >
        {/* Outer frame - image border */}
        <rect
          x="1"
          y="1"
          width="22"
          height="22"
          rx="6"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        {/* Top-left arrow */}
        <path
          d="M6 10 L6 6 L10 6"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Bottom-right arrow */}
        <path
          d="M18 14 L18 18 L14 18"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Center square - compressed result */}
        <rect x="9" y="9" width="6" height="6" rx="2.5" fill="currentColor" />
      </svg>
    </div>
  );
};

const OptStuff = () => {
  return <span className="text-lg font-semibold tracking-tight">OptStuff</span>;
};
