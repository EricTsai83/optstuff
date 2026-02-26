"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { X } from "lucide-react";
import { useState } from "react";

type DomainListInputProps = {
  readonly id?: string;
  readonly value: string[];
  readonly onChange: (domains: string[]) => void;
  readonly placeholder?: string;
  readonly disabled?: boolean;
};

const PROTOCOL_REGEX = /^(https?):\/\//;
const DOMAIN_REGEX =
  /^(\*\.)?[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;
const VALID_FORMAT_MSG =
  'Include protocol, e.g. "https://example.com", "https://*.example.com", or "http://localhost"';

/**
 * Input component for managing a list of allowed referer origins.
 * Requires protocol (http:// or https://) for explicit security intent.
 * Supports adding entries by pressing Enter or clicking Add button.
 * Displays entries as removable badges.
 */
export function DomainListInput({
  id,
  value,
  onChange,
  placeholder = "https://example.com",
  disabled = false,
}: DomainListInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setInputValue(e.target.value);
    if (error) setError(null);
  };

  const addDomain = (): void => {
    const raw = inputValue.trim().toLowerCase();
    if (!raw) return;

    const protocolMatch = PROTOCOL_REGEX.exec(raw);
    if (!protocolMatch) {
      setError(VALID_FORMAT_MSG);
      return;
    }

    const hostPart = raw.slice(protocolMatch[0].length);
    if (!hostPart) {
      setError(VALID_FORMAT_MSG);
      return;
    }

    const isLocalhost = hostPart === "localhost";

    if (!isLocalhost) {
      if (!DOMAIN_REGEX.test(hostPart)) {
        setError(VALID_FORMAT_MSG);
        return;
      }

      const parts = hostPart.replace(/^\*\./, "").split(".");
      const tld = parts[parts.length - 1];
      if (!tld || tld.length < 2) {
        setError(
          "Invalid TLD. Domain must end with a valid TLD (e.g., .com, .org, .io)",
        );
        return;
      }
    }

    const domain = raw;

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
            id={id}
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
