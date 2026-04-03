"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { CopyButton } from "@workspace/ui/components/copy-button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";

type SnippetTab = {
  readonly id: string;
  readonly label: string;
  readonly raw: string;
  readonly html: string;
};

type DeveloperSnippetsProps = {
  readonly tabs: readonly SnippetTab[];
};

export function DeveloperSnippets({ tabs }: DeveloperSnippetsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Start</CardTitle>
        <CardDescription>
          Copy these code snippets to integrate OptStuff into your project
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={tabs[0]?.id} className="w-full">
          <TabsList className="mb-4 grid w-full grid-cols-2 sm:grid-cols-4">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              <div className="relative">
                <div
                  className="max-h-[400px] overflow-auto rounded-lg text-sm [&_pre]:p-4"
                  dangerouslySetInnerHTML={{ __html: tab.html }}
                />
                <div className="absolute right-2 top-2">
                  <CopyButton
                    text={tab.raw}
                    className="bg-secondary h-8 w-8 rounded-md"
                  />
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
