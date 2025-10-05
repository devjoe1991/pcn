import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import StructuredData from "../components/StructuredData";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AppealYourPCN.com - Meet Kerbi, Your AI-Powered PCN Appeal Assistant",
  description: "Meet Kerbi, your revolutionary AI-powered PCN appeal buddy. Get out of paying parking tickets with our specialized AI system that tracks and appeals PCN violations with 99.2% success rate.",
  keywords: "PCN appeal, parking ticket appeal, AI parking ticket, PCN challenge, parking fine appeal, AI legal assistant, parking ticket help, PCN tracker",
  authors: [{ name: "AppealYourPCN" }],
  creator: "AppealYourPCN",
  publisher: "AppealYourPCN",
  robots: "index, follow",
  openGraph: {
    title: "AppealYourPCN.com - Meet Kerbi, Your AI-Powered PCN Appeal Assistant",
    description: "Meet Kerbi, your revolutionary AI-powered PCN appeal buddy. Get out of paying parking tickets with our specialized AI system that tracks and appeals PCN violations with 99.2% success rate.",
    url: "https://appealyourpcn.com",
    siteName: "AppealYourPCN",
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "AppealYourPCN.com - Meet Kerbi, Your AI-Powered PCN Appeal Assistant",
    description: "Meet Kerbi, your revolutionary AI-powered PCN appeal buddy. Get out of paying parking tickets with our specialized AI system.",
  },
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <StructuredData />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
