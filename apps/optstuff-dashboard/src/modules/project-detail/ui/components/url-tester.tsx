"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Slider } from "@workspace/ui/components/slider";
import { ExternalLink, ImageIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { CopyButton } from "./copy-button";

type UrlTesterProps = {
  readonly projectSlug: string;
  readonly apiEndpoint: string;
};

export function UrlTester({ projectSlug, apiEndpoint }: UrlTesterProps) {
  const [imageUrl, setImageUrl] = useState("");
  const [width, setWidth] = useState<number>(800);
  const [quality, setQuality] = useState<number>(80);
  const [format, setFormat] = useState<string>("webp");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const buildOptimizedUrl = () => {
    if (!imageUrl) return null;

    const operations = [];
    if (width) operations.push(`w_${width}`);
    if (quality) operations.push(`q_${quality}`);
    if (format && format !== "auto") operations.push(`f_${format}`);

    const opsString = operations.length > 0 ? operations.join(",") : "_";
    const cleanUrl = imageUrl.replace(/^https?:\/\//, "");

    return `${apiEndpoint}/${projectSlug}/${opsString}/${cleanUrl}`;
  };

  const optimizedUrl = buildOptimizedUrl();

  const handleTest = async () => {
    if (!optimizedUrl) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(optimizedUrl, { method: "HEAD" });
      if (response.ok) {
        setPreviewUrl(optimizedUrl);
      } else {
        setError(`Failed to load image: ${response.status} ${response.statusText}`);
        setPreviewUrl(null);
      }
    } catch (err) {
      setError("Failed to connect to the optimization service");
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

          <div className="grid gap-4 sm:grid-cols-3">
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
        </div>

        {optimizedUrl && (
          <div className="space-y-2">
            <Label>Generated URL</Label>
            <div className="bg-muted flex items-center gap-2 rounded-lg p-3">
              <code className="flex-1 truncate text-sm">{optimizedUrl}</code>
              <CopyButton text={optimizedUrl} variant="secondary" size="sm" />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open(optimizedUrl, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={handleTest} disabled={!imageUrl || isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Test Image
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}

        {previewUrl && (
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="bg-muted/50 overflow-hidden rounded-lg border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Optimized preview"
                className="max-h-[400px] w-full object-contain"
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
