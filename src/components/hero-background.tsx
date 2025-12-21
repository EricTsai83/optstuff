export function HeroBackground() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="pointer-events-none absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        {/* 主要網格 - light mode 用更低透明度 */}
        <pattern
          id="smallGrid"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <rect
            width="1"
            height="1"
            className="fill-emerald-600/5 dark:fill-emerald-400/20"
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
            className="fill-emerald-600/10 dark:fill-emerald-400/30"
          />
        </pattern>

        {/* 漸層遮罩 - light mode 範圍更小更集中 */}
        <radialGradient id="fadeGradient" cx="50%" cy="0%" r="60%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="70%" stopColor="white" stopOpacity="0.3" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>

        <mask id="fadeMask">
          <rect width="100%" height="100%" fill="url(#fadeGradient)" />
        </mask>

        {/* 發光效果 - light mode 大幅降低 */}
        <radialGradient id="glowGradient" cx="50%" cy="10%" r="40%">
          <stop
            offset="0%"
            className="[stop-color:theme(colors.emerald.400)] [stop-opacity:0.08] dark:[stop-color:theme(colors.emerald.400)] dark:[stop-opacity:0.15]"
          />
          <stop
            offset="100%"
            className="[stop-color:transparent] [stop-opacity:0]"
          />
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

      {/* 細微的掃描線效果 - light mode 幾乎不可見 */}
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
          className="stroke-emerald-600/[0.02] dark:stroke-emerald-400/5"
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
