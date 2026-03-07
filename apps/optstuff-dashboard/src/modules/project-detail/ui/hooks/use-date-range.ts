"use client";

import { format } from "date-fns";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type DateRange,
  getDateRangeFromDays,
  parseTimeInput,
} from "../../lib/date-range-utils";

/**
 * Manages all date-range selection state for the Usage tab.
 *
 * Encapsulates preset selection, free-text time input parsing, calendar range
 * picking, and manual date/time input fields. Returns both the current
 * committed range (used for data queries) and all UI state/handlers needed by
 * {@link TimePresetPicker} and {@link DateRangeCalendarPicker}.
 *
 * @param initialDays - Number of days to select by default (defaults to `7`).
 */
export function useDateRange(initialDays = 7) {
  const [preset, setPreset] = useState(String(initialDays));
  const [presetOpen, setPresetOpen] = useState(false);
  const [timeInput, setTimeInput] = useState("");
  const [calendarRange, setCalendarRange] = useState<DateRange>(() =>
    getDateRangeFromDays(initialDays),
  );
  const [committedRange, setCommittedRange] = useState(() =>
    getDateRangeFromDays(initialDays),
  );
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [startDateInput, setStartDateInput] = useState(() =>
    format(committedRange.from, "MMM d, yyyy"),
  );
  const [startTimeInput, setStartTimeInput] = useState("00:00");
  const [endDateInput, setEndDateInput] = useState(() =>
    format(committedRange.to, "MMM d, yyyy"),
  );
  const [endTimeInput, setEndTimeInput] = useState("23:59");

  const days = useMemo(() => {
    return Math.max(
      1,
      Math.ceil(
        (committedRange.to.getTime() - committedRange.from.getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );
  }, [committedRange]);

  const computedDateRange = useMemo(() => {
    return {
      startDate: committedRange.from.toISOString().split("T")[0]!,
      endDate: committedRange.to.toISOString().split("T")[0]!,
    };
  }, [committedRange]);

  const commitRange = useCallback((from: Date, to: Date) => {
    setCommittedRange({ from, to });
    setCalendarRange({ from, to });
    setPreset("custom");
  }, []);

  const handlePresetChange = useCallback((value: string) => {
    setPreset(value);
    const numDays = Number(value);
    if (numDays) {
      const range = getDateRangeFromDays(numDays);
      setCalendarRange(range);
      setCommittedRange(range);
    }
    setTimeInput("");
    setPresetOpen(false);
  }, []);

  const handleTimeInputApply = useCallback((value: string) => {
    const parsed = parseTimeInput(value);
    if (parsed?.from && parsed.to) {
      setCalendarRange(parsed);
      setCommittedRange({ from: parsed.from, to: parsed.to });
      setPreset("custom");
      setTimeInput("");
      setPresetOpen(false);
    }
  }, []);

  const handleTimeInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleTimeInputApply(timeInput);
      }
    },
    [timeInput, handleTimeInputApply],
  );

  const handleDateRangeSelect = useCallback(
    (range: DateRange | undefined, triggerDate?: Date) => {
      if (calendarRange.from && calendarRange.to && triggerDate) {
        setCalendarRange({ from: triggerDate, to: undefined });
        return;
      }
      if (range) {
        setCalendarRange(range);
        if (range.from && range.to) {
          commitRange(range.from, range.to);
        }
      }
    },
    [calendarRange.from, calendarRange.to, commitRange],
  );

  const prevCommittedRef = useRef(committedRange);
  useEffect(() => {
    if (prevCommittedRef.current !== committedRange) {
      prevCommittedRef.current = committedRange;
      setStartDateInput(format(committedRange.from, "MMM d, yyyy"));
      setStartTimeInput(format(committedRange.from, "HH:mm"));
      setEndDateInput(format(committedRange.to, "MMM d, yyyy"));
      setEndTimeInput(format(committedRange.to, "HH:mm"));
    }
  }, [committedRange]);

  useEffect(() => {
    if (calendarRange.from) {
      setStartDateInput(format(calendarRange.from, "MMM d, yyyy"));
    }
    if (calendarRange.to) {
      setEndDateInput(format(calendarRange.to, "MMM d, yyyy"));
    }
  }, [calendarRange.from, calendarRange.to]);

  const handleManualApply = useCallback(() => {
    const parseManualDate = (dateStr: string, timeStr: string): Date | null => {
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return null;
      const [h, m] = timeStr.split(":").map(Number);
      if (h == null || m == null || Number.isNaN(h) || Number.isNaN(m))
        return null;
      d.setHours(h, m, 0, 0);
      return d;
    };

    const from = parseManualDate(startDateInput, startTimeInput);
    const to = parseManualDate(endDateInput, endTimeInput);
    if (from && to && from < to) {
      commitRange(from, to);
      setCalendarOpen(false);
    }
  }, [startDateInput, startTimeInput, endDateInput, endTimeInput, commitRange]);

  return {
    preset,
    presetOpen,
    setPresetOpen,
    timeInput,
    setTimeInput,
    calendarRange,
    committedRange,
    calendarOpen,
    setCalendarOpen,
    days,
    computedDateRange,
    startDateInput,
    setStartDateInput,
    startTimeInput,
    setStartTimeInput,
    endDateInput,
    setEndDateInput,
    endTimeInput,
    setEndTimeInput,
    handlePresetChange,
    handleTimeInputApply,
    handleTimeInputKeyDown,
    handleDateRangeSelect,
    handleManualApply,
  };
}
