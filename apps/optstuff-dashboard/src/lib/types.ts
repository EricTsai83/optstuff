/**
 * Shared type definitions across the application
 */

/**
 * Discriminated union for operations that can succeed or fail.
 * Prefer this over throwing errors in non-framework code.
 */
export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

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
