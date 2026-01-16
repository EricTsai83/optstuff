"use client";

/**
 * Scan card skeleton loading state
 * Single light source effect radiating from center
 */
export function ScanSkeleton() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-black/10">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        {/* Blur glow layer */}
        <div
          className="absolute top-1/2 left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: "rgba(255, 255, 255, 0.8)",
            filter: "blur(4px)",
            boxShadow: `
              0 0 8px rgba(255, 255, 255, 0.9),
              0 0 16px rgba(16, 185, 129, 0.8),
              0 0 24px rgba(16, 185, 129, 0.6)
            `,
          }}
        />
        {/* Center point */}
        <div
          className="h-1 w-1 rounded-full"
          style={{
            background: "rgba(255, 255, 255, 1)",
            filter: "blur(1px)",
            boxShadow: `
              0 0 6px rgba(255, 255, 255, 1),
              0 0 12px rgba(16, 185, 129, 0.9),
              0 0 18px rgba(16, 185, 129, 0.7)
            `,
          }}
        />
      </div>

      <div
        className="animate-light-shoot absolute inset-0"
        style={{
          background: `radial-gradient(
            circle at center,
            rgba(255, 255, 255, 0.9) 0%,
            rgba(134, 239, 172, 0.7) 5%,
            rgba(16, 185, 129, 0.6) 12%,
            rgba(16, 185, 129, 0.45) 20%,
            rgba(16, 185, 129, 0.3) 35%,
            rgba(16, 185, 129, 0.15) 50%,
            rgba(16, 185, 129, 0.05) 70%,
            transparent 90%
          )`,
          filter: "blur(30px)",
        }}
      />

      <div
        className="animate-light-shoot-slow absolute inset-0"
        style={{
          background: `radial-gradient(
            circle at center,
            rgba(255, 255, 255, 0.5) 0%,
            rgba(16, 185, 129, 0.4) 15%,
            rgba(16, 185, 129, 0.2) 35%,
            rgba(16, 185, 129, 0.1) 55%,
            transparent 80%
          )`,
          filter: "blur(40px)",
        }}
      />
    </div>
  );
}
