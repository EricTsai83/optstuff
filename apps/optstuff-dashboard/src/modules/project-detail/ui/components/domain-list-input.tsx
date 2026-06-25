"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { X } from "lucide-react";
import { useState } from "react";

type DomainListInputProps = {
  readonly id?: string;
  readonly kind: "source" | "referer";
  readonly value: string[];
  readonly onChange: (domains: string[]) => void;
  readonly placeholder?: string;
  readonly disabled?: boolean;
};

const PROTOCOL_REGEX = /^(https?):\/\//;
const DOMAIN_REGEX =
  /^(\*\.)?[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;
const SOURCE_FORMAT_MSG =
  'Use a public source origin, e.g. "https://images.example.com". Wildcards, localhost, paths, and private IPs are not allowed.';
const REFERER_FORMAT_MSG =
  'Include protocol, e.g. "https://example.com", "https://*.example.com", or "http://localhost:3000"';

function isPrivateIPv4(hostname: string): boolean {
  const parts = hostname.split(".");
  if (parts.length !== 4) return false;
  const octets = parts.map((part) => Number(part));
  if (
    octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)
  ) {
    return false;
  }

  const [a, b] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b !== undefined && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b !== undefined && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a !== undefined && a >= 224)
  );
}

function normalizeDomainInput(
  raw: string,
  kind: DomainListInputProps["kind"],
): { ok: true; value: string } | { ok: false; error: string } {
  const formatMessage =
    kind === "source" ? SOURCE_FORMAT_MSG : REFERER_FORMAT_MSG;
  const protocolMatch = PROTOCOL_REGEX.exec(raw);
  if (!protocolMatch) {
    return { ok: false, error: formatMessage };
  }

  const protocol = protocolMatch[0];
  let hostPart = raw.slice(protocol.length);
  if (
    !hostPart ||
    hostPart.includes("/") ||
    hostPart.includes("?") ||
    hostPart.includes("#") ||
    /\s/.test(hostPart)
  ) {
    return { ok: false, error: formatMessage };
  }

  const wildcard = hostPart.startsWith("*.");
  if (wildcard) {
    if (kind === "source") {
      return {
        ok: false,
        error:
          "Image source entries include subdomains automatically. Add the base domain instead.",
      };
    }
    hostPart = hostPart.slice(2);
  }

  let parsed: URL;
  try {
    parsed = new URL(`${protocol}${hostPart}`);
  } catch {
    return { ok: false, error: formatMessage };
  }

  const hostname = parsed.hostname
    .toLowerCase()
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .replace(/\.$/, "");
  const isLocalhost =
    hostname === "localhost" || hostname.endsWith(".localhost");

  if (kind === "source" && (isLocalhost || isPrivateIPv4(hostname))) {
    return {
      ok: false,
      error: "Image source must be a public hostname.",
    };
  }

  if (
    !isLocalhost &&
    !DOMAIN_REGEX.test(`${wildcard ? "*." : ""}${hostname}`)
  ) {
    return { ok: false, error: formatMessage };
  }

  const parts = hostname.replace(/^\*\./, "").split(".");
  const tld = parts[parts.length - 1];
  if (!isLocalhost && (!tld || tld.length < 2)) {
    return {
      ok: false,
      error:
        "Invalid TLD. Domain must end with a valid TLD (e.g., .com, .org, .io)",
    };
  }

  const port = parsed.port ? `:${parsed.port}` : "";
  return {
    ok: true,
    value: `${protocol}${wildcard ? "*." : ""}${hostname}${port}`,
  };
}

/**
 * Input component for managing a list of allowed referer origins.
 * Requires protocol (http:// or https://) for explicit security intent.
 * Supports adding entries by pressing Enter or clicking Add button.
 * Displays entries as removable badges.
 */
export function DomainListInput({
  id,
  kind,
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

    const parsed = normalizeDomainInput(raw, kind);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }

    const domain = parsed.value;

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
