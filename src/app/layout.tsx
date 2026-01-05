import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ASCII — SVG to ASCII Art Converter & 3D Renderer",
  description: "Transform SVG graphics into beautiful ASCII art. Features real-time preview, customizable character sets, and interactive 3D rendering. Free, open-source, and works entirely in your browser.",
  keywords: ["ASCII art", "SVG converter", "ASCII generator", "3D ASCII", "text art", "image to ASCII"],
  authors: [{ name: "ASCII Project" }],
  openGraph: {
    title: "ASCII — SVG to ASCII Art Converter",
    description: "Transform SVG graphics into ASCII art with 3D rendering",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "ASCII — SVG to ASCII Art Converter",
    description: "Transform SVG graphics into ASCII art with 3D rendering",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

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
        {children}
      </body>
    </html>
  );
}
