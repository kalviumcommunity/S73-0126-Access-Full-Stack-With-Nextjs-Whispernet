import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { OfflineProvider } from "@/components/providers/OfflineProvider";
import { ServiceWorkerProvider } from "@/components/providers/ServiceWorkerProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "RuralEdu — Offline-first school portal",
    template: "%s · RuralEdu",
  },
  description:
    "Student records, attendance and textbooks that keep working when the connection does not. Built for rural schools on intermittent networks.",
  manifest: "/manifest.json",
  applicationName: "RuralEdu",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RuralEdu",
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    siteName: "RuralEdu",
    title: "RuralEdu — Offline-first school portal",
    description:
      "Student records, attendance and textbooks that keep working when the connection does not.",
  },
};

export const viewport: Viewport = {
  themeColor: "#047857",
  width: "device-width",
  initialScale: 1,
  // `maximumScale: 1` was blocking pinch-zoom, which people with low vision
  // rely on. Zoom stays available.
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <link
          rel="apple-touch-icon"
          sizes="192x192"
          href="/icons/icon-192x192.png"
        />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <OfflineProvider>
          <AuthProvider>
            <ServiceWorkerProvider />
            {children}
          </AuthProvider>
        </OfflineProvider>
      </body>
    </html>
  );
}
