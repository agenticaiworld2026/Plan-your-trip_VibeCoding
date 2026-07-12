import type { Metadata, Viewport } from "next";
import { Instrument_Sans } from "next/font/google";
import { Providers } from "@/components/providers/providers";
import { ServiceWorkerRegister } from "@/components/providers/sw-register";
import "./globals.css";

const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Waypoint — AI Itinerary Planner",
  description: "Plan beautiful day-by-day trips with AI-powered itineraries and a drag-and-drop kanban board.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Waypoint",
  },
};

export const viewport: Viewport = {
  themeColor: "#2D6A5E",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${instrument.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <Providers>
          <ServiceWorkerRegister />
          {children}
        </Providers>
      </body>
    </html>
  );
}
