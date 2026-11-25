"use client";

import { getCategory, getProductsByCategory, type CategoryId } from "@/data/products";
import ProductMultiSelect from "./ProductMultiSelect";
import type { SelectedProduct } from "./types";

// Same display order used on the /products page: Ground Spices, Individual
// Spices & Seasonings, Blended Masalas.
const CATEGORY_ORDER: CategoryId[] = ["ground-spices", "spices-seasonings", "blended-masalas"];

type Props = {
  selected: SelectedProduct[];
  onChange: (next: SelectedProduct[]) => void;
  quantityErrors?: Record<string, string>;
};

/**
 * Renders one searchable ProductMultiSelect per inventory category
 * (Ground Spices, Individual Spices & Seasonings, Blended Masalas),
 * sharing a single `selected` list across all three so products from
 * different categories can be combined in one enquiry.
 */
export default function ProductSelectionGroup({
  selected,
  onChange,
  quantityErrors,
}: Props) {
  return (
    <div className="space-y-5">
      {CATEGORY_ORDER.map((categoryId) => {
        const category = getCategory(categoryId);
        return (
          <ProductMultiSelect
            key={category.id}
            categoryLabel={category.name}
            availableProducts={getProductsByCategory(category.id)}
            selected={selected}
            onChange={onChange}
            quantityErrors={quantityErrors}
          />
        );
      })}
    </div>
  );
}
