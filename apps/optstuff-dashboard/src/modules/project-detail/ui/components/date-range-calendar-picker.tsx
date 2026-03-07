"use client";

import { Button } from "@workspace/ui/components/button";
import { Calendar } from "@workspace/ui/components/calendar";
import { Input } from "@workspace/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "../../lib/date-range-utils";

/** Props for {@link DateRangeCalendarPicker}. */
type DateRangeCalendarPickerProps = {
  /** Whether the calendar popover is open. */
  readonly open: boolean;
  /** Callback when the popover open state changes. */
  readonly onOpenChange: (open: boolean) => void;
  /** The currently committed (applied) date range shown on the trigger button. */
  readonly committedRange: { from: Date; to: Date };
  /** The in-progress calendar selection (may differ from committed while user is picking). */
  readonly calendarRange: DateRange;
  /** Callback when the user selects a date or range on the calendar. */
  readonly onDateRangeSelect: (
    range: DateRange | undefined,
    triggerDate?: Date,
  ) => void;
  /** Current value of the start-date text input. */
  readonly startDateInput: string;
  /** Callback when the start-date text input changes. */
  readonly onStartDateInputChange: (value: string) => void;
  /** Current value of the start-time text input (HH:mm). */
  readonly startTimeInput: string;
  /** Callback when the start-time text input changes. */
  readonly onStartTimeInputChange: (value: string) => void;
  /** Current value of the end-date text input. */
  readonly endDateInput: string;
  /** Callback when the end-date text input changes. */
  readonly onEndDateInputChange: (value: string) => void;
  /** Current value of the end-time text input (HH:mm). */
  readonly endTimeInput: string;
  /** Callback when the end-time text input changes. */
  readonly onEndTimeInputChange: (value: string) => void;
  /** Callback when the user clicks "Apply" to commit the manual date/time inputs. */
  readonly onManualApply: () => void;
};

/**
 * A popover containing a calendar for visual date-range selection, plus
 * manual start/end date and time text inputs with an "Apply" button.
 *
 * The trigger button displays the currently committed range (e.g. "Feb 27 – Mar 5").
 */
export function DateRangeCalendarPicker({
  open,
  onOpenChange,
  committedRange,
  calendarRange,
  onDateRangeSelect,
  startDateInput,
  onStartDateInputChange,
  startTimeInput,
  onStartTimeInputChange,
  endDateInput,
  onEndDateInputChange,
  endTimeInput,
  onEndTimeInputChange,
  onManualApply,
}: DateRangeCalendarPickerProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="md:order-0 order-last h-9 gap-2 px-3 font-normal md:h-10 md:px-4"
        >
          <CalendarIcon className="h-4 w-4 shrink-0 opacity-50" />
          <span className="text-sm">
            {format(committedRange.from, "MMM d")}
            {" – "}
            {format(committedRange.to, "MMM d")}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex w-60 flex-col justify-center sm:w-full sm:flex-row">
          <Calendar
            mode="range"
            selected={calendarRange}
            onSelect={onDateRangeSelect}
            numberOfMonths={1}
            disabled={{ after: new Date() }}
          />

          <div className="border-t px-3 pb-3">
            <div className="mt-3 space-y-2">
              <p className="text-muted-foreground text-xs font-medium">Start</p>
              <div className="flex gap-2">
                <Input
                  value={startDateInput}
                  onChange={(e) => onStartDateInputChange(e.target.value)}
                  className="h-8 flex-1 text-sm"
                  placeholder="Feb 27, 2026"
                />
                <Input
                  value={startTimeInput}
                  onChange={(e) => onStartTimeInputChange(e.target.value)}
                  className="h-8 w-[70px] text-sm"
                  placeholder="00:00"
                />
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <p className="text-muted-foreground text-xs font-medium">End</p>
              <div className="flex gap-2">
                <Input
                  value={endDateInput}
                  onChange={(e) => onEndDateInputChange(e.target.value)}
                  className="h-8 flex-1 text-sm"
                  placeholder="Mar 5, 2026"
                />
                <Input
                  value={endTimeInput}
                  onChange={(e) => onEndTimeInputChange(e.target.value)}
                  className="h-8 w-[70px] text-sm"
                  placeholder="23:59"
                />
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="mt-3 w-full text-sm"
              onClick={onManualApply}
            >
              Apply ↵
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
