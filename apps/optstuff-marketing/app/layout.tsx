import "@/styles/globals.css";
import { AuthProvider } from "@workspace/auth/provider";
import { ThemeProvider } from "@workspace/ui/components/theme-provider";
import { type Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

const metadataBaseUrl = process.env.PROJECT_URL
  ? `${process.env.PROJECT_URL.startsWith("https") ? "https" : "http"}://${process.env.PROJECT_URL}`
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(metadataBaseUrl),
  title: "OptStuff - High Performance Image Optimization",
  description:
    "Transform, resize, and optimize your images on-the-fly with our powerful image processing API. Built on sharp and libvips.",
  openGraph: {
    type: "website",
    title: "OptStuff - High Performance Image Optimization",
    description:
      "Transform, resize, and optimize your images on-the-fly with our powerful image processing API. Built on sharp and libvips.",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "OptStuff - High Performance Image Optimization",
    description:
      "Transform, resize, and optimize your images on-the-fly with our powerful image processing API. Built on sharp and libvips.",
    images: ["/opengraph-image"],
  },
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
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus-visible:ring-ring focus-visible:ring-offset-background fixed left-4 top-4 z-120 rounded-md bg-background px-3 py-2 text-sm font-medium text-foreground shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          Skip to main content
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
