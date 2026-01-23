"use client";

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group";
import { cn } from "@workspace/ui/lib/utils";
import { useLayoutEffect, useRef, useState } from "react";

type SlidingToggleGroupOption<TValue extends string> = {
  readonly value: TValue;
  readonly label: string;
};

type SlidingToggleGroupProps<TValue extends string> = {
  readonly value: TValue;
  readonly onValueChange: (value: TValue) => void;
  readonly options: readonly SlidingToggleGroupOption<TValue>[];
  readonly className?: string;
  readonly transitionDuration?: number;
};

/**
 * Toggle group with a sliding background indicator that smoothly moves
 * to highlight the selected option.
 */
export function SlidingToggleGroup<TValue extends string>({
  value,
  onValueChange,
  options,
  className,
  transitionDuration = 200,
}: SlidingToggleGroupProps<TValue>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Map<TValue, HTMLButtonElement | null>>(new Map());
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: 0,
    width: 0,
  });

  // Update indicator position when value changes
  useLayoutEffect(() => {
    const updateIndicator = (): void => {
      const container = containerRef.current;
      const activeButton = itemRefs.current?.get(value);
      if (!container || !activeButton) return;

      const containerRect = container.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();

      // Get actual border width from computed styles to align with Tailwind CSS
      const computedStyle = window.getComputedStyle(activeButton);
      const borderLeftWidth = parseFloat(computedStyle.borderLeftWidth) || 0;
      const borderRightWidth = parseFloat(computedStyle.borderRightWidth) || 0;

      setIndicatorStyle({
        left: buttonRect.left - containerRect.left + borderLeftWidth,
        width: buttonRect.width - borderLeftWidth - borderRightWidth,
      });
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [value]);

  const isFirst = (index: number): boolean => index === 0;
  const isLast = (index: number): boolean => index === options.length - 1;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(v) => {
          if (v) onValueChange(v as TValue);
        }}
        variant="outline"
        className="relative w-full"
      >
        {/* Sliding background indicator */}
        <div
          className={cn(
            "bg-accent/90 absolute rounded-md",
            "transition-[left,width,top,bottom] ease-out",
            indicatorStyle.width === 0 ? "opacity-0" : "opacity-100",
          )}
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
            top: 0,
            bottom: 0,
            transitionDuration: `${transitionDuration}ms`,
          }}
          aria-hidden="true"
        />
        {options.map((option, index) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            ref={(el) => {
              itemRefs.current.set(option.value, el);
            }}
            className={cn(
              "text-foreground hover:text-foreground relative z-10 flex-1 cursor-pointer bg-transparent text-xs hover:bg-transparent data-[state=on]:bg-transparent sm:text-sm",
              isFirst(index) && "rounded-l-md! border-r-0 border-l!",
              !isFirst(index) && !isLast(index) && "border-r-0",
              isLast(index) && "rounded-r-md",
            )}
          >
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
