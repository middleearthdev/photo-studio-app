import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/app/(auth)/_components/auth-provider";
import { QueryProvider } from "@/providers/query-provider";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kalarasa Studio | Fotografi Profesional di Karawang",
  description: "Studio foto profesional di Karawang dengan fasilitas lengkap untuk segala kebutuhan fotografi. Wedding, portrait, family, dan commercial photography.",
  keywords: "studio foto, fotografi karawang, wedding photography, portrait photography, commercial photography, pre-wedding karawang",
  authors: [{ name: "Kalarasa Studio" }],
  creator: "Kalarasa Studio",
  publisher: "Kalarasa Studio",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://kalarasastudio.com'),
  openGraph: {
    title: "Kalarasa Studio | Fotografi Profesional di Karawang",
    description: "Studio foto profesional di Karawang dengan fasilitas lengkap untuk segala kebutuhan fotografi.",
    url: "https://kalarasastudio.com",
    siteName: "Kalarasa Studio",
    images: [
      {
        url: "/icons/logo_blue_white.svg",
        width: 800,
        height: 600,
        alt: "Kalarasa Studio Logo",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kalarasa Studio | Fotografi Profesional di Karawang",
    description: "Studio foto profesional di Karawang dengan fasilitas lengkap untuk segala kebutuhan fotografi.",
    images: ["/icons/logo_blue_white.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster position="top-center" richColors />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
