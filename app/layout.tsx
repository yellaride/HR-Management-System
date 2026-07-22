import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";



const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  // Keep the default Geist weights; we control weight via CSS classes
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HR Management System",
  description: "Employee attendance, leaves, payslips and HR administration portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* next-auth session support */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
