"use client";

import { DOCS_LINKS } from "@/lib/constants";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Key } from "lucide-react";

export function ApiKeyListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          API Keys
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-muted h-24 animate-pulse rounded-lg" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function EmptyApiKeyState() {
  return (
    <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
      <Key className="mb-4 h-12 w-12 opacity-40" />
      <p className="text-lg font-medium">No API keys yet</p>
      <p className="mt-2 max-w-sm text-sm">
        API keys authenticate your image optimization requests. Each key
        includes a public key (for URLs) and a secret key (for signing).
      </p>
      <a
        href={DOCS_LINKS.keyManagement}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 text-sm font-medium text-blue-600 underline underline-offset-4 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
      >
        Learn more about API keys
      </a>
    </div>
  );
}
