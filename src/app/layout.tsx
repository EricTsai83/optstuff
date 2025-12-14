import "@/styles/globals.css";
import { type Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { TRPCReactProvider } from "@/trpc/react";
import { ThemeProvider } from "@/components/theme-provider";

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
          // disableTransitionOnChange
        >
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
