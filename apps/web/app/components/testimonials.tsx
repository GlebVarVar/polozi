"use client";

import { Star } from "lucide-react";
import { useLocale } from "../../lib/locale-context";

const ratings = [5, 5, 5, 4, 5, 5];

export function Testimonials() {
  const { t } = useLocale();

  const testimonials = Array.from({ length: 6 }, (_, i) => ({
    name: t(`testimonial.${i + 1}.name`),
    city: t(`testimonial.${i + 1}.city`),
    text: t(`testimonial.${i + 1}.text`),
    rating: ratings[i],
  }));

  return (
    <section id="testimonials" className="py-24 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t("testimonials.title")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("testimonials.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((item) => (
            <div
              key={item.name}
              className="rounded-2xl bg-card border border-border p-6"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={
                      i < item.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted"
                    }
                  />
                ))}
              </div>
              <p className="text-sm leading-relaxed mb-4">{item.text}</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {item.name[0]}
                </div>
                <div>
                  <div className="text-sm font-medium">{item.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.city}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
