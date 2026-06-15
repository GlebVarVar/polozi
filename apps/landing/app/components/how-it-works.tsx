"use client";

import { useLocale } from "../../lib/locale-context";

export function HowItWorks() {
  const { t } = useLocale();

  const steps = [
    { number: "01", title: t("how.step1.title"), desc: t("how.step1.desc") },
    { number: "02", title: t("how.step2.title"), desc: t("how.step2.desc") },
    { number: "03", title: t("how.step3.title"), desc: t("how.step3.desc") },
    { number: "04", title: t("how.step4.title"), desc: t("how.step4.desc") },
  ];

  return (
    <section id="how-it-works" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t("how.title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("how.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div key={step.number} className="relative text-center">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-px bg-border" />
              )}
              <div className="text-5xl font-bold text-primary/15 mb-4">
                {step.number}
              </div>
              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
