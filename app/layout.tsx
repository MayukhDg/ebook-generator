import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpusCraft | The Executive Publishing Studio — Turn Your Expertise Into An Authoritative Book",
  description: "The AI Authority Engine for founders, consultants, and operators. Synthesize voice transcripts and frameworks into Amazon KDP-grade books through chapter-by-chapter co-writing with strict context memory and decoupled vector cover design.",
  keywords: [
    "AI book generator",
    "Amazon KDP AI",
    "consultant book authoring",
    "voice to ebook",
    "authoritative publishing SaaS",
    "OpusCraft"
  ],
  authors: [{ name: "OpusCraft" }],
  openGraph: {
    title: "OpusCraft — The Executive Publishing Studio",
    description: "Turn your real-world expertise into an authoritative, press-ready book in an afternoon.",
    url: "https://opuscraft.ai",
    siteName: "OpusCraft",
    images: [
      {
        url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80",
        width: 1200,
        height: 630,
        alt: "OpusCraft — The Executive Publishing Studio",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OpusCraft — Turn Real-World Expertise Into An Authoritative Book",
    description: "Amazon KDP-grade book authoring with strict global outline memory and decoupled typography cover design.",
    images: ["https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FEFCF9] text-gray-900 antialiased selection:bg-orange-200 selection:text-orange-900">
        {children}
      </body>
    </html>
  );
}
