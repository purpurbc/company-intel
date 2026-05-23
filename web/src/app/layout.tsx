import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppTopBar } from "@/src/components/ui/AppTopBar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Company Intel",
  description: "B2B lead intelligence workspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-slate-950 antialiased`}
      >
        <AppTopBar />
        {children}
      </body>
    </html>
  );
}
