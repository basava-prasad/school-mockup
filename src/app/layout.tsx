import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SchoolSphere ERP – Prototype",
  description: "Interactive School Management System prototype (frontend only)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
