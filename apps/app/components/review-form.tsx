"use client";

import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { StarRating } from "@repo/ui/star-rating";
import { Textarea } from "@repo/ui/textarea";
import { useState } from "react";
import { api } from "../lib/api";
import { useSettings } from "../lib/settings";

export function ReviewForm({
  schoolId,
  onSubmitted,
}: {
  schoolId: string;
  onSubmitted: () => void;
}) {
  const { t } = useSettings();
  const [rating, setRating] = useState(0);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  const valid = rating > 0 && name.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(false);
    try {
      await api.addReview(schoolId, {
        rating,
        comment: comment.trim(),
        authorName: name.trim(),
      });
      setRating(0);
      setName("");
      setComment("");
      onSubmitted();
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>{t("schools.rating")}</Label>
        <StarRating value={rating} onChange={setRating} size={28} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="review-name">{t("schools.name")}</Label>
        <Input
          id="review-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("schools.namePlaceholder")}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="review-comment">{t("schools.comment")}</Label>
        <Textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("schools.commentPlaceholder")}
        />
      </div>
      {error ? (
        <p className="text-sm text-destructive">{t("common.error")}</p>
      ) : null}
      <Button type="submit" disabled={!valid || submitting}>
        {t("schools.send")}
      </Button>
    </form>
  );
}
