import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import AppLoadingWrapper from "@/components/AppLoadingWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Party Collection PWA",
  description: "A progressive web app for party collection management",
  manifest: "/manifest.json",
  themeColor: "#000000",
};

/**
 * Root Layout Function
 * 
 * This function creates the HTML structure that wraps every page in the app.
 * It's called by Next.js for every page render.
 * 
 * Structure:
 * 1. HTML root with language attribute
 * 2. Body with font variables and styling
 * 3. AuthProvider wrapper for authentication state
 * 4. Children (the actual page content)
 * 
 * Why this pattern:
 * - Consistent HTML structure across all pages
 * - Global context providers applied once
 * - Font variables available throughout the app
 * - Accessibility attributes (lang="en")
 * 
 * @param children - The page content to render inside this layout
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <AppLoadingWrapper>
            {children}
          </AppLoadingWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
