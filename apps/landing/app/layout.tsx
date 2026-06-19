import type { Metadata } from "next";
import localFont from "next/font/local";
import { LocaleProvider } from "../lib/locale-context";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://polozi.rs"),
  alternates: { canonical: "/" },
  title: "Položi! — Priprema za vozački ispit u Srbiji",
  description:
    "Besplatna aplikacija za pripremu vozačkog ispita. Vežbaj pitanja, simuliraj ispit, pronađi auto školu.",
  keywords: [
    "vozački ispit",
    "auto škola",
    "Srbija",
    "testovi",
    "položi",
    "vožnja",
  ],
  openGraph: {
    title: "Položi! — Priprema za vozački ispit",
    description:
      "Vežbaj pitanja, simuliraj ispit i položi iz prvog puta!",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sr" className="scroll-smooth">
      <body
        className={`${geistSans.variable} font-sans antialiased bg-background text-foreground`}
      >
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
