import { getProjectBaseUrl } from "@/lib/utils";
import "@/styles/globals.css";
import { Analytics } from "@vercel/analytics/next";
import { AuthProvider } from "@workspace/auth/provider";
import { ThemeProvider } from "@workspace/ui/components/theme-provider";
import { type Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

const metadataBaseUrl = getProjectBaseUrl();

export const metadata: Metadata = {
  metadataBase: metadataBaseUrl,
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
          className="focus-visible:ring-ring focus-visible:ring-offset-background z-120 bg-background text-foreground sr-only fixed left-4 top-4 rounded-md px-3 py-2 text-sm font-medium shadow-md focus:not-sr-only focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
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
        <Analytics />
      </body>
    </html>
  );
}
