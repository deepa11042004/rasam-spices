"use client";

import { useTransition } from "react";
import { toggleProductVisibility, toggleProductFeatured } from "@/lib/product-actions";

interface ProductToggleProps {
  productId: string;
  field: "visibility" | "featured";
  checked: boolean;
}

export default function ProductToggle({ productId, field, checked }: ProductToggleProps) {
  const [isPending, startTransition] = useTransition();

  function handleChange() {
    startTransition(async () => {
      if (field === "visibility") {
        await toggleProductVisibility(productId, !checked);
      } else {
        await toggleProductFeatured(productId, !checked);
      }
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={field === "visibility" ? "Toggle visibility" : "Toggle featured"}
      onClick={handleChange}
      disabled={isPending}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 disabled:opacity-50 ${
        checked ? "bg-neutral-800" : "bg-neutral-300"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-[18px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}
