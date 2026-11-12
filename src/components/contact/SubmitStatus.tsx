"use client";

export type SubmitState = "idle" | "submitting" | "success" | "error";

export default function SubmitStatus({ state }: { state: SubmitState }) {
  if (state === "idle") return null;

  if (state === "submitting") {
    return (
      <div
        role="status"
        className="flex items-center gap-2.5 rounded-lg border border-turmeric/40 bg-ivory-deep px-4 py-3 text-sm text-earth"
      >
        <svg className="h-4 w-4 animate-spin text-turmeric" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
        Preparing your enquiry…
      </div>
    );
  }

  if (state === "success") {
    return (
      <div
        role="status"
        className="rounded-lg border border-green/40 bg-green/10 px-4 py-3 text-sm text-green"
      >
        <p className="font-semibold">Your enquiry details are ready.</p>
        <p className="mt-1 text-earth-muted">
          Online submission isn&apos;t connected yet, so this enquiry hasn&apos;t been sent or
          stored automatically. Please email or call the RASAM team using the details on this
          page so your enquiry reaches us — we&apos;ve kept everything you entered above so you
          can copy it across.
        </p>
      </div>
    );
  }

  return (
    <div role="alert" className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
      Please check the highlighted fields above and try again.
    </div>
  );
}
