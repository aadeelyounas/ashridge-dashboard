import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ashridge Dashboard",
  description: "Ashridge Group SEO/GEO Operations Dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
