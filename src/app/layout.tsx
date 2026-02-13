import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Chewy } from "next/font/google";
import { Analytics } from "@vercel/analytics/next"
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const chewy = Chewy({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-chewy",
});

export const viewport: Viewport = {
  themeColor: "#FF2D55",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  verification: {
    google: "eP_k7lAoHo1853EwR8zCZmZedWBoRXSHVlCBn4R92PA",
  },
  metadataBase: new URL("https://willyoubmyvalentine.vercel.app"),
  title: "Will You Be My Valentine?",
  description: "The most unique way to ask 'Will you be my Valentine?'. Forget boring cards send an interactive, playful experience that makes it impossible to say no. Try it now!",
  applicationName: "Will You Be My Valentine",
  authors: [{ name: "iloveyou" }],
  generator: "Next.js",
  keywords: [
    "will you be my valentine",
    "will you be my valentine game",
    "will you be my valentine online",
    "will you be my valentine link",
    "will you be my valentine card",
    "will you be my valentine website",
    "will you be my valentine free",
    "valentine",
    "valentines day",
    "valentine card",
    "valentine ideas",
    "willyoubemyvalentine",
    "14 feb",
    "14 february",
    "14 feb 2026",
    "digital valentine",
    "valentine link",
    "online valentine",
    "valentine game",
    "valentine app",
    "ask valentine online",
    "send valentine link",
    "create valentine card",
    "interactive valentine proposal",
    "how to ask valentine 2026",
    "cute valentine ways",
    "funny valentine ask",
    "free valentine website",
    "no login valentine card"
  ],
  referrer: "origin-when-cross-origin",
  creator: "Valentine Team",
  publisher: "Valentine Team",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://willyoubmyvalentine.vercel.app",
    title: "Will You Be My Valentine?",
    description: "The most unique way to ask 'Will you be my Valentine?'. Send an interactive, playful experience they can't say no to. Free and shareable! 💌",
    siteName: "Will You Be My Valentine",
    images: [
      {
        url: "/willyoubemyvalentine.webp",
        width: 1200,
        height: 630,
        alt: "Will you be my Valentine Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Will You Be My Valentine?",
    description: "The most unique way to ask 'Will you be my Valentine?'. Send an interactive, playful experience they can't say no to! 💌",
    images: ["/willyoubemyvalentine.webp"],
    creator: "@valentine_app",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  alternates: {
    canonical: "https://willyoubmyvalentine.vercel.app",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "name": "Will you be my valentine ?",
      "url": "https://willyoubmyvalentine.vercel.app",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://willyoubmyvalentine.vercel.app/?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "SoftwareApplication",
      "name": "Will You Be My Valentine Game",
      "applicationCategory": "GameApplication",
      "operatingSystem": "Any",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is the best way to ask 'Will you be my Valentine'?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The best way to ask is with a creative, interactive surprise that they can't say no to. Our 'Will you be my Valentine' game lets you send a personalized link that reveals the big question in a fun, memorable way."
          }
        },
        {
          "@type": "Question",
          "name": "How to ask 'Will you be my valentine' appropriately?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The best way is to be unique and personal. Sending a creative digital experience like our interactive 'Will You Be My Valentine' game is a fun, low-pressure way to ask the big question."
          }
        },
        {
          "@type": "Question",
          "name": "What is a unique digital valentine idea?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Instead of a generic e-card, use an interactive web app where your partner can play a game, scratch a card, or see a personalized drawing. It shows effort and creativity."
          }
        },
        {
          "@type": "Question",
          "name": "Is this Valentine website free to use?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, this interactive Valentine proposal tool is 100% free to use and share with your loved one."
          }
        }
      ]
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${chewy.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
        <Analytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
