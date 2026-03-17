import { RootProvider } from "fumadocs-ui/provider/next";
import { getSiteBaseUrl } from "@/lib/site-url";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./global.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: getSiteBaseUrl(),
  title: {
    default: "OptStuff Docs",
    template: "%s | OptStuff Docs",
  },
  description:
    "Documentation for OptStuff - optimize your stuff with actionable insights.",
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
