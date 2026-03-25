"use client";

import { ArrowDown, Smartphone } from "lucide-react";
import { useLocale } from "../../lib/locale-context";

export function Hero() {
  const { t } = useLocale();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm text-primary font-medium mb-8">
          <Smartphone size={16} />
          {t("hero.badge")}
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
          {t("hero.title1")}
          <br />
          <span className="text-primary">{t("hero.title2")}</span>
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          {t("hero.description")}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#download"
            className="inline-flex items-center justify-center rounded-2xl bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
          >
            {t("hero.cta")}
          </a>
          <a
            href="#features"
            className="inline-flex items-center justify-center rounded-2xl border border-border px-8 py-4 text-lg font-semibold hover:bg-secondary transition-colors"
          >
            {t("hero.ctaSecondary")}
          </a>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
          <div>
            <div className="text-3xl font-bold text-primary">1000+</div>
            <div className="text-sm text-muted-foreground">
              {t("hero.statQuestions")}
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">100+</div>
            <div className="text-sm text-muted-foreground">
              {t("hero.statSchools")}
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary">3</div>
            <div className="text-sm text-muted-foreground">
              {t("hero.statLanguages")}
            </div>
          </div>
        </div>

        <div className="mt-16 animate-bounce">
          <ArrowDown size={24} className="mx-auto text-muted-foreground" />
        </div>
      </div>
    </section>
  );
}
