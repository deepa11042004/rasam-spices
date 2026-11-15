"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ProductFormData, ActionResult } from "@/lib/product-constants";

const CATEGORIES = [
  { value: "ground-spices", label: "Ground Spices" },
  { value: "blended-masalas", label: "Blended Masalas" },
  { value: "spices-seasonings", label: "Spices & Seasonings" },
];

const PACK_FORMATS = [
  { value: "", label: "— None —" },
  { value: "Box", label: "Box" },
  { value: "Pouch", label: "Pouch" },
];

interface ProductFormProps {
  mode: "create" | "edit";
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<ActionResult>;
  onDelete?: (id: string) => Promise<ActionResult>;
}

export default function ProductForm({ mode, initialData = {}, onSubmit, onDelete }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Form state
  const [id, setId] = useState(initialData.id ?? "");
  const [name, setName] = useState(initialData.name ?? "");
  const [category, setCategory] = useState(initialData.category ?? "ground-spices");
  const [description, setDescription] = useState(initialData.description ?? "");
  const [tagline, setTagline] = useState(initialData.tagline ?? "");
  const [imageSrc, setImageSrc] = useState(initialData.imageSrc ?? "");
  const [imageAlt, setImageAlt] = useState(initialData.imageAlt ?? "");
  const [backImageSrc, setBackImageSrc] = useState(initialData.backImageSrc ?? "");
  const [backImageAlt, setBackImageAlt] = useState(initialData.backImageAlt ?? "");
  const [packSizesStr, setPackSizesStr] = useState(
    initialData.packSizes ?? "[]",
  );
  const [packFormat, setPackFormat] = useState(initialData.packFormat ?? "");
  const [pendingNote, setPendingNote] = useState(initialData.pendingNote ?? "");
  const [isVisible, setIsVisible] = useState(initialData.isVisible ?? true);
  const [isFeatured, setIsFeatured] = useState(initialData.isFeatured ?? false);
  const [sortOrder, setSortOrder] = useState(initialData.sortOrder ?? 0);
  const [dishPhotoSrc, setDishPhotoSrc] = useState(initialData.dishPhotoSrc ?? "");
  const [dishPhotoAlt, setDishPhotoAlt] = useState(initialData.dishPhotoAlt ?? "");
  const [dishPhotoFocus, setDishPhotoFocus] = useState(initialData.dishPhotoFocus ?? "");
  const [dishPhotoZoom, setDishPhotoZoom] = useState(initialData.dishPhotoZoom ?? 0);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const result = await onSubmit({
        id,
        name,
        category,
        description,
        tagline,
        imageSrc,
        imageAlt,
        backImageSrc,
        backImageAlt,
        packSizes: packSizesStr,
        packFormat,
        pendingNote,
        isVisible,
        isFeatured,
        sortOrder,
        dishPhotoSrc,
        dishPhotoAlt,
        dishPhotoFocus,
        dishPhotoZoom,
      });
      if (result.ok) {
        setFeedback({ ok: true, message: result.message ?? "Saved" });
        if (mode === "create") {
          router.push("/admin/products");
        }
      } else {
        setFeedback({ ok: false, message: result.message });
      }
    });
  }

  function handleDelete() {
    if (!onDelete) return;
    startTransition(async () => {
      const result = await onDelete(id);
      if (result.ok) {
        router.push("/admin/products");
      } else {
        setFeedback({ ok: false, message: result.message });
      }
    });
  }

  const inputClass =
    "block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic info */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-neutral-700">Basic Information</legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="product-id" className="mb-1 block text-sm font-medium text-neutral-700">
              Product ID
            </label>
            <input
              id="product-id"
              value={id}
              onChange={(e) => setId(e.target.value)}
              disabled={mode === "edit"}
              required
              pattern="[a-z0-9-]+"
              maxLength={100}
              placeholder="e.g. turmeric-powder"
              className={`${inputClass} ${mode === "edit" ? "bg-neutral-100" : ""}`}
            />
          </div>
          <div>
            <label htmlFor="product-name" className="mb-1 block text-sm font-medium text-neutral-700">
              Name
            </label>
            <input id="product-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={200} className={inputClass} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="product-category" className="mb-1 block text-sm font-medium text-neutral-700">
              Category
            </label>
            <select id="product-category" value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="product-sort" className="mb-1 block text-sm font-medium text-neutral-700">
              Sort Order
            </label>
            <input id="product-sort" type="number" min={0} value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className={inputClass} />
          </div>
        </div>

        <div>
          <label htmlFor="product-tagline" className="mb-1 block text-sm font-medium text-neutral-700">Tagline</label>
          <input id="product-tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={500} className={inputClass} />
        </div>

        <div>
          <label htmlFor="product-description" className="mb-1 block text-sm font-medium text-neutral-700">Description</label>
          <textarea id="product-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={5000} className={inputClass} />
        </div>
      </fieldset>

      {/* Images */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-neutral-700">Images</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="product-img" className="mb-1 block text-sm font-medium text-neutral-700">Front Image Path</label>
            <input id="product-img" value={imageSrc} onChange={(e) => setImageSrc(e.target.value)} placeholder="/images/products/example.webp" className={inputClass} />
          </div>
          <div>
            <label htmlFor="product-img-alt" className="mb-1 block text-sm font-medium text-neutral-700">Front Image Alt</label>
            <input id="product-img-alt" value={imageAlt} onChange={(e) => setImageAlt(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="product-back-img" className="mb-1 block text-sm font-medium text-neutral-700">Back Image Path</label>
            <input id="product-back-img" value={backImageSrc} onChange={(e) => setBackImageSrc(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="product-back-img-alt" className="mb-1 block text-sm font-medium text-neutral-700">Back Image Alt</label>
            <input id="product-back-img-alt" value={backImageAlt} onChange={(e) => setBackImageAlt(e.target.value)} className={inputClass} />
          </div>
        </div>
      </fieldset>

      {/* Packaging */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-neutral-700">Packaging</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="product-pack-format" className="mb-1 block text-sm font-medium text-neutral-700">Pack Format</label>
            <select id="product-pack-format" value={packFormat} onChange={(e) => setPackFormat(e.target.value)} className={inputClass}>
              {PACK_FORMATS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="product-pack-sizes" className="mb-1 block text-sm font-medium text-neutral-700">
              Pack Sizes (JSON array)
            </label>
            <input
              id="product-pack-sizes"
              value={packSizesStr}
              onChange={(e) => setPackSizesStr(e.target.value)}
              placeholder='["100g", "200g", "500g"]'
              className={inputClass}
            />
          </div>
        </div>
      </fieldset>

      {/* Visibility */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-neutral-700">Visibility & Status</legend>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" checked={isVisible} onChange={(e) => setIsVisible(e.target.checked)} className="rounded border-neutral-300" />
            Visible on website
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="rounded border-neutral-300" />
            Featured on homepage
          </label>
        </div>
        <div>
          <label htmlFor="product-pending" className="mb-1 block text-sm font-medium text-neutral-700">Pending Note (internal)</label>
          <input id="product-pending" value={pendingNote} onChange={(e) => setPendingNote(e.target.value)} maxLength={2000} className={inputClass} />
        </div>
      </fieldset>

      {/* Dish photo */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-neutral-700">Dish Photo (Platter)</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="dish-photo-src" className="mb-1 block text-sm font-medium text-neutral-700">Dish Photo Path</label>
            <input id="dish-photo-src" value={dishPhotoSrc} onChange={(e) => setDishPhotoSrc(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="dish-photo-alt" className="mb-1 block text-sm font-medium text-neutral-700">Dish Photo Alt</label>
            <input id="dish-photo-alt" value={dishPhotoAlt} onChange={(e) => setDishPhotoAlt(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="dish-photo-focus" className="mb-1 block text-sm font-medium text-neutral-700">Focus Point</label>
            <input id="dish-photo-focus" value={dishPhotoFocus} onChange={(e) => setDishPhotoFocus(e.target.value)} placeholder="e.g. center top" className={inputClass} />
          </div>
          <div>
            <label htmlFor="dish-photo-zoom" className="mb-1 block text-sm font-medium text-neutral-700">Zoom Level</label>
            <input id="dish-photo-zoom" type="number" step="0.1" min={0} value={dishPhotoZoom || ""} onChange={(e) => setDishPhotoZoom(Number(e.target.value))} className={inputClass} />
          </div>
        </div>
      </fieldset>

      {/* Preview */}
      <div>
        <button type="button" onClick={() => setShowPreview(!showPreview)} className="text-sm font-medium text-neutral-600 hover:text-neutral-900 underline">
          {showPreview ? "Hide Preview" : "Show Preview"}
        </button>
        {showPreview && (
          <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            <h3 className="font-medium text-neutral-800">{name || "Untitled Product"}</h3>
            {tagline && <p className="text-sm italic text-neutral-500">{tagline}</p>}
            <p className="mt-1 text-xs text-neutral-400">
              {category.replace(/-/g, " ")} · Sort #{sortOrder} · {isVisible ? "Visible" : "Hidden"} · {isFeatured ? "Featured" : "Not featured"}
            </p>
            {description && <p className="mt-2 text-sm text-neutral-600">{description}</p>}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 border-t border-neutral-200 pt-6">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-neutral-800 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-neutral-700 disabled:opacity-50"
        >
          {isPending ? "Saving…" : mode === "create" ? "Create Product" : "Save Changes"}
        </button>

        {feedback && (
          <span className={`text-sm ${feedback.ok ? "text-green-600" : "text-red-600"}`}>
            {feedback.message}
          </span>
        )}

        {mode === "edit" && onDelete && (
          <div className="ml-auto">
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-600">Delete permanently?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Confirm Delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-sm text-red-500 hover:text-red-700"
              >
                Delete Product
              </button>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
