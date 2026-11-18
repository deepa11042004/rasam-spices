"use client";

import { useState, useTransition } from "react";
import { upsertManySiteContent } from "@/lib/settings-actions";

export interface ContentField {
  key: string;
  label: string;
  hint?: string;
  rows?: number;
}

interface SiteContentFormProps {
  /** Section heading shown above the form */
  sectionTitle: string;
  /** The editable fields in this section */
  fields: ContentField[];
  /** Current saved values, keyed by content key */
  initialValues: Record<string, string>;
}

export default function SiteContentForm({
  sectionTitle,
  fields,
  initialValues,
}: SiteContentFormProps) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [values, setValues] = useState<Record<string, string>>(initialValues);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const items = fields.map((f) => ({
        key: f.key,
        title: f.label,
        content: values[f.key] ?? "",
      }));
      const result = await upsertManySiteContent(items);
      setFeedback({
        ok: result.ok,
        message: result.ok ? result.message ?? "Saved" : result.message,
      });
    });
  }

  const inputClass =
    "block w-full rounded-md border border-admin-border-strong bg-white px-3 py-2 text-sm shadow-sm placeholder:text-admin-ink-muted/60 focus:border-admin-spice focus:outline-none focus:ring-1 focus:ring-admin-spice/20";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h3 className="text-base font-semibold text-admin-ink">{sectionTitle}</h3>

      {fields.map((field) => (
        <div key={field.key}>
          <label
            htmlFor={`sc-${field.key}`}
            className="mb-1 block text-sm font-medium text-admin-ink"
          >
            {field.label}
          </label>
          <textarea
            id={`sc-${field.key}`}
            value={values[field.key] ?? ""}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
            }
            rows={field.rows ?? 4}
            className={inputClass}
          />
          {field.hint && (
            <p className="mt-1 text-xs text-admin-ink-muted/80">{field.hint}</p>
          )}
        </div>
      ))}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-admin-spice px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-admin-spice-dark disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save Content"}
        </button>
        {feedback && (
          <span className={`text-sm ${feedback.ok ? "text-green-600" : "text-red-600"}`}>
            {feedback.message}
          </span>
        )}
      </div>
    </form>
  );
}
