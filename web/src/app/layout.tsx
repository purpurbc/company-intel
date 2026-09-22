import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/src/components/ui/AppShell";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

const appSans = Geist({
  variable: "--font-app-sans",
  subsets: ["latin"],
  fallback: ["Inter", "Arial", "sans-serif"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Cintela",
    template: "%s | Cintela",
  },
  description: "Svensk företags- och marknadsinsikt med tydliga källor.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeScript = `
    try {
      var storedTheme = localStorage.getItem("company-intel-theme");
      var theme = storedTheme === "light" || storedTheme === "dark"
        ? storedTheme
        : (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
      var storedColorTheme = localStorage.getItem("company-intel-color-theme");
      var colorThemes = ["nordic", "ocean", "plum"];
      var colorTheme = colorThemes.indexOf(storedColorTheme) >= 0
        ? storedColorTheme
        : "nordic";
      document.documentElement.dataset.theme = theme;
      document.documentElement.dataset.colorTheme = colorTheme;
    } catch (_) {}
  `;

  return (
    <html
      lang="sv"
      suppressHydrationWarning
      className={`${appSans.variable} ${geistMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
