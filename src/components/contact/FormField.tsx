"use client";

import type { ReactNode } from "react";

type Props = {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
};

export default function FormField({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
}: Props) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-[15px] font-semibold leading-6 text-earth"
      >
        {label}
        {required && <span className="ml-0.5 text-red-600">*</span>}
      </label>
      {hint && (
        <p className="mt-0.5 text-sm leading-6 text-earth-muted">{hint}</p>
      )}
      <div className="mt-2">{children}</div>
      {error && (
        <p className="mt-1.5 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/* Shared input class for consistent styling */
export const inputClass =
  "block w-full rounded-lg border border-turmeric/40 bg-ivory px-4 py-3 text-base text-earth placeholder:text-earth-muted/70 transition-colors focus:border-turmeric focus:outline-none focus:ring-2 focus:ring-turmeric/30";

export const selectClass =
  "block w-full rounded-lg border border-turmeric/40 bg-ivory px-4 py-3 text-base text-earth transition-colors focus:border-turmeric focus:outline-none focus:ring-2 focus:ring-turmeric/30 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236b5e4f%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.22%208.22a.75.75%200%20011.06%200L10%2011.94l3.72-3.72a.75.75%200%20111.06%201.06l-4.25%204.25a.75.75%200%2001-1.06%200L5.22%209.28a.75.75%200%20010-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10";

export const textareaClass =
  "block w-full rounded-lg border border-turmeric/40 bg-ivory px-4 py-3 text-base text-earth placeholder:text-earth-muted/70 transition-colors focus:border-turmeric focus:outline-none focus:ring-2 focus:ring-turmeric/30 resize-y min-h-[110px]";
