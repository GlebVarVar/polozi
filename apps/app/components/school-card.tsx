"use client";

import { Card, CardContent } from "@repo/ui/card";
import { ChevronRight, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "../lib/format";
import type { School } from "../lib/types";

export function SchoolCard({ school }: { school: School }) {
  return (
    <Link
      href={`/schools?id=${encodeURIComponent(school.id)}`}
      className="group block"
    >
      <Card className="transition-colors group-hover:border-primary/50 group-hover:bg-accent">
        <CardContent className="flex items-start gap-4 p-5">
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="font-semibold leading-tight">{school.name}</p>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">
                {school.city}, {school.address}
              </span>
            </p>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Phone className="size-3.5 shrink-0" />
              {school.phone}
            </p>
            <p className="pt-0.5 text-sm font-medium text-primary">
              {formatPrice(school.priceFrom, school.priceTo)}
            </p>
          </div>
          <ChevronRight className="mt-1 size-5 shrink-0 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}
