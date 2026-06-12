import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Display typeface (per the Primitives design system): JetBrains Mono 500
// drives all big titles via --font-display.
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});
import { ConvexClientProvider } from "./ConvexClientProvider";
import { Toaster } from "@/components/ui/sonner";

// Inter font was previously loaded here but never used in CSS — removed in
// Slice 0 to drop a ~30KB font download. Geist Sans is now the primary UI font
// (per Decision #9, italic display uses Geist Italic via .font-editorial class).

export const metadata: Metadata = {
  title: {
    default: "Jokko — L'inbox WhatsApp partagée pour les équipes",
    template: "%s | Jokko",
  },
  description:
    "Centralisez vos numéros WhatsApp Business, assignez les conversations à votre équipe, laissez l'IA rédiger les réponses. Un seul endroit pour toute votre relation client sur WhatsApp.",
  keywords: [
    "WhatsApp Business",
    "inbox partagée",
    "shared inbox",
    "service client",
    "support équipe",
    "multi-agents",
    "assignation",
    "IA WhatsApp",
    "Jokko",
  ],
  authors: [{ name: "Jokko Team" }],
  creator: "Jokko",
  publisher: "Jokko",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://www.jokko.co",
    title: "Jokko — L'inbox WhatsApp partagée pour les équipes",
    description:
      "Un seul outil pour gérer plusieurs numéros WhatsApp Business à plusieurs. Assignation, IA co-pilot, flows automatiques.",
    siteName: "Jokko",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Jokko — L'inbox WhatsApp partagée pour les équipes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jokko — L'inbox WhatsApp partagée pour les équipes",
    description:
      "Centralisez vos WhatsApp Business. Répondez à plusieurs. Laissez l'IA faire le premier brouillon.",
    images: ["/logo.png"],
    creator: "@jokko_co",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} ${jetbrainsMono.variable}`}
      style={
        {
          "--font-display": "var(--font-jetbrains-mono)",
          "--font-body": "var(--font-geist-sans)",
          "--font-mono": "var(--font-geist-mono)",
        } as React.CSSProperties
      }
    >
      <head>
        {/* FB SDK — do not reorder. Sentry/CSP-sensitive block. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.fbAsyncInit = function() {
                FB.init({
                  appId: ${JSON.stringify(process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '')},
                  cookie: true,
                  xfbml: true,
                  version: 'v22.0'
                });
                window.__FB_INITIALIZED__ = true;
              };
              (function(d, s, id) {
                var fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) return;
                var js = d.createElement(s); js.id = id;
                js.src = 'https://connect.facebook.net/en_US/sdk.js';
                js.async = true; js.defer = true;
                fjs.parentNode.insertBefore(js, fjs);
              }(document, 'script', 'facebook-jssdk'));
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <ConvexClientProvider>
          {children}
          <Toaster />
        </ConvexClientProvider>
      </body>
    </html>
  );
}
