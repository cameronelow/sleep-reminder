import type { Metadata } from "next";
import { Geist } from "next/font/google";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "Circadian",
  description: "Get notified when it's time to wind down for a good night's sleep.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={geist.variable}>
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  );
}
