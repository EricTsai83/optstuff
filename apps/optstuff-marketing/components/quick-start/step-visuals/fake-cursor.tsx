import { cn } from "@workspace/ui/lib/utils";

/** Classic mouse pointer SVG */
export function FakeCursor({
  isClicking,
  className,
}: {
  readonly isClicking: boolean;
  readonly className?: string;
}) {
  return (
    <svg
      viewBox="0 0 14 18"
      fill="none"
      className={cn(
        "h-3.5 w-3 drop-shadow-md transition-transform duration-100 sm:h-[18px] sm:w-[14px]",
        isClicking && "scale-75",
        className,
      )}
    >
      <path
        d="M1 1L1 13L3.8 10.2L6.4 16L8.2 15L5.6 9.2L10 9.2L1 1Z"
        fill="white"
        stroke="black"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
