"use client";

import { useState, useTransition } from "react";
import { upsertSocialLink, deleteSocialLink } from "@/lib/settings-actions";

interface SocialLinkItem {
  id: string;
  platform: string;
  url: string;
  isVisible: boolean;
  sortOrder: number;
}

interface SocialLinksManagerProps {
  initialLinks: SocialLinkItem[];
}

const PLATFORMS = [
  "Facebook",
  "Instagram",
  "Twitter",
  "LinkedIn",
  "YouTube",
  "WhatsApp",
  "Pinterest",
  "Telegram",
];

export default function SocialLinksManager({ initialLinks }: SocialLinksManagerProps) {
  const [links, setLinks] = useState(initialLinks);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  // New link form state
  const [newPlatform, setNewPlatform] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newVisible, setNewVisible] = useState(true);
  const [newOrder, setNewOrder] = useState(0);

  function handleAddLink() {
    if (!newPlatform || !newUrl) {
      setFeedback({ ok: false, message: "Platform and URL are required" });
      return;
    }
    setFeedback(null);
    startTransition(async () => {
      const result = await upsertSocialLink({
        platform: newPlatform,
        url: newUrl,
        isVisible: newVisible,
        sortOrder: newOrder,
      });
      if (result.ok) {
        setFeedback({ ok: true, message: result.message ?? "Added" });
        setShowNew(false);
        setNewPlatform("");
        setNewUrl("");
        setNewVisible(true);
        setNewOrder(0);
        // Reload will get fresh data via server revalidation
        window.location.reload();
      } else {
        setFeedback({ ok: false, message: result.message });
      }
    });
  }

  function handleToggleVisible(link: SocialLinkItem) {
    startTransition(async () => {
      await upsertSocialLink({
        id: link.id,
        platform: link.platform,
        url: link.url,
        isVisible: !link.isVisible,
        sortOrder: link.sortOrder,
      });
      setLinks((prev) =>
        prev.map((l) => (l.id === link.id ? { ...l, isVisible: !l.isVisible } : l)),
      );
    });
  }

  function handleDelete(linkId: string) {
    if (!confirm("Delete this social link?")) return;
    startTransition(async () => {
      const result = await deleteSocialLink(linkId);
      if (result.ok) {
        setLinks((prev) => prev.filter((l) => l.id !== linkId));
      } else {
        setFeedback({ ok: false, message: result.message });
      }
    });
  }

  const inputClass =
    "block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500";

  return (
    <div className="space-y-4">
      {links.length === 0 && !showNew && (
        <p className="text-sm text-neutral-500">No social links configured yet.</p>
      )}

      {/* Existing links */}
      <div className="space-y-2">
        {links.map((link) => (
          <div
            key={link.id}
            className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-neutral-800">{link.platform}</span>
                {!link.isVisible && (
                  <span className="text-xs text-neutral-400">(hidden)</span>
                )}
              </div>
              <p className="truncate text-xs text-neutral-500">{link.url}</p>
              <p className="text-xs text-neutral-400">Order: {link.sortOrder}</p>
            </div>
            <button
              type="button"
              onClick={() => handleToggleVisible(link)}
              disabled={isPending}
              className="text-xs text-neutral-500 hover:text-neutral-700 disabled:opacity-50"
            >
              {link.isVisible ? "Hide" : "Show"}
            </button>
            <button
              type="button"
              onClick={() => handleDelete(link.id)}
              disabled={isPending}
              className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* Add new link form */}
      {showNew ? (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="new-platform" className="mb-1 block text-xs font-medium text-neutral-600">
                Platform
              </label>
              <select id="new-platform" value={newPlatform} onChange={(e) => setNewPlatform(e.target.value)} className={inputClass}>
                <option value="">Select…</option>
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="new-url" className="mb-1 block text-xs font-medium text-neutral-600">
                URL
              </label>
              <input id="new-url" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://…" className={inputClass} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input type="checkbox" checked={newVisible} onChange={(e) => setNewVisible(e.target.checked)} className="rounded border-neutral-300" />
              Visible
            </label>
            <div className="flex items-center gap-2">
              <label htmlFor="new-order" className="text-xs text-neutral-600">Order:</label>
              <input id="new-order" type="number" min={0} value={newOrder} onChange={(e) => setNewOrder(Number(e.target.value))} className="w-16 rounded-md border border-neutral-300 px-2 py-1 text-sm" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleAddLink}
              disabled={isPending}
              className="rounded-md bg-neutral-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
            >
              {isPending ? "Adding…" : "Add Link"}
            </button>
            <button
              type="button"
              onClick={() => setShowNew(false)}
              className="text-sm text-neutral-500 hover:text-neutral-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowNew(true)}
          className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
        >
          + Add Social Link
        </button>
      )}

      {feedback && (
        <p className={`text-sm ${feedback.ok ? "text-green-600" : "text-red-600"}`}>
          {feedback.message}
        </p>
      )}
    </div>
  );
}
