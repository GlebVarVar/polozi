import type { Metadata } from "next";
import { AuthProvider } from "../lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Položi! Backoffice",
  description: "Admin panel for the Položi! driving exam platform",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-background text-foreground">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
