"use client";

export type SubmitState = "idle" | "submitting" | "success" | "error";

/**
 * Shared status banner for the Contact page enquiry forms.
 *
 * The defaults describe a form whose online submission is not wired up yet.
 * Forms that DO submit to the CRM (currently Business Enquiry) override the
 * text via props. The General Enquiry and Sample Request forms still use the
 * defaults, so their behaviour is unchanged.
 */
export default function SubmitStatus({
  state,
  submittingText = "Preparing your enquiry…",
  successTitle = "Your enquiry details are ready.",
  successDetail = "Online submission isn't connected yet, so this enquiry hasn't been sent or stored automatically. Please email or call the RASAM team using the details on this page so your enquiry reaches us — we've kept everything you entered above so you can copy it across.",
  errorText = "Please check the highlighted fields above and try again.",
}: {
  state: SubmitState;
  submittingText?: string;
  successTitle?: string;
  /** Second line under the success title. Pass an empty string to omit it. */
  successDetail?: string;
  errorText?: string;
}) {
  if (state === "idle") return null;

  if (state === "submitting") {
    return (
      <div
        role="status"
        className="flex items-center gap-2.5 rounded-lg border border-turmeric/40 bg-ivory-deep px-4 py-3 text-[15px] text-earth"
      >
        <svg className="h-4 w-4 animate-spin text-turmeric" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
        {submittingText}
      </div>
    );
  }

  if (state === "success") {
    return (
      <div
        role="status"
        className="rounded-lg border border-green/40 bg-green/10 px-4 py-3 text-[15px] text-green"
      >
        <p className="font-semibold">{successTitle}</p>
        {successDetail && <p className="mt-1 text-earth-muted">{successDetail}</p>}
      </div>
    );
  }

  return (
    <div role="alert" className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-[15px] text-red-700">
      {errorText}
    </div>
  );
}
