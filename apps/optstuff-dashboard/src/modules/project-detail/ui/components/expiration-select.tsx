"use client";

import { Button } from "@workspace/ui/components/button";
import { Calendar } from "@workspace/ui/components/calendar";
import { Label } from "@workspace/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { addDays, addYears, format, startOfDay } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";

type ExpirationSelectProps = {
  readonly value: Date | undefined;
  readonly onChange: (date: Date | undefined) => void;
  readonly disabled?: boolean;
  readonly label?: string;
};

const PRESET_OPTIONS = [
  { value: "7d", label: "7 days", days: 7 },
  { value: "30d", label: "30 days", days: 30 },
  { value: "90d", label: "90 days", days: 90 },
  { value: "1y", label: "1 year", days: 365 },
  { value: "never", label: "Never expires", days: null },
] as const;

type PresetValue = (typeof PRESET_OPTIONS)[number]["value"] | "custom";

/**
 * Calculate expiration date from today + days, normalized to end of day
 */
function calculateExpirationDate(days: number): Date {
  const date = addDays(startOfDay(new Date()), days);
  // Set to end of day (23:59:59.999)
  date.setHours(23, 59, 59, 999);
  return date;
}

/**
 * Get the minimum selectable date (tomorrow)
 */
function getMinDate(): Date {
  return startOfDay(addDays(new Date(), 1));
}

/**
 * Get the maximum selectable date (5 years from now)
 */
function getMaxDate(): Date {
  return addYears(new Date(), 5);
}

export function ExpirationSelect({
  value,
  onChange,
  disabled = false,
  label = "Expiration",
}: ExpirationSelectProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const handlePresetChange = (presetValue: PresetValue): void => {
    if (presetValue === "custom") return;

    const preset = PRESET_OPTIONS.find((p) => p.value === presetValue);
    if (!preset) return;

    if (preset.days === null) {
      onChange(undefined);
    } else {
      onChange(calculateExpirationDate(preset.days));
    }
  };

  const handleCalendarSelect = (date: Date | undefined): void => {
    if (date) {
      // Normalize to end of day for consistency
      const normalizedDate = new Date(date);
      normalizedDate.setHours(23, 59, 59, 999);

      onChange(normalizedDate);
      setCalendarOpen(false);
    }
  };

  // Determine the select value: "never" if no value, "custom" if has value
  const selectValue: PresetValue = value ? "custom" : "never";

  // Get label for display in SelectValue
  const getDisplayLabel = (): string => {
    if (!value) return "Never expires";
    return format(value, "MMM d, yyyy");
  };

  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Select
          value={selectValue}
          onValueChange={(val) => handlePresetChange(val as PresetValue)}
          disabled={disabled}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select expiration">
              {getDisplayLabel()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {PRESET_OPTIONS.map((preset) => (
              <SelectItem key={preset.value} value={preset.value}>
                {preset.label}
              </SelectItem>
            ))}
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>

        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={disabled}
              aria-label="Pick a custom date"
              title="Custom date"
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={value}
              onSelect={handleCalendarSelect}
              disabled={(date) => date < getMinDate() || date > getMaxDate()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {value && (
        <p className="text-muted-foreground text-xs">
          Expires on {format(value, "PPP")}
        </p>
      )}
    </div>
  );
}
