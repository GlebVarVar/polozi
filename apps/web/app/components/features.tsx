"use client";

import {
  BookOpen,
  Clock,
  BarChart3,
  Building2,
  WifiOff,
  Languages,
} from "lucide-react";
import { useLocale } from "../../lib/locale-context";

export function Features() {
  const { t } = useLocale();

  const features = [
    {
      icon: BookOpen,
      title: t("features.training.title"),
      description: t("features.training.desc"),
    },
    {
      icon: Clock,
      title: t("features.exam.title"),
      description: t("features.exam.desc"),
    },
    {
      icon: BarChart3,
      title: t("features.stats.title"),
      description: t("features.stats.desc"),
    },
    {
      icon: Building2,
      title: t("features.schools.title"),
      description: t("features.schools.desc"),
    },
    {
      icon: WifiOff,
      title: t("features.offline.title"),
      description: t("features.offline.desc"),
    },
    {
      icon: Languages,
      title: t("features.languages.title"),
      description: t("features.languages.desc"),
    },
  ];

  return (
    <section id="features" className="py-24 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t("features.title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("features.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl bg-card border border-border p-6 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon size={24} className="text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
