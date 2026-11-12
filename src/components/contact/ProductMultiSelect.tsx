"use client";

import { useId, useMemo, useRef, useState } from "react";
import type { Product } from "@/data/products";
import type { QuantityUnit, SelectedProduct } from "./types";
import { isPositiveQuantity } from "./validation";

const UNIT_OPTIONS: QuantityUnit[] = ["kg", "g", "tonnes", "packs"];

type Props = {
  /** Label for this category group, e.g. "Ground Spices". */
  categoryLabel: string;
  /** Products available to pick from this category. */
  availableProducts: Product[];
  /** Currently selected products across ALL categories (quantities live here). */
  selected: SelectedProduct[];
  /** Called with the full updated selection list whenever something changes. */
  onChange: (next: SelectedProduct[]) => void;
  /** Per-product quantity validation errors, keyed by product id (shown after submit attempt). */
  quantityErrors?: Record<string, string>;
  /** Default unit for newly added products in this category. */
  defaultUnit?: QuantityUnit;
};

export default function ProductMultiSelect({
  categoryLabel,
  availableProducts,
  selected,
  onChange,
  quantityErrors,
  defaultUnit = "kg",
}: Props) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputId = useId();
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedIdsInCategory = useMemo(
    () =>
      new Set(
        selected
          .filter((item) => item.category === categoryLabel)
          .map((item) => item.id),
      ),
    [selected, categoryLabel],
  );

  const selectedInCategory = useMemo(
    () => selected.filter((item) => item.category === categoryLabel),
    [selected, categoryLabel],
  );

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return availableProducts.filter((product) => {
      if (selectedIdsInCategory.has(product.id)) return false;
      if (!q) return true;
      return product.name.toLowerCase().includes(q);
    });
  }, [availableProducts, query, selectedIdsInCategory]);

  function addProduct(product: Product) {
    const next: SelectedProduct = {
      id: product.id,
      name: product.name,
      category: categoryLabel,
      quantity: "",
      unit: defaultUnit,
    };
    onChange([...selected, next]);
    setQuery("");
    // Close the panel so the newly selected chip (and its quantity input) is
    // immediately visible instead of staying hidden under the open list.
    setIsOpen(false);
  }

  function removeProduct(id: string) {
    onChange(selected.filter((item) => item.id !== id));
  }

  function updateQuantity(id: string, quantity: string) {
    onChange(
      selected.map((item) => (item.id === id ? { ...item, quantity } : item)),
    );
  }

  function updateUnit(id: string, unit: QuantityUnit) {
    onChange(
      selected.map((item) => (item.id === id ? { ...item, unit } : item)),
    );
  }

  return (
    <div className="space-y-3" ref={containerRef}>
      <div>
        <label htmlFor={inputId} className="block text-sm font-semibold text-earth">
          {categoryLabel}
        </label>
        <div className="relative mt-1.5">
          <input
            id={inputId}
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            aria-autocomplete="list"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onBlur={() => {
              // Delay closing so a click on an option still registers.
              window.setTimeout(() => setIsOpen(false), 150);
            }}
            placeholder={
              availableProducts.length === 0
                ? "No products available in this category yet"
                : `Search ${categoryLabel.toLowerCase()}…`
            }
            disabled={availableProducts.length === 0}
            className="block w-full rounded-lg border border-turmeric/40 bg-ivory px-4 py-2.5 text-base text-earth placeholder:text-earth-muted/50 transition-colors focus:border-turmeric focus:outline-none focus:ring-2 focus:ring-turmeric/30 disabled:cursor-not-allowed disabled:opacity-60"
          />
          {isOpen && availableProducts.length > 0 && (
            <ul
              id={listboxId}
              role="listbox"
              className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-turmeric/40 bg-ivory shadow-card"
            >
              {filteredOptions.length === 0 ? (
                <li className="px-4 py-2.5 text-sm text-earth-muted">
                  {query
                    ? "No matching products"
                    : "All products in this category are selected"}
                </li>
              ) : (
                filteredOptions.map((product) => (
                  <li key={product.id} role="option" aria-selected={false}>
                    <button
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => addProduct(product)}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-earth transition-colors hover:bg-ivory-deep"
                    >
                      {product.name}
                      <span className="text-xs text-turmeric">Add +</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>

      {selectedInCategory.length > 0 && (
        <ul className="space-y-2">
          {selectedInCategory.map((item) => {
            const error = quantityErrors?.[item.id];
            const quantityId = `${inputId}-qty-${item.id}`;
            return (
              <li
                key={item.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-turmeric/30 bg-ivory-deep/60 px-3 py-2"
              >
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green/10 px-3 py-1 text-sm font-medium text-green">
                  {item.name}
                  <button
                    type="button"
                    onClick={() => removeProduct(item.id)}
                    aria-label={`Remove ${item.name}`}
                    className="ml-0.5 rounded-full text-green/70 transition-colors hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-turmeric"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                      <path d="M10 8.586 6.707 5.293 5.293 6.707 8.586 10l-3.293 3.293 1.414 1.414L10 11.414l3.293 3.293 1.414-1.414L11.414 10l3.293-3.293-1.414-1.414L10 8.586Z" />
                    </svg>
                  </button>
                </span>

                <div className="ml-auto flex items-center gap-2">
                  <label htmlFor={quantityId} className="sr-only">
                    Quantity for {item.name}
                  </label>
                  <input
                    id={quantityId}
                    type="number"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    value={item.quantity}
                    onChange={(event) => updateQuantity(item.id, event.target.value)}
                    placeholder="Qty"
                    aria-invalid={error ? "true" : undefined}
                    className={`w-24 rounded-md border bg-ivory px-2.5 py-1.5 text-sm text-earth focus:outline-none focus:ring-2 focus:ring-turmeric/30 ${
                      error ? "border-red-400" : "border-turmeric/40 focus:border-turmeric"
                    }`}
                  />
                  <select
                    aria-label={`Unit for ${item.name}`}
                    value={item.unit}
                    onChange={(event) =>
                      updateUnit(item.id, event.target.value as QuantityUnit)
                    }
                    className="rounded-md border border-turmeric/40 bg-ivory px-2 py-1.5 text-sm text-earth focus:border-turmeric focus:outline-none focus:ring-2 focus:ring-turmeric/30"
                  >
                    {UNIT_OPTIONS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>
                {error && (
                  <p className="w-full text-xs text-red-600" role="alert">
                    {error}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function allQuantitiesValid(products: SelectedProduct[]): boolean {
  return products.every((product) => isPositiveQuantity(product.quantity));
}
