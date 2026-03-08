import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Family Finance",
  description: "Personal finance for Kenyan households",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}