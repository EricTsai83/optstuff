"use client";

import { api } from "@/trpc/react";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { CopyButton } from "@workspace/ui/components/copy-button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { LoadingButton } from "@workspace/ui/components/loading-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Slider } from "@workspace/ui/components/slider";
import { ExternalLink, ImageIcon, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

type UrlTesterProps = {
  readonly projectId: string;
  readonly projectSlug: string;
  readonly apiEndpoint: string;
};

export function UrlTester({
  projectId,
  projectSlug,
  apiEndpoint,
}: UrlTesterProps) {
  const [imageUrl, setImageUrl] = useState("");
  const [width, setWidth] = useState<number>(800);
  const [quality, setQuality] = useState<number>(80);
  const [format, setFormat] = useState<string>("webp");
  const [selectedApiKeyId, setSelectedApiKeyId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: apiKeys } = api.apiKey.list.useQuery({ projectId });
  const signUrlMutation = api.apiKey.signUrl.useMutation();

  // Clear selection if the selected key no longer exists
  useEffect(() => {
    if (!apiKeys || selectedApiKeyId === "") return;
    if (!apiKeys.some((k) => k.id === selectedApiKeyId)) {
      setSelectedApiKeyId("");
    }
  }, [apiKeys, selectedApiKeyId]);

  const effectiveApiKeyId =
    apiKeys?.some((k) => k.id === selectedApiKeyId) ? selectedApiKeyId : "";

  const buildOperationsString = () => {
    const operations = [];
    if (width) operations.push(`w_${width}`);
    if (quality) operations.push(`q_${quality}`);
    if (format && format !== "auto") operations.push(`f_${format}`);
    return operations.length > 0 ? operations.join(",") : "_";
  };

  const buildUnsignedUrl = () => {
    if (!imageUrl) return null;
    const opsString = buildOperationsString();
    const cleanUrl = imageUrl.replace(/^https?:\/\//, "");
    return `${apiEndpoint}/${projectSlug}/${opsString}/${cleanUrl}`;
  };

  const unsignedUrl = buildUnsignedUrl();

  const handleTest = async () => {
    if (!unsignedUrl || !effectiveApiKeyId) return;

    setIsLoading(true);
    setError(null);

    try {
      const opsString = buildOperationsString();
      const cleanUrl = imageUrl.replace(/^https?:\/\//, "");
      const signingPath = `${opsString}/${cleanUrl}`;

      const { publicKey, signature } = await signUrlMutation.mutateAsync({
        apiKeyId: effectiveApiKeyId,
        path: signingPath,
      });

      const params = new URLSearchParams();
      params.set("key", publicKey);
      params.set("sig", signature);
      const signedUrl = `${unsignedUrl}?${params.toString()}`;

      const response = await fetch(signedUrl, { method: "HEAD" });
      if (response.ok) {
        setPreviewUrl(signedUrl);
      } else {
        setError(
          `Failed to load image: ${response.status} ${response.statusText}`,
        );
        setPreviewUrl(null);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to connect to the optimization service",
      );
      setPreviewUrl(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          URL Tester
        </CardTitle>
        <CardDescription>
          Test image optimization with your settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image-url">Image URL</Label>
            <Input
              id="image-url"
              placeholder="images.example.com/photo.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              Enter a public image URL (without protocol)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {apiKeys && apiKeys.length > 0 && (
              <div className="space-y-2">
                <Label>API Key</Label>
                <Select
                  value={effectiveApiKeyId}
                  onValueChange={setSelectedApiKeyId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select API key" />
                  </SelectTrigger>
                  <SelectContent>
                    {apiKeys.map((key) => (
                      <SelectItem key={key.id} value={key.id}>
                        {key.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="webp">WebP</SelectItem>
                  <SelectItem value="avif">AVIF</SelectItem>
                  <SelectItem value="jpeg">JPEG</SelectItem>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Width: {width}px</Label>
              <Slider
                value={[width]}
                onValueChange={([val]) => setWidth(val ?? 800)}
                min={100}
                max={2000}
                step={100}
              />
            </div>

            <div className="space-y-2">
              <Label>Quality: {quality}%</Label>
              <Slider
                value={[quality]}
                onValueChange={([val]) => setQuality(val ?? 80)}
                min={10}
                max={100}
                step={5}
              />
            </div>
          </div>
        </div>

        {unsignedUrl && (
          <div className="space-y-2">
            <Label>Generated URL (unsigned)</Label>
            <div className="bg-muted flex items-center gap-2 rounded-lg p-3">
              <code className="flex-1 truncate text-sm">{unsignedUrl}</code>
              <CopyButton
                text={unsignedUrl}
                className="bg-secondary h-8 w-8 rounded-md"
              />
            </div>
          </div>
        )}

        {previewUrl && (
          <div className="space-y-2">
            <Label>Signed URL</Label>
            <div className="bg-muted flex items-center gap-2 rounded-lg p-3">
              <code className="flex-1 truncate text-sm">{previewUrl}</code>
              <CopyButton
                text={previewUrl}
                className="bg-secondary h-8 w-8 rounded-md"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open(previewUrl, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <LoadingButton
            onClick={handleTest}
            loading={isLoading}
            disabled={!imageUrl || !effectiveApiKeyId}
          >
            Test Image
          </LoadingButton>
          {apiKeys && apiKeys.length === 0 && (
            <p className="text-muted-foreground self-center text-sm">
              Create an API key first to test URLs
            </p>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}

        {previewUrl && (
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="bg-muted/50 relative flex min-h-[200px] items-center justify-center overflow-auto rounded-xl p-4">
              {isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-black/40">
                  <Loader2 className="text-primary h-8 w-8 animate-spin" />
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Optimized preview"
                className="ring-border max-h-[600px] max-w-full rounded-lg ring-1"
                onError={() => {
                  setError("Failed to load preview image");
                  setPreviewUrl(null);
                }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
