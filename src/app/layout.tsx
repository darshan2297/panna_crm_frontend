import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Panna Biryani CRM — Operations & Management",
  description: "Internal CRM, Kitchen Display & Order Management System for Panna Biryani",
  icons: {
    icon: "/brand/logo.jpg",
    shortcut: "/brand/logo.jpg",
    apple: "/brand/logo.jpg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased font-sans bg-[#FAF8F5] text-slate-800">
        {children}
      </body>
    </html>
  );
}
