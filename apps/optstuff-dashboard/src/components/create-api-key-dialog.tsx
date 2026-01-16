"use client";

import { useState } from "react";
import { Loader2, Copy, Check, AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Card, CardContent } from "@workspace/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { api } from "@/trpc/react";

type CreateApiKeyDialogProps = {
  readonly projectId: string;
  readonly trigger?: React.ReactNode;
};

export function CreateApiKeyDialog({
  projectId,
  trigger,
}: CreateApiKeyDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState<"key" | "curl" | "ts" | null>(null);

  const utils = api.useUtils();

  const { mutate: createApiKey, isPending } = api.apiKey.create.useMutation({
    onSuccess: (result) => {
      if (result?.key) {
        setCreatedKey(result.key);
        utils.apiKey.list.invalidate();
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createApiKey({
      projectId,
      name: name.trim(),
    });
  };

  const handleCopy = async (
    text: string,
    type: "key" | "curl" | "ts",
  ) => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClose = () => {
    setOpen(false);
    setName("");
    setCreatedKey(null);
    setCopied(null);
  };

  // Generate code examples
  const curlExample = createdKey
    ? `curl -X GET "https://api.optstuff.dev/v1/optimize?url=YOUR_IMAGE_URL&width=800&format=webp" \\
  -H "Authorization: Bearer ${createdKey}"`
    : "";

  const tsExample = createdKey
    ? `const response = await fetch(
  "https://api.optstuff.dev/v1/optimize?" + new URLSearchParams({
    url: "YOUR_IMAGE_URL",
    width: "800",
    format: "webp",
  }),
  {
    headers: {
      Authorization: "Bearer ${createdKey}",
    },
  }
);

const optimizedImage = await response.blob();`
    : "";

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose();
        else setOpen(true);
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? <Button>Create API Key</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        {!createdKey ? (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                Generate a new API key to access the image optimization service.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="keyName">Key Name</Label>
                <Input
                  id="keyName"
                  placeholder="Production Key"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isPending}
                  autoFocus
                />
                <p className="text-muted-foreground text-xs">
                  A descriptive name to help you identify this key later.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || !name.trim()}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Key
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                API Key Created
              </DialogTitle>
              <DialogDescription>
                Your new API key has been created. Make sure to copy it now -
                you won&apos;t be able to see it again!
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] space-y-4 overflow-y-auto py-4">
              <Card className="border-amber-500/50 bg-amber-500/10">
                <CardContent className="flex items-start gap-3 pt-4">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-600 dark:text-amber-400">
                      Save this key securely
                    </p>
                    <p className="text-muted-foreground mt-1">
                      This is the only time you&apos;ll see the full API key.
                      Store it in a secure location like a password manager or
                      environment variable.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div>
                <Label className="text-muted-foreground text-xs">
                  Your API Key
                </Label>
                <div className="mt-1.5 flex items-center gap-2">
                  <code className="bg-muted flex-1 rounded-md px-3 py-2 font-mono text-sm break-all">
                    {createdKey}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(createdKey!, "key")}
                    className="shrink-0"
                  >
                    {copied === "key" ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Usage Examples */}
              <div>
                <Label className="text-muted-foreground text-xs">
                  Quick Start
                </Label>
                <Tabs defaultValue="curl" className="mt-2">
                  <TabsList className="w-full">
                    <TabsTrigger value="curl" className="flex-1">
                      cURL
                    </TabsTrigger>
                    <TabsTrigger value="typescript" className="flex-1">
                      TypeScript
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="curl" className="mt-2">
                    <div className="relative">
                      <pre className="bg-muted overflow-x-auto rounded-md p-3 text-xs">
                        <code>{curlExample}</code>
                      </pre>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopy(curlExample, "curl")}
                        className="absolute top-2 right-2 h-7 w-7"
                      >
                        {copied === "curl" ? (
                          <Check className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="typescript" className="mt-2">
                    <div className="relative">
                      <pre className="bg-muted overflow-x-auto rounded-md p-3 text-xs">
                        <code>{tsExample}</code>
                      </pre>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopy(tsExample, "ts")}
                        className="absolute top-2 right-2 h-7 w-7"
                      >
                        {copied === "ts" ? (
                          <Check className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Documentation Link */}
              <div className="text-muted-foreground flex items-center justify-center gap-1 text-xs">
                <span>Need more help?</span>
                <a
                  href="https://docs.optstuff.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary inline-flex items-center gap-1 hover:underline"
                >
                  View full documentation
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
