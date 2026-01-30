"use client";

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
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function EmptyApiKeyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
      <Key className="mb-4 h-12 w-12 opacity-40" />
      <p className="text-lg font-medium">No API keys yet</p>
      <p className="mt-2 max-w-sm text-sm">
        Create an API key to start using the image optimization service.
      </p>
    </div>
  );
}
