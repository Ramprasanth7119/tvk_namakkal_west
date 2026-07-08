import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "தமிழக வெற்றிக் கழகம் | Namakkal West",
  description: "தமிழக வெற்றிக் கழகம் நாமக்கல் மேற்கு மாவட்டத்தின் அதிகாரப்பூர்வ இணையதளம். மக்கள் குரல் மையம் மூலம் புகார்கள் மற்றும் தீர்வுகள் பகுப்பாய்வு.",
  icons: {
    icon: "/tvk-logo.jpeg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ta"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anek+Tamil:wght@500;600;700;800&family=Catamaran:wght@700;800;900&family=Hind+Madurai:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}

