import type { Metadata } from "next";
import { SettingsProvider } from "../lib/settings";
import "./globals.css";

export const metadata: Metadata = {
  title: "Auto — Priprema za vozački ispit",
  description:
    "Vežbaj pitanja, simuliraj ispit, prati napredak i pronađi auto školu.",
};

// Apply persisted theme + font size before hydration to avoid a flash.
const themeScript = `
(function () {
  try {
    var s = JSON.parse(localStorage.getItem('polozi.settings') || '{}');
    var theme = s.theme || 'system';
    var dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
    if (s.fontSize) document.documentElement.dataset.fontSize = s.fontSize;
    if (s.language) document.documentElement.lang = s.language;
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sr" className="scroll-smooth">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans antialiased bg-background text-foreground">
        <SettingsProvider>{children}</SettingsProvider>
      </body>
    </html>
  );
}
