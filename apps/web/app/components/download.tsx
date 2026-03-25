"use client";

import { Smartphone, CheckCircle } from "lucide-react";
import { useLocale } from "../../lib/locale-context";

export function Download() {
  const { t } = useLocale();

  const benefits = [
    t("download.benefit1"),
    t("download.benefit2"),
    t("download.benefit3"),
    t("download.benefit4"),
  ];

  return (
    <section id="download" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-br from-primary to-primary/80 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 px-8 py-16 sm:px-16 sm:py-20 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 mb-6">
              <Smartphone size={32} className="text-white" />
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              {t("download.title")}
            </h2>
            <p className="text-lg text-white/80 max-w-xl mx-auto mb-8">
              {t("download.subtitle")}
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-10">
              {benefits.map((b) => (
                <div
                  key={b}
                  className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm text-white"
                >
                  <CheckCircle size={14} />
                  {b}
                </div>
              ))}
            </div>

            <a
              href="#"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-8 py-4 text-lg font-semibold text-primary hover:bg-white/90 transition-colors shadow-lg"
            >
              <svg
                className="w-6 h-6 mr-3"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 21.99 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 21.99C7.78997 22.03 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
              </svg>
              {t("download.appStore")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
