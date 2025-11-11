import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Freelance — Fast, Vetted Freelancers | Deliverables in 48h",
  description: "Get vetted freelancers for high-impact deliverables fast. Pay into escrow, lock a specialist, and get results — landing pages, ads, bug fixes and more — delivered and approved in 48 hours.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <Sidebar />
        <main className="pb-16 lg:pb-0">
          <Suspense fallback={<div className="min-h-screen bg-black" />}>
            {children}
          </Suspense>
        </main>
        <MobileNav />
      </body>
    </html>
  );
}
