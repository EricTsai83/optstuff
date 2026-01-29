export function HeroBackground() {
  return (
    <>
      {/* Dark Mode - Green grid pattern */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="pointer-events-none absolute inset-0 hidden h-full w-full dark:block"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern
            id="smallGrid-dark"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <rect width="1" height="1" className="fill-emerald-300/45" />
          </pattern>

          <pattern
            id="largeGrid-dark"
            width="80"
            height="80"
            patternUnits="userSpaceOnUse"
          >
            <rect width="80" height="80" fill="url(#smallGrid-dark)" />
            <rect width="2" height="2" className="fill-emerald-300/65" />
          </pattern>

          <radialGradient id="fadeGradient-dark" cx="50%" cy="0%" r="70%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>

          <mask id="fadeMask-dark">
            <rect width="100%" height="100%" fill="url(#fadeGradient-dark)" />
          </mask>

          <radialGradient id="glowGradient-dark" cx="50%" cy="17%" r="50%">
            <stop offset="0%" stopColor="#6ee7b7" stopOpacity="0.15">
              <animate
                attributeName="stop-color"
                values="#4ade80;#86efac;#4ade80"
                dur="4s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        <rect width="100%" height="100%" fill="url(#glowGradient-dark)" />
        <rect
          width="100%"
          height="100%"
          fill="url(#largeGrid-dark)"
          mask="url(#fadeMask-dark)"
        />

        <pattern
          id="scanlines-dark"
          width="4"
          height="4"
          patternUnits="userSpaceOnUse"
        >
          <line
            x1="0"
            y1="0"
            x2="4"
            y2="0"
            stroke="#6ee7b7"
            strokeOpacity="0.1"
            strokeWidth="1"
          />
        </pattern>
        <rect
          width="100%"
          height="100%"
          fill="url(#scanlines-dark)"
          mask="url(#fadeMask-dark)"
        />
      </svg>

      {/* Light Mode - Minimalist image theme */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="pointer-events-none absolute inset-0 block h-full w-full dark:hidden"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id="glow-light" cx="50%" cy="0%" r="60%">
            <stop offset="0%" stopColor="#059669" stopOpacity="0.15">
              <animate
                attributeName="stop-color"
                values="#059669;#10b981;#059669"
                dur="4s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Soft glow */}
        <rect width="100%" height="100%" fill="url(#glow-light)" />
      </svg>
    </>
  );
}
