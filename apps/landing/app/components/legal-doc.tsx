"use client";

import Link from "next/link";
import { useLocale } from "../../lib/locale-context";
import { LocaleSwitcher } from "./locale-switcher";
import {
  SUPPORT_EMAIL,
  homeLabel,
  privacyContent,
  supportContent,
} from "../../lib/legal-content";

function Chrome({ children }: { children: React.ReactNode }) {
  const { locale } = useLocale();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="text-xl font-bold text-primary"
            aria-label={homeLabel[locale]}
          >
            Položi!
          </Link>
          <LocaleSwitcher />
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 w-full">
        {children}
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Položi!
      </footer>
    </div>
  );
}

export function LegalDoc({ kind }: { kind: "privacy" | "support" }) {
  const { locale } = useLocale();

  if (kind === "privacy") {
    const doc = privacyContent[locale];
    return (
      <Chrome>
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">{doc.title}</h1>
        <p className="text-sm text-muted-foreground mb-8">
          {doc.updatedLabel}: {doc.updated}
        </p>
        <p className="text-base leading-relaxed mb-10">{doc.intro}</p>

        <div className="space-y-8">
          {doc.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-semibold mb-3">{section.heading}</h2>
              <div className="space-y-3">
                {section.paragraphs.map((p, i) => (
                  <p key={i} className="text-base leading-relaxed text-muted-foreground">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </Chrome>
    );
  }

  const doc = supportContent[locale];
  return (
    <Chrome>
      <h1 className="text-3xl sm:text-4xl font-bold mb-4">{doc.title}</h1>
      <p className="text-base leading-relaxed mb-10">{doc.intro}</p>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-3">{doc.contactHeading}</h2>
        <p className="text-base leading-relaxed text-muted-foreground mb-3">
          {doc.contactBody}
        </p>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="inline-flex items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          {SUPPORT_EMAIL}
        </a>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">{doc.faqHeading}</h2>
        <div className="space-y-5">
          {doc.faq.map((item) => (
            <div key={item.q}>
              <h3 className="text-base font-medium mb-1">{item.q}</h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      <p className="text-sm text-muted-foreground">
        {doc.privacyNote}{" "}
        <Link href="/privacy/" className="text-primary hover:underline">
          {doc.privacyLinkLabel}
        </Link>
        .
      </p>
    </Chrome>
  );
}
