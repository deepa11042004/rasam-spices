"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ProductFormData, ActionResult } from "@/lib/product-constants";
import { PACK_SIZE_OPTIONS } from "@/lib/product-constants";
import { discardDishImage, uploadDishImage } from "@/lib/dish-image-actions";

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
  /**
   * Name of the homepage platter dish this product is paired with, or null if
   * it isn't on the platter. Only the six products listed in src/data/dishes.ts
   * display a dish image publicly, so the field says plainly whether an upload
   * here will actually be visible.
   */
  platterDishName?: string | null;
}

/** Parse a JSON string of string[] into a Set, or return an empty Set. */
function parsePackSizes(json: string | undefined): Set<string> {
  if (!json) return new Set();
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) return new Set(parsed.filter((s: unknown) => typeof s === "string" && s));
  } catch { /* ignore */ }
  return new Set();
}

export default function ProductForm({
  mode,
  initialData = {},
  onSubmit,
  onDelete,
  platterDishName = null,
}: ProductFormProps) {
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

  // Optional dish image. Holds a stored reference such as "/media/dishes/x.webp",
  // or "" when the product has no dish image.
  const [dishPhotoSrc, setDishPhotoSrc] = useState(initialData.dishPhotoSrc ?? "");
  const [dishUploading, setDishUploading] = useState(false);
  const [dishError, setDishError] = useState<string | null>(null);
  const dishFileInputRef = useRef<HTMLInputElement>(null);

  /** The reference this form started with, so we only delete files we replaced. */
  const originalDishPhotoSrc = useRef(initialData.dishPhotoSrc ?? "");

  async function handleDishFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Let the same file be picked again after a remove.
    event.target.value = "";
    if (!file) return;

    setDishError(null);
    setDishUploading(true);

    try {
      const body = new FormData();
      body.append("file", file);
      const result = await uploadDishImage(body);

      if (!result.ok) {
        setDishError(result.message);
        return;
      }

      // Replacing an upload made earlier in this same editing session: the
      // previous file is now unreferenced, so clean it up immediately.
      if (dishPhotoSrc && dishPhotoSrc !== originalDishPhotoSrc.current) {
        void discardDishImage(dishPhotoSrc);
      }

      setDishPhotoSrc(result.ref);
    } catch {
      setDishError("Could not upload the image. Please try again.");
    } finally {
      setDishUploading(false);
    }
  }

  function handleDishRemove() {
    // Discard only a file uploaded during this session. An image that was
    // already saved is cleaned up by the server when the product is saved,
    // so the current record keeps working until then.
    if (dishPhotoSrc && dishPhotoSrc !== originalDishPhotoSrc.current) {
      void discardDishImage(dishPhotoSrc);
    }
    setDishPhotoSrc("");
    setDishError(null);
  }
  const [selectedPackSizes, setSelectedPackSizes] = useState<Set<string>>(
    () => parsePackSizes(initialData.packSizes),
  );
  const [customSize, setCustomSize] = useState("");
  const [packFormat, setPackFormat] = useState(initialData.packFormat ?? "");
  const [pendingNote, setPendingNote] = useState(initialData.pendingNote ?? "");
  const [isVisible, setIsVisible] = useState(initialData.isVisible ?? true);
  const [isFeatured, setIsFeatured] = useState(initialData.isFeatured ?? false);

  function togglePackSize(size: string) {
    setSelectedPackSizes((prev) => {
      const next = new Set(prev);
      if (next.has(size)) next.delete(size);
      else next.add(size);
      return next;
    });
  }

  function addCustomSize() {
    const trimmed = customSize.trim();
    if (trimmed && !selectedPackSizes.has(trimmed)) {
      setSelectedPackSizes((prev) => new Set(prev).add(trimmed));
    }
    setCustomSize("");
  }

  function removePackSize(size: string) {
    setSelectedPackSizes((prev) => {
      const next = new Set(prev);
      next.delete(size);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const packSizesArray = Array.from(selectedPackSizes);
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
        dishPhotoSrc,
        packSizes: JSON.stringify(packSizesArray),
        packFormat,
        pendingNote,
        isVisible,
        isFeatured,
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

      {/* Dish Image — optional photo of the prepared dish, shown on the public
          dish platter. Distinct from the packaging images above. */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-neutral-700">Dish Image</legend>
        <p className="text-xs text-neutral-500">
          Optional. A photo of the prepared dish for this product. This is not
          the packaging photo — it replaces the plate image on the homepage dish
          platter. Leave empty to keep the existing default image.
        </p>

        {/* Only the six products paired with a platter dish can show this
            publicly, so say which one — or that this product is not on the
            platter, rather than letting an upload silently do nothing. */}
        {mode === "edit" && (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            Appears in the Products page showcase when a visitor opens this
            product&apos;s expanded card.
            {platterDishName ? (
              <>
                {" "}
                Also shown on the homepage dish platter as{" "}
                <span className="font-semibold">{platterDishName}</span>.
              </>
            ) : (
              " This product is not on the homepage dish platter, so it will not appear there."
            )}
          </p>
        )}

        {dishPhotoSrc ? (
          <div className="flex flex-wrap items-start gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={dishPhotoSrc}
              alt="Dish image preview"
              className="h-32 w-32 rounded-md border border-neutral-200 object-cover"
            />
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => dishFileInputRef.current?.click()}
                disabled={dishUploading}
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
              >
                {dishUploading ? "Uploading…" : "Replace image"}
              </button>
              <button
                type="button"
                onClick={handleDishRemove}
                disabled={dishUploading}
                className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Remove image
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => dishFileInputRef.current?.click()}
            disabled={dishUploading}
            className="rounded-md border border-dashed border-neutral-300 px-4 py-3 text-sm font-medium text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
          >
            {dishUploading ? "Uploading…" : "Choose dish image…"}
          </button>
        )}

        <input
          ref={dishFileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={(event) => {
            void handleDishFileChange(event);
          }}
          className="hidden"
        />

        {dishError && (
          <p className="text-sm text-red-600" role="alert">
            {dishError}
          </p>
        )}
      </fieldset>

      {/* Packaging */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-neutral-700">Packaging</legend>
        <div>
          <label htmlFor="product-pack-format" className="mb-1 block text-sm font-medium text-neutral-700">Pack Format</label>
          <select id="product-pack-format" value={packFormat} onChange={(e) => setPackFormat(e.target.value)} className={inputClass}>
            {PACK_FORMATS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium text-neutral-700">Pack Sizes</span>

          {/* Standard size options */}
          <div className="flex flex-wrap gap-2">
            {PACK_SIZE_OPTIONS.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => togglePackSize(size)}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  selectedPackSizes.has(size)
                    ? "border-neutral-800 bg-neutral-800 text-white"
                    : "border-neutral-300 bg-white text-neutral-600 hover:border-neutral-400"
                }`}
              >
                {size}
              </button>
            ))}
          </div>

          {/* Custom size input */}
          <div className="mt-3 flex gap-2">
            <input
              value={customSize}
              onChange={(e) => setCustomSize(e.target.value)}
              placeholder="Custom size, e.g. 750 g"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomSize(); } }}
              className={`${inputClass} max-w-[200px]`}
            />
            <button
              type="button"
              onClick={addCustomSize}
              disabled={!customSize.trim()}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 disabled:opacity-40"
            >
              Add
            </button>
          </div>

          {/* Selected sizes display */}
          {selectedPackSizes.size > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {Array.from(selectedPackSizes).map((size) => (
                <span
                  key={size}
                  className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2.5 py-1 text-sm text-neutral-700"
                >
                  {size}
                  <button
                    type="button"
                    onClick={() => removePackSize(size)}
                    className="ml-0.5 text-neutral-400 hover:text-neutral-700"
                    aria-label={`Remove ${size}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
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
              {category.replace(/-/g, " ")} · {isVisible ? "Visible" : "Hidden"} · {isFeatured ? "Featured" : "Not featured"}
            </p>
            {selectedPackSizes.size > 0 && (
              <p className="mt-1 text-xs text-neutral-400">Sizes: {Array.from(selectedPackSizes).join(", ")}</p>
            )}
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
