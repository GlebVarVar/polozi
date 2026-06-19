import type { Metadata } from "next";
import { LegalDoc } from "../components/legal-doc";

export const metadata: Metadata = {
  title: "Politika privatnosti — Položi!",
  description: "Kako aplikacija Položi! postupa sa podacima.",
  alternates: { canonical: "/privacy/" },
};

export default function PrivacyPage() {
  return <LegalDoc kind="privacy" />;
}
