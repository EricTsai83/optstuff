"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { X } from "lucide-react";
import { useState } from "react";

type DomainListInputProps = {
  readonly value: string[];
  readonly onChange: (domains: string[]) => void;
  readonly placeholder?: string;
  readonly disabled?: boolean;
};

/**
 * Input component for managing a list of domains.
 * Supports adding domains by pressing Enter or clicking Add button.
 * Displays domains as removable badges.
 */
export function DomainListInput({
  value,
  onChange,
  placeholder = "example.com",
  disabled = false,
}: DomainListInputProps) {
  const [inputValue, setInputValue] = useState("");

  const addDomain = () => {
    const domain = inputValue.trim().toLowerCase();
    if (!domain) return;

    // Basic domain validation
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/.test(domain)) {
      return;
    }

    // Don't add duplicates
    if (value.includes(domain)) {
      setInputValue("");
      return;
    }

    onChange([...value, domain]);
    setInputValue("");
  };

  const removeDomain = (domainToRemove: string) => {
    onChange(value.filter((d) => d !== domainToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addDomain();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={addDomain}
          disabled={disabled || !inputValue.trim()}
        >
          Add
        </Button>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((domain) => (
            <Badge
              key={domain}
              variant="secondary"
              className="gap-1 py-1 pr-1 font-mono text-xs"
            >
              {domain}
              <button
                type="button"
                onClick={() => removeDomain(domain)}
                disabled={disabled}
                className="hover:bg-muted ml-1 rounded p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {value.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No domains configured. All domains will be allowed.
        </p>
      )}
    </div>
  );
}
