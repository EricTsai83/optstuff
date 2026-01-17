"use client";

import { Label } from "@workspace/ui/components/label";

type InfoFieldProps = {
  readonly label: string;
  readonly value: React.ReactNode;
  readonly mono?: boolean;
};

export function InfoField({ label, value, mono }: InfoFieldProps) {
  return (
    <div>
      <Label className="text-muted-foreground">{label}</Label>
      <p className={`mt-1 ${mono ? "font-mono text-sm" : ""}`}>{value}</p>
    </div>
  );
}
