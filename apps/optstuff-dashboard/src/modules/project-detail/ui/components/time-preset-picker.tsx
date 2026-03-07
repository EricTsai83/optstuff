"use client";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { Separator } from "@workspace/ui/components/separator";
import { cn } from "@workspace/ui/lib/utils";
import { ChevronDown, Clock } from "lucide-react";
import { TIME_PRESETS } from "../../lib/date-range-utils";

const RELATIVE_HINTS = [
  "45m",
  "12 hours",
  "10d",
  "2 weeks",
  "last month",
  "yesterday",
  "today",
] as const;

const FIXED_HINTS = ["Jan 1", "Jan 1 - Jan 2", "1/1", "1/1 - 1/2"] as const;

/** Props for {@link TimePresetPicker}. */
type TimePresetPickerProps = {
  /** Currently active preset value (e.g. `"7"`, `"30"`, or `"custom"`). */
  readonly preset: string;
  /** Whether the popover is open. */
  readonly open: boolean;
  /** Callback when the popover open state changes. */
  readonly onOpenChange: (open: boolean) => void;
  /** Current value of the free-text time input. */
  readonly timeInput: string;
  /** Callback when the free-text input value changes. */
  readonly onTimeInputChange: (value: string) => void;
  /** Keyboard handler for the free-text input (handles Enter to apply). */
  readonly onTimeInputKeyDown: (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => void;
  /** Callback when a preset button is clicked. */
  readonly onPresetChange: (value: string) => void;
  /** Callback when a hint chip or free-text value is applied. */
  readonly onTimeInputApply: (hint: string) => void;
};

/**
 * A popover that lets users select a date range via preset buttons
 * (e.g. "Last 7 Days") or free-form text input (e.g. `"10d"`, `"last week"`).
 *
 * The left panel shows preset options; the right panel provides a text input
 * with hint chips for both relative and fixed time expressions.
 */
export function TimePresetPicker({
  preset,
  open,
  onOpenChange,
  timeInput,
  onTimeInputChange,
  onTimeInputKeyDown,
  onPresetChange,
  onTimeInputApply,
}: TimePresetPickerProps) {
  const presetLabel =
    preset === "custom"
      ? "Custom"
      : (TIME_PRESETS.find((p) => p.value === preset)?.label ?? "Last 30 Days");

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-9 gap-2 px-3 md:h-10 md:px-4"
        >
          <Clock className="h-4 w-4 shrink-0 opacity-50" />
          <span className="text-sm">{presetLabel}</span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 opacity-50 transition-transform",
              open && "rotate-180",
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          <div className="border-r p-1 md:p-1.5">
            {TIME_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                className={cn(
                  "hover:bg-accent hover:text-accent-foreground flex w-full items-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm outline-none transition-colors md:px-4 md:py-2",
                  preset === p.value && "bg-accent font-medium",
                )}
                onClick={() => onPresetChange(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="w-[220px] space-y-3 p-3 md:w-[260px] md:space-y-4 md:p-4">
            <Input
              placeholder="e.g. 10d, last week..."
              value={timeInput}
              onChange={(e) => onTimeInputChange(e.target.value)}
              onKeyDown={onTimeInputKeyDown}
              className="h-8 text-sm md:h-9"
            />
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-medium md:text-sm">
                Type relative times
              </p>
              <div className="flex flex-wrap gap-1 md:gap-1.5">
                {RELATIVE_HINTS.map((hint) => (
                  <button
                    key={hint}
                    type="button"
                    className="bg-muted hover:bg-muted/70 rounded px-1.5 py-0.5 font-mono text-xs transition-colors md:px-2 md:py-1"
                    onClick={() => onTimeInputApply(hint)}
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-medium md:text-sm">
                Type fixed times
              </p>
              <div className="flex flex-wrap gap-1 md:gap-1.5">
                {FIXED_HINTS.map((hint) => (
                  <button
                    key={hint}
                    type="button"
                    className="bg-muted hover:bg-muted/70 rounded px-1.5 py-0.5 font-mono text-xs transition-colors md:px-2 md:py-1"
                    onClick={() => onTimeInputApply(hint)}
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
