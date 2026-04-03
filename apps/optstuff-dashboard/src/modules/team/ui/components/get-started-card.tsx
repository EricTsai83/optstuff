import { DOCS_LINKS } from "@/lib/constants";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Zap } from "lucide-react";

export function GetStartedCard() {
  return (
    <div>
      <h3 className="mb-3 text-sm font-medium">Get Started</h3>
      <Card>
        <CardContent className="space-y-3 pt-6 text-center">
          <div className="bg-primary/10 mx-auto flex h-10 w-10 items-center justify-center rounded-full">
            <Zap className="text-primary h-5 w-5" />
          </div>
          <h4 className="font-medium">Ready to optimize?</h4>
          <p className="text-muted-foreground text-sm">
            Create a project and generate an API key to start optimizing your
            images.
          </p>
          <Button variant="outline" className="w-full bg-transparent" asChild>
            <a href={DOCS_LINKS.home} target="_blank" rel="noopener noreferrer">
              View Documentation
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
