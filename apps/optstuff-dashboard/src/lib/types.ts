/**
 * Shared type definitions across the application
 */

export type Team = {
  id: string;
  name: string;
  slug: string;
  isPersonal: boolean;
};

export type Project = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: Date;
};

export type NavTab = "Overview" | "Usage" | "Settings";
