"use client";

import type { SelectedProduct } from "./types";

type Row = { label: string; value: string };

type Props = {
  title?: string;
  rows: Row[];
  selectedProducts?: SelectedProduct[];
};

/**
 * Read-only summary shown before final submission for the Business Enquiry
 * and Sample Request forms, so customers can double-check everything
 * (including per-product quantities) before sending.
 */
export default function FormReviewSummary({ title = "Review your enquiry", rows, selectedProducts }: Props) {
  return (
    <div className="rounded-card border border-turmeric/40 bg-ivory-deep/70 p-5 sm:p-6">
      <h3 className="font-serif text-xl text-earth">{title}</h3>
      <dl className="mt-4 space-y-2.5">
        {rows
          .filter((row) => row.value.trim().length > 0)
          .map((row) => (
            <div key={row.label} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
              <dt className="min-w-40 text-sm font-semibold text-earth">{row.label}</dt>
              <dd className="text-sm text-earth-muted">{row.value}</dd>
            </div>
          ))}
      </dl>

      {selectedProducts && selectedProducts.length > 0 && (
        <div className="mt-4 border-t border-turmeric/25 pt-4">
          <p className="text-sm font-semibold text-earth">Selected products</p>
          <ul className="mt-2 space-y-1.5">
            {selectedProducts.map((product) => (
              <li
                key={product.id}
                className="flex items-center justify-between text-sm text-earth-muted"
              >
                <span>{product.name}</span>
                <span className="font-medium text-earth">
                  {product.quantity || "—"} {product.unit}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
