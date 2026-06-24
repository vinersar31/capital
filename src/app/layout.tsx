import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Capital — Net Worth Dashboard",
  description:
    "Track stocks, bonds, savings, pensions (Pilon II & III) and loans across currencies — with live charts.",
};

export const viewport: Viewport = {
  themeColor: "#070b14",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
