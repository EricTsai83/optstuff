export function HeroBackground() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="pointer-events-none absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        {/* 主要網格 */}
        <pattern
          id="smallGrid"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <rect
            width="1"
            height="1"
            className="fill-emerald-500/10 dark:fill-emerald-400/20"
          />
        </pattern>

        <pattern
          id="largeGrid"
          width="80"
          height="80"
          patternUnits="userSpaceOnUse"
        >
          <rect width="80" height="80" fill="url(#smallGrid)" />
          <rect
            width="2"
            height="2"
            className="fill-emerald-500/20 dark:fill-emerald-400/30"
          />
        </pattern>

        {/* 漸層遮罩 */}
        <radialGradient id="fadeGradient" cx="50%" cy="0%" r="70%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>

        <mask id="fadeMask">
          <rect width="100%" height="100%" fill="url(#fadeGradient)" />
        </mask>

        {/* 發光效果 */}
        <radialGradient id="glowGradient" cx="50%" cy="17%" r="50%">
          <stop
            offset="0%"
            className="[stop-color:var(--color-emerald-500)]/15 dark:[stop-color:var(--color-emerald-400)]/10"
          />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      {/* 背景發光 */}
      <rect width="100%" height="100%" fill="url(#glowGradient)" />

      {/* 網格層 */}
      <rect
        width="100%"
        height="100%"
        fill="url(#largeGrid)"
        mask="url(#fadeMask)"
      />

      {/* 細微的掃描線效果 */}
      <pattern
        id="scanlines"
        width="4"
        height="4"
        patternUnits="userSpaceOnUse"
      >
        <line
          x1="0"
          y1="0"
          x2="4"
          y2="0"
          className="stroke-emerald-500/3 dark:stroke-emerald-400/5"
          strokeWidth="1"
        />
      </pattern>
      <rect
        width="100%"
        height="100%"
        fill="url(#scanlines)"
        mask="url(#fadeMask)"
      />
    </svg>
  );
}
