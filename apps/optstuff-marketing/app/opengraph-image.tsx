import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background:
          "radial-gradient(circle at 20% 20%, #0f172a 0%, #020617 55%, #000000 100%)",
        color: "white",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          gap: 24,
          padding: "24px 36px",
        }}
      >
        <div
          style={{
            alignItems: "center",
            background:
              "linear-gradient(135deg, #84cc16 0%, #22c55e 35%, #10b981 70%, #0d9488 100%)",
            borderRadius: 22,
            display: "flex",
            height: 88,
            justifyContent: "center",
            width: 88,
          }}
        >
          <svg
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <rect
              x="1"
              y="1"
              width="22"
              height="22"
              rx="6"
              stroke="white"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M6 10 L6 6 L10 6"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M18 14 L18 18 L14 18"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect x="9" y="9" width="6" height="6" rx="2.5" fill="white" />
          </svg>
        </div>

        <div
          style={{
            color: "#ffffff",
            display: "flex",
            fontSize: 92,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1,
          }}
        >
          OptStuff
        </div>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
