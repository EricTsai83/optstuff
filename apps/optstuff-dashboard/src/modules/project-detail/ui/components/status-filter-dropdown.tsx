"use client";

import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { useCallback } from "react";
import { STATUS_OPTIONS } from "../../lib/date-range-utils";

/** Props for {@link StatusFilterDropdown}. */
type StatusFilterDropdownProps = {
  /** The currently active status filter values. */
  readonly statusFilters: Set<string>;
  /** Callback when the filter set changes (toggling a status on/off). */
  readonly onStatusFiltersChange: (filters: Set<string>) => void;
};

/**
 * A dropdown menu with checkbox items for filtering request logs by status
 * (success, error, forbidden, rate-limited). At least one status must remain selected.
 */
export function StatusFilterDropdown({
  statusFilters,
  onStatusFiltersChange,
}: StatusFilterDropdownProps) {
  const allSelected = statusFilters.size === STATUS_OPTIONS.length;
  const label = allSelected
    ? "All Statuses"
    : `${statusFilters.size} Status${statusFilters.size > 1 ? "es" : ""}`;

  const handleToggle = useCallback(
    (status: string) => {
      const next = new Set(statusFilters);
      if (next.has(status)) {
        if (next.size > 1) next.delete(status);
      } else {
        next.add(status);
      }
      onStatusFiltersChange(next);
    },
    [statusFilters, onStatusFiltersChange],
  );

  return (
    <div className="ml-auto">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="h-9 gap-2 px-3 font-normal md:h-10 md:px-4"
          >
            <span className="text-sm">{label}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="md:min-w-[180px]">
          {STATUS_OPTIONS.map((status) => (
            <DropdownMenuCheckboxItem
              key={status.value}
              checked={statusFilters.has(status.value)}
              onCheckedChange={() => handleToggle(status.value)}
              className="md:py-2"
            >
              {status.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
