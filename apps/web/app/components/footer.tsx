"use client";

import { useLocale } from "../../lib/locale-context";

export function Footer() {
  const { t } = useLocale();

  return (
    <footer className="border-t border-border py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="text-xl font-bold text-primary mb-2">Položi!</div>
            <p className="text-sm text-muted-foreground max-w-sm">
              {t("footer.description")}
            </p>
          </div>

          <div>
            <div className="text-sm font-semibold mb-3">
              {t("footer.nav")}
            </div>
            <div className="space-y-2">
              <a
                href="#features"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("nav.features")}
              </a>
              <a
                href="#how-it-works"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("nav.howItWorks")}
              </a>
              <a
                href="#testimonials"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("nav.testimonials")}
              </a>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold mb-3">
              {t("footer.contact")}
            </div>
            <div className="space-y-2">
              <a
                href="mailto:info@polozi.rs"
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                info@polozi.rs
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Položi! {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
}
