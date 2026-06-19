"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/card";
import { Car, FolderTree, HelpCircle } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ErrorState, LoadingState } from "../../components/data-state";
import { PageHeader } from "../../components/page-header";
import { ApiError, api } from "../../lib/api";

type Counts = { schools: number; questions: number; categories: number };

const CARDS = [
  {
    key: "schools" as const,
    label: "Driving schools",
    href: "/dashboard/schools",
    icon: Car,
  },
  {
    key: "questions" as const,
    label: "Questions",
    href: "/dashboard/questions",
    icon: HelpCircle,
  },
  {
    key: "categories" as const,
    label: "Categories",
    href: "/dashboard/categories",
    icon: FolderTree,
  },
];

export default function OverviewPage() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [schools, questions, categories] = await Promise.all([
        api.listSchools(),
        api.listQuestions(),
        api.listCategories(),
      ]);
      setCounts({
        schools: schools.length,
        questions: questions.length,
        categories: categories.length,
      });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load overview");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <PageHeader
        title="Overview"
        description="Platform content at a glance"
      />
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : counts ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((c) => {
            const Icon = c.icon;
            return (
              <Link key={c.key} href={c.href} className="group">
                <Card className="transition-shadow group-hover:shadow-md">
                  <CardHeader className="flex-row items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {c.label}
                    </CardTitle>
                    <Icon className="size-5 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <span className="text-3xl font-bold tabular-nums">
                      {counts[c.key]}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : null}
    </>
  );
}
