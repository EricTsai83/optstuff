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
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setInputValue(e.target.value);
    if (error) setError(null);
  };

  const addDomain = (): void => {
    const domain = inputValue.trim().toLowerCase();
    if (!domain) return;

    // Domain validation:
    // - Optional wildcard prefix (*.)
    // - Must have at least one dot (e.g., example.com, not just "example")
    // - TLD must be at least 2 characters
    // - Each segment can contain letters, numbers, and hyphens (but not start/end with hyphen)
    const domainRegex = /^(\*\.)?[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

    if (!domainRegex.test(domain)) {
      setError("Invalid domain format. Use format like: example.com or *.example.com");
      return;
    }

    // Validate TLD is at least 2 characters
    const parts = domain.replace(/^\*\./, "").split(".");
    const tld = parts[parts.length - 1];
    if (!tld || tld.length < 2) {
      setError("Invalid TLD. Domain must end with a valid TLD (e.g., .com, .org, .io)");
      return;
    }

    // Don't add duplicates
    if (value.includes(domain)) {
      setError("This domain has already been added");
      setInputValue("");
      return;
    }

    onChange([...value, domain]);
    setInputValue("");
    setError(null);
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
      <div className="space-y-1">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={`flex-1 ${error ? "border-destructive" : ""}`}
            aria-invalid={!!error}
            aria-describedby={error ? "domain-error" : undefined}
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
        {error && (
          <p id="domain-error" className="text-destructive text-sm">
            {error}
          </p>
        )}
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

    </div>
  );
}
