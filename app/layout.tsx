import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hulu Ganga Dashboard",
  description:
    "GIS dashboard for hydrological and sediment modelling of land-use scenarios and mini-hydropower performance, Hulu Ganga catchment, Sri Lanka.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
