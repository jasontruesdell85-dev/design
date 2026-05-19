import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Memorial Product Studio",
  description: "Backend and admin POC"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
