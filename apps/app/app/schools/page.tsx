"use client";

import { Card, CardContent } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { cn } from "@repo/ui/lib/cn";
import { StarRating } from "@repo/ui/star-rating";
import {
  ExternalLink,
  Map as MapIcon,
  MapPin,
  Phone,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { AppShell } from "../../components/app-shell";
import { ReviewForm } from "../../components/review-form";
import { SchoolCard } from "../../components/school-card";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
} from "../../components/states";
import { api } from "../../lib/api";
import { formatDate, formatPrice } from "../../lib/format";
import { useSettings } from "../../lib/settings";
import { useAsync } from "../../lib/use-async";

function SchoolDetailView({ id }: { id: string }) {
  const { t, settings } = useSettings();
  const { data, loading, error, reload } = useAsync(() => api.school(id), [id]);

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState onRetry={reload} />;

  return (
    <div className="space-y-6">
      <Link
        href="/schools"
        className="inline-flex text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        {t("common.back")}
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{data.name}</h1>
        <div className="mt-2 flex items-center gap-2">
          <StarRating value={data.averageRating} />
          <span className="text-sm text-muted-foreground">
            {data.averageRating.toFixed(1)} ({data.reviewCount})
          </span>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-3 p-5 text-sm">
          <p className="flex items-center gap-2.5">
            <MapPin className="size-4 shrink-0 text-muted-foreground" />
            {data.city}, {data.address}
          </p>
          <p className="flex items-center gap-2.5">
            <Phone className="size-4 shrink-0 text-muted-foreground" />
            <a href={`tel:${data.phone}`} className="hover:text-primary">
              {data.phone}
            </a>
          </p>
          <p className="font-medium text-primary">
            {formatPrice(data.priceFrom, data.priceTo)}
          </p>
          <div className="flex flex-wrap gap-4 pt-1">
            {data.website ? (
              <a
                href={data.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
              >
                <ExternalLink className="size-4" />
                {t("schools.website")}
              </a>
            ) : null}
            {data.googleMapsURL ? (
              <a
                href={data.googleMapsURL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
              >
                <MapIcon className="size-4" />
                {t("schools.map")}
              </a>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{t("schools.reviews")}</h2>
        {data.reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("schools.noReviews")}
          </p>
        ) : (
          <div className="space-y-3">
            {data.reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="space-y-1.5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{review.authorName}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(
                        Date.parse(review.createdAt),
                        settings.language,
                      )}
                    </span>
                  </div>
                  <StarRating value={review.rating} size={14} />
                  {review.comment ? (
                    <p className="text-sm text-muted-foreground">
                      {review.comment}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{t("schools.addReview")}</h2>
        <Card>
          <CardContent className="p-5">
            <ReviewForm schoolId={id} onSubmitted={reload} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function SchoolsList() {
  const { t } = useSettings();
  const [city, setCity] = useState("");
  const [query, setQuery] = useState("");

  const citiesState = useAsync(() => api.cities(), []);
  const schoolsState = useAsync(() => api.schools(), []);

  const filtered = useMemo(() => {
    const all = schoolsState.data ?? [];
    const q = query.trim().toLowerCase();
    return all.filter((s) => {
      if (city && s.city !== city) return false;
      if (
        q &&
        !s.name.toLowerCase().includes(q) &&
        !s.address.toLowerCase().includes(q) &&
        !s.city.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [schoolsState.data, city, query]);

  return (
    <>
      <PageHeader title={t("schools.title")} subtitle={t("schools.subtitle")} />

      <div className="mb-5 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("schools.search")}
            className="pl-9"
          />
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {[
            { value: "", label: t("schools.allCities") },
            ...(citiesState.data ?? []).map((c) => ({ value: c, label: c })),
          ].map((opt) => {
            const active = city === opt.value;
            return (
              <button
                key={opt.value || "all"}
                type="button"
                onClick={() => setCity(opt.value)}
                aria-pressed={active}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {schoolsState.loading ? (
        <LoadingState />
      ) : schoolsState.error ? (
        <ErrorState onRetry={schoolsState.reload} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Search className="size-7" />}
          title={t("schools.empty")}
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((school) => (
            <SchoolCard key={school.id} school={school} />
          ))}
        </div>
      )}
    </>
  );
}

function SchoolsInner() {
  const params = useSearchParams();
  const id = params.get("id");
  return id ? <SchoolDetailView id={id} /> : <SchoolsList />;
}

export default function SchoolsPage() {
  return (
    <AppShell>
      <Suspense fallback={<LoadingState />}>
        <SchoolsInner />
      </Suspense>
    </AppShell>
  );
}
