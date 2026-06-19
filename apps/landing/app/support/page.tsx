import type { Metadata } from "next";
import { LegalDoc } from "../components/legal-doc";

export const metadata: Metadata = {
  title: "Podrška — Položi!",
  description: "Pomoć i podrška za aplikaciju Položi!.",
  alternates: { canonical: "/support/" },
};

export default function SupportPage() {
  return <LegalDoc kind="support" />;
}
