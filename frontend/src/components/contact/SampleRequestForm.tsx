"use client";

import { useState } from "react";
import FormField, { inputClass, selectClass, textareaClass } from "./FormField";
import FormReviewSummary from "./FormReviewSummary";
import ProductSelectionGroup from "./ProductSelectionGroup";
import SubmitStatus, { type SubmitState } from "./SubmitStatus";
import { CUSTOMER_TYPES, type SampleRequestFormData } from "./types";
import {
  isRequired,
  isValidEmail,
  isValidIndianMobile,
  isValidPinCode,
  validateSelectedProductQuantities,
} from "./validation";
import { submitSampleRequest } from "@/lib/enquiry-actions";

const SUCCESS_TITLE = "Your sample request has been submitted successfully.";
const SUCCESS_DETAIL =
  "Our team will contact you shortly. Thank you for your interest in RASAM!";

type Props = {
  data: SampleRequestFormData;
  onChange: (next: SampleRequestFormData) => void;
};

type FieldErrors = Partial<
  Record<Exclude<keyof SampleRequestFormData, "selectedProducts" | "message">, string>
>;

function validateFields(data: SampleRequestFormData): FieldErrors {
  const errors: FieldErrors = {};
  if (!isRequired(data.fullName)) errors.fullName = "Enter your full name";
  if (!isValidEmail(data.email)) errors.email = "Enter a valid email address";
  if (!isValidIndianMobile(data.mobileNumber)) {
    errors.mobileNumber = "Enter a valid 10-digit mobile number";
  }
  if (!isRequired(data.customerType)) errors.customerType = "Select a customer type";
  if (!isRequired(data.address)) errors.address = "Enter your full delivery address";
  if (!isRequired(data.city)) errors.city = "Enter your city";
  if (!isRequired(data.state)) errors.state = "Enter your state";
  if (!isValidPinCode(data.pinCode)) errors.pinCode = "Enter a valid 6-digit PIN code";
  if (!isRequired(data.country)) errors.country = "Enter your country";
  return errors;
}

export default function SampleRequestForm({ data, onChange }: Props) {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [quantityErrors, setQuantityErrors] = useState<Record<string, string>>({});
  const [productsTouchedError, setProductsTouchedError] = useState<string | undefined>();
  const [showReview, setShowReview] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  /** Message from a failed server submission; undefined falls back to the
   *  default "check the highlighted fields" text. */
  const [submitError, setSubmitError] = useState<string | undefined>();

  function update<K extends keyof SampleRequestFormData>(key: K, value: SampleRequestFormData[K]) {
    onChange({ ...data, [key]: value });
  }

  function runValidation(): boolean {
    const nextFieldErrors = validateFields(data);
    const nextQuantityErrors = validateSelectedProductQuantities(data.selectedProducts);
    setFieldErrors(nextFieldErrors);
    setQuantityErrors(nextQuantityErrors);
    setProductsTouchedError(
      data.selectedProducts.length === 0
        ? "Select at least one product you'd like a sample of"
        : undefined,
    );
    return (
      Object.keys(nextFieldErrors).length === 0 &&
      Object.keys(nextQuantityErrors).length === 0 &&
      data.selectedProducts.length > 0
    );
  }

  function handleReview(event: React.FormEvent) {
    event.preventDefault();
    const ok = runValidation();
    if (ok) {
      setShowReview(true);
      setSubmitState("idle");
    } else {
      setSubmitState("error");
    }
  }

  async function handleConfirm() {
    // Guard against duplicate submissions: ignore repeat clicks while a
    // request is in flight, and once the request has already been stored.
    if (submitState === "submitting" || submitState === "success") return;

    setSubmitState("submitting");
    setSubmitError(undefined);

    const result = await submitSampleRequest(data);

    if (result.ok) {
      // Success is shown only after the database confirms the write.
      setSubmitState("success");
    } else {
      // Entered values are left untouched so nothing is lost on failure.
      setSubmitError(result.message);
      setSubmitState("error");
    }
  }

  const reviewRows = [
    { label: "Full name", value: data.fullName },
    { label: "Business / company name", value: data.companyName },
    { label: "Email", value: data.email },
    { label: "Mobile number", value: data.mobileNumber },
    { label: "Customer type", value: data.customerType },
    {
      label: "Delivery address",
      value: [data.address, data.city, data.state, data.pinCode, data.country]
        .filter(Boolean)
        .join(", "),
    },
    { label: "Message", value: data.message },
  ];

  if (showReview) {
    return (
      <div className="space-y-6">
        <div>
          <p className="eyebrow">Review &amp; confirm</p>
          <h2 className="font-serif mt-2 text-2xl text-earth sm:text-3xl">Review your sample request</h2>
          <p className="mt-2 text-base leading-7 text-earth-muted">
            Please check the details below before sending. Sample availability and delivery are
            subject to RASAM&apos;s confirmation.
          </p>
        </div>

        <FormReviewSummary rows={reviewRows} selectedProducts={data.selectedProducts} />

        <SubmitStatus
          state={submitState}
          submittingText="Submitting your request…"
          successTitle={SUCCESS_TITLE}
          successDetail={SUCCESS_DETAIL}
          errorText={submitError}
        />

        <div className="flex flex-wrap gap-3">
          {submitState !== "success" && (
            <>
              <button
                type="button"
                onClick={() => {
                  setShowReview(false);
                  setSubmitState("idle");
                  setSubmitError(undefined);
                }}
                disabled={submitState === "submitting"}
                className="btn btn-ghost-dark"
              >
                Edit details
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleConfirm();
                }}
                disabled={submitState === "submitting"}
                className="btn btn-primary"
              >
                {submitState === "submitting"
                  ? "Submitting…"
                  : submitState === "error"
                    ? "Try again"
                    : "Confirm & send request"}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleReview} noValidate className="space-y-10">
      <div>
        <p className="eyebrow">Try before you order</p>
        <h2 className="font-serif mt-2 text-2xl text-earth sm:text-3xl">Sample request</h2>
        <p className="mt-2 text-base leading-7 text-earth-muted">
          Request samples of RASAM products. Sample availability and delivery are subject to our
          confirmation.
        </p>
      </div>

      <section>
        <h3 className="font-serif text-xl text-earth sm:text-[22px]">
          Your information
        </h3>
        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          <FormField label="Full name" htmlFor="sr-fullName" required error={fieldErrors.fullName}>
            <input
              id="sr-fullName"
              type="text"
              value={data.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              placeholder="Your full name"
              autoComplete="name"
              className={inputClass}
            />
          </FormField>

          <FormField label="Business / company name" htmlFor="sr-companyName">
            <input
              id="sr-companyName"
              type="text"
              value={data.companyName}
              onChange={(e) => update("companyName", e.target.value)}
              placeholder="Optional"
              autoComplete="organization"
              className={inputClass}
            />
          </FormField>

          <FormField label="Email address" htmlFor="sr-email" required error={fieldErrors.email}>
            <input
              id="sr-email"
              type="email"
              value={data.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className={inputClass}
            />
          </FormField>

          <FormField label="Mobile number" htmlFor="sr-mobile" required error={fieldErrors.mobileNumber}>
            <input
              id="sr-mobile"
              type="tel"
              value={data.mobileNumber}
              onChange={(e) => update("mobileNumber", e.target.value)}
              placeholder="98765 43210"
              autoComplete="tel"
              className={inputClass}
            />
          </FormField>

          <FormField label="Customer type" htmlFor="sr-customerType" required error={fieldErrors.customerType}>
            <select
              id="sr-customerType"
              value={data.customerType}
              onChange={(e) => update("customerType", e.target.value as SampleRequestFormData["customerType"])}
              className={selectClass}
            >
              <option value="" disabled>
                Select customer type
              </option>
              {CUSTOMER_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </section>

      <section>
        <h3 className="font-serif text-xl text-earth sm:text-[22px]">
          Products you&apos;d like samples of
        </h3>
        <p className="mt-2 text-[15px] leading-6 text-earth-muted">
          Search and select products across the three categories below, then enter the sample
          quantity you&apos;d like for each one.
        </p>
        <div className="mt-4">
          <ProductSelectionGroup
            selected={data.selectedProducts}
            onChange={(next) => update("selectedProducts", next)}
            quantityErrors={quantityErrors}
          />
        </div>
        {productsTouchedError && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {productsTouchedError}
          </p>
        )}
      </section>

      <section>
        <h3 className="font-serif text-xl text-earth sm:text-[22px]">
          Delivery information
        </h3>
        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField label="Full delivery address" htmlFor="sr-address" required error={fieldErrors.address}>
              <input
                id="sr-address"
                type="text"
                value={data.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="House/flat, street, locality"
                autoComplete="street-address"
                className={inputClass}
              />
            </FormField>
          </div>

          <FormField label="City" htmlFor="sr-city" required error={fieldErrors.city}>
            <input
              id="sr-city"
              type="text"
              value={data.city}
              onChange={(e) => update("city", e.target.value)}
              autoComplete="address-level2"
              className={inputClass}
            />
          </FormField>

          <FormField label="State" htmlFor="sr-state" required error={fieldErrors.state}>
            <input
              id="sr-state"
              type="text"
              value={data.state}
              onChange={(e) => update("state", e.target.value)}
              autoComplete="address-level1"
              className={inputClass}
            />
          </FormField>

          <FormField label="PIN code" htmlFor="sr-pinCode" required error={fieldErrors.pinCode}>
            <input
              id="sr-pinCode"
              type="text"
              inputMode="numeric"
              value={data.pinCode}
              onChange={(e) => update("pinCode", e.target.value)}
              placeholder="201301"
              autoComplete="postal-code"
              className={inputClass}
            />
          </FormField>

          <FormField label="Country" htmlFor="sr-country" required error={fieldErrors.country}>
            <input
              id="sr-country"
              type="text"
              value={data.country}
              onChange={(e) => update("country", e.target.value)}
              autoComplete="country-name"
              className={inputClass}
            />
          </FormField>
        </div>
      </section>

      <FormField label="Message / special requirements" htmlFor="sr-message">
        <textarea
          id="sr-message"
          value={data.message}
          onChange={(e) => update("message", e.target.value)}
          placeholder="Let us know if you have any specific sample requirements or questions."
          className={textareaClass}
        />
      </FormField>

      <SubmitStatus state={submitState} />

      <button type="submit" className="btn btn-primary w-full !text-base sm:w-auto">
        Review request
      </button>
    </form>
  );
}
