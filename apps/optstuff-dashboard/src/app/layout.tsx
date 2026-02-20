import "@/styles/globals.css";
import { TRPCReactProvider } from "@/trpc/react";
import { AuthProvider } from "@workspace/auth/provider";
import { ThemeProvider } from "@workspace/ui/components/theme-provider";
import { TooltipProvider } from "@workspace/ui/components/tooltip";
import { type Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

export const metadata: Metadata = {
  title: "OptStuff - High Performance Image Optimization",
  description:
    "Transform, resize, and optimize your images on-the-fly with our powerful image processing API. Built on sharp and libvips.",
  generator: "v0.app",
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider afterSignOutUrl="/sign-in">
            <TRPCReactProvider>
              <TooltipProvider>
                {children}
              </TooltipProvider>
            </TRPCReactProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
