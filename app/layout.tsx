import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { WebVitals } from "@/components/analytics/web-vitals";
import { Toaster } from "@/components/ui/toaster";
import { PostHogProvider } from "@/components/PostHogProvider";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Flint Lead Magnet Tool",
  description: "Create powerful lead magnets with interactive campaigns and capture valuable leads",
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.className} antialiased`}>
        <PostHogProvider>
          <ErrorBoundary>
            <AuthProvider>
              <WebVitals />
              {children}
              <Toaster />
            </AuthProvider>
          </ErrorBoundary>
        </PostHogProvider>
      </body>
    </html>
  );
}
