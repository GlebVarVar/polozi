"use client";

import { Star } from "lucide-react";
import { cn } from "./lib/cn";

export interface StarRatingProps {
  value: number;
  /** when set, stars become clickable */
  onChange?: (value: number) => void;
  size?: number;
  className?: string;
}

export function StarRating({
  value,
  onChange,
  size = 18,
  className,
}: StarRatingProps) {
  const interactive = typeof onChange === "function";
  return (
    <div className={cn("inline-flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(value);
        const Icon = (
          <Star
            style={{ width: size, height: size }}
            className={cn(
              filled
                ? "fill-yellow-400 text-yellow-400"
                : "fill-transparent text-muted-foreground/40",
            )}
          />
        );
        return interactive ? (
          <button
            key={star}
            type="button"
            aria-label={`${star}`}
            onClick={() => onChange?.(star)}
            className="transition-transform hover:scale-110"
          >
            {Icon}
          </button>
        ) : (
          <span key={star}>{Icon}</span>
        );
      })}
    </div>
  );
}
