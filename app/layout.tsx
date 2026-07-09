import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Catamaran, Hind_Madurai, Noto_Sans_Tamil } from "next/font/google";
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

const notoSansTamil = Noto_Sans_Tamil({
  subsets: ["tamil"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-tamil",
  display: "swap",
});

const hindMadurai = Hind_Madurai({
  subsets: ["latin", "tamil"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hind-madurai",
  display: "swap",
});

const catamaran = Catamaran({
  subsets: ["latin", "tamil"],
  weight: ["700", "800", "900"],
  variable: "--font-catamaran",
  display: "swap",
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
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansTamil.variable} ${hindMadurai.variable} ${catamaran.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col tvk-font-root">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
