"use client";

import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SearchToolbar() {
  return (
    <div className="flex items-center gap-2 py-4">
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search Projects..."
          className="bg-background h-10 w-full pl-9"
        />
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="border-border h-10 w-10 shrink-0 border"
      >
        <SlidersHorizontal className="h-4 w-4" />
      </Button>

      <div className="hidden items-center overflow-hidden rounded-lg border md:flex">
        <Button
          variant="ghost"
          size="icon"
          className="bg-secondary h-9 w-9 rounded-none"
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none">
          <List className="h-4 w-4" />
        </Button>
      </div>

      {/* Add New dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="shrink-0 gap-1">
            Add New...
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>New Project</DropdownMenuItem>
          <DropdownMenuItem>Import from GitHub</DropdownMenuItem>
          <DropdownMenuItem>Clone Template</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
