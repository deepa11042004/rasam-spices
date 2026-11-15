"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTransition, useState, useCallback } from "react";

interface FilterOption {
  value: string;
  label: string;
}

interface SearchFilterProps {
  searchValue?: string;
  searchPlaceholder?: string;
  filters?: {
    name: string;
    label: string;
    options: FilterOption[];
    value?: string;
  }[];
}

export default function SearchFilter({
  searchValue = "",
  searchPlaceholder = "Search…",
  filters = [],
}: SearchFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [localSearch, setLocalSearch] = useState(searchValue);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(window.location.search);
      for (const [key, val] of Object.entries(updates)) {
        if (val) {
          params.set(key, val);
        } else {
          params.delete(key);
        }
      }
      params.delete("page"); // reset to page 1 on filter change
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname],
  );

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateParams({ q: localSearch.trim() });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <form onSubmit={handleSearchSubmit} className="flex flex-1 gap-2">
        <input
          type="search"
          name="q"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="flex-1 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm shadow-sm placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-neutral-800 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-neutral-700 disabled:opacity-50"
        >
          Search
        </button>
      </form>
      {filters.map((filter) => (
        <div key={filter.name} className="flex items-center gap-2">
          <label htmlFor={`filter-${filter.name}`} className="text-sm text-neutral-600 whitespace-nowrap">
            {filter.label}:
          </label>
          <select
            id={`filter-${filter.name}`}
            value={filter.value ?? ""}
            onChange={(e) => updateParams({ [filter.name]: e.target.value })}
            className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm shadow-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
          >
            <option value="">All</option>
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
