"use client";

import { useState, useTransition } from "react";
import type { ActionResult } from "@/lib/enquiry-constants";
import { ENQUIRY_STATUSES } from "@/lib/enquiry-constants";

// ---------------------------------------------------------------------------
// Status selector
// ---------------------------------------------------------------------------

interface StatusSelectProps {
  currentStatus: string;
  onUpdate: (id: string, status: string) => Promise<ActionResult>;
  enquiryId: string;
}

export function StatusSelect({ currentStatus, onUpdate, enquiryId }: StatusSelectProps) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    if (newStatus === currentStatus) return;
    setFeedback(null);
    startTransition(async () => {
      const result = await onUpdate(enquiryId, newStatus);
      if (!result.ok) setFeedback(result.message);
    });
  }

  return (
    <div>
      <label htmlFor={`status-${enquiryId}`} className="sr-only">
        Update status
      </label>
      <select
        id={`status-${enquiryId}`}
        defaultValue={currentStatus}
        onChange={handleChange}
        disabled={isPending}
        className="rounded-md border border-admin-border-strong bg-white px-2 py-1 text-sm shadow-sm focus:border-admin-spice focus:outline-none focus:ring-1 focus:ring-admin-spice/20 disabled:opacity-50"
      >
        {ENQUIRY_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      {feedback && <p className="mt-1 text-xs text-red-600">{feedback}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Notes editor
// ---------------------------------------------------------------------------

interface NotesEditorProps {
  currentNotes: string | null;
  onSave: (id: string, notes: string) => Promise<ActionResult>;
  enquiryId: string;
}

export function NotesEditor({ currentNotes, onSave, enquiryId }: NotesEditorProps) {
  const [value, setValue] = useState(currentNotes ?? "");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  function handleSave() {
    setFeedback(null);
    startTransition(async () => {
      const result = await onSave(enquiryId, value);
      if (result.ok) {
        setFeedback({ ok: true, message: result.message ?? "Saved" });
      } else {
        setFeedback({ ok: false, message: result.message });
      }
    });
  }

  return (
    <div className="space-y-2">
      <label htmlFor={`notes-${enquiryId}`} className="block text-sm font-medium text-admin-ink">
        Admin Notes
      </label>
      <textarea
        id={`notes-${enquiryId}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={4}
        maxLength={5000}
        className="block w-full rounded-md border border-admin-border-strong bg-white px-3 py-2 text-sm shadow-sm placeholder:text-admin-ink-muted/60 focus:border-admin-spice focus:outline-none focus:ring-1 focus:ring-admin-spice/20"
        placeholder="Internal notes (not visible to the enquirer)"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-md bg-admin-spice px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-admin-spice-dark focus:outline-none focus:ring-2 focus:ring-admin-spice/20 focus:ring-offset-2 disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save Notes"}
        </button>
        {feedback && (
          <span className={`text-xs ${feedback.ok ? "text-green-600" : "text-red-600"}`}>
            {feedback.message}
          </span>
        )}
      </div>
    </div>
  );
}
