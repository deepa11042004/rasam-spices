"use client";

import { useState } from "react";
import FormField, { inputClass, selectClass, textareaClass } from "./FormField";
import FormReviewSummary from "./FormReviewSummary";
import ProductSelectionGroup from "./ProductSelectionGroup";
import SubmitStatus, { type SubmitState } from "./SubmitStatus";
import { BUSINESS_TYPES, type BusinessEnquiryFormData } from "./types";
import {
  isRequired,
  isValidEmail,
  isValidIndianMobile,
  validateSelectedProductQuantities,
} from "./validation";
import { submitBusinessEnquiry } from "@/lib/enquiry-actions";

const SUCCESS_TITLE = "Your business enquiry has been submitted successfully.";
const SUCCESS_DETAIL =
  "Our team will contact you shortly. Thank you for your interest in RASAM!";

type Props = {
  data: BusinessEnquiryFormData;
  onChange: (next: BusinessEnquiryFormData) => void;
};

type FieldErrors = Partial<
  Record<Exclude<keyof BusinessEnquiryFormData, "selectedProducts" | "message">, string>
>;

function validateFields(data: BusinessEnquiryFormData): FieldErrors {
  const errors: FieldErrors = {};
  if (!isRequired(data.contactPerson)) errors.contactPerson = "Enter the contact person's name";
  if (!isRequired(data.businessName)) errors.businessName = "Enter your business name";
  if (!isValidEmail(data.businessEmail)) errors.businessEmail = "Enter a valid business email";
  if (!isValidIndianMobile(data.mobileNumber)) {
    errors.mobileNumber = "Enter a valid 10-digit mobile number";
  }
  if (!isRequired(data.businessType)) errors.businessType = "Select a business type";
  if (!isRequired(data.businessLocation)) errors.businessLocation = "Enter your business location";
  return errors;
}

export default function BusinessEnquiryForm({ data, onChange }: Props) {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [quantityErrors, setQuantityErrors] = useState<Record<string, string>>({});
  const [productsTouchedError, setProductsTouchedError] = useState<string | undefined>();
  const [showReview, setShowReview] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  /** Message from a failed server submission; undefined falls back to the
   *  default "check the highlighted fields" text. */
  const [submitError, setSubmitError] = useState<string | undefined>();

  function update<K extends keyof BusinessEnquiryFormData>(
    key: K,
    value: BusinessEnquiryFormData[K],
  ) {
    onChange({ ...data, [key]: value });
  }

  function runValidation(): boolean {
    const nextFieldErrors = validateFields(data);
    const nextQuantityErrors = validateSelectedProductQuantities(data.selectedProducts);
    setFieldErrors(nextFieldErrors);
    setQuantityErrors(nextQuantityErrors);
    setProductsTouchedError(
      data.selectedProducts.length === 0
        ? "Select at least one product you're interested in"
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
    // request is in flight, and once the enquiry has already been stored.
    if (submitState === "submitting" || submitState === "success") return;

    setSubmitState("submitting");
    setSubmitError(undefined);

    const result = await submitBusinessEnquiry(data);

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
    { label: "Contact person", value: data.contactPerson },
    { label: "Business name", value: data.businessName },
    { label: "Business email", value: data.businessEmail },
    { label: "Mobile number", value: data.mobileNumber },
    { label: "Business type", value: data.businessType },
    { label: "Business location", value: data.businessLocation },
    { label: "Website", value: data.website },
    { label: "GSTIN", value: data.gstin },
    { label: "Additional requirements", value: data.message },
  ];

  if (showReview) {
    return (
      <div className="space-y-6">
        <div>
          <p className="eyebrow">Review &amp; confirm</p>
          <h2 className="font-serif mt-2 text-2xl text-earth sm:text-3xl">Review your business enquiry</h2>
          <p className="mt-2 text-base leading-7 text-earth-muted">
            Please check the details below before sending.
          </p>
        </div>

        <FormReviewSummary rows={reviewRows} selectedProducts={data.selectedProducts} />

        <SubmitStatus
          state={submitState}
          submittingText="Submitting your enquiry…"
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
                    : "Confirm & send enquiry"}
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
        <p className="eyebrow">For retailers &amp; distributors</p>
        <h2 className="font-serif mt-2 text-2xl text-earth sm:text-3xl">Business enquiry</h2>
        <p className="mt-2 text-base leading-7 text-earth-muted">
          For distributors, wholesalers, retailers, restaurants, hotels, supermarkets and export
          buyers interested in sourcing RASAM products.
        </p>
      </div>

      <section>
        <h3 className="font-serif text-xl text-earth sm:text-[22px]">
          Business information
        </h3>
        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          <FormField label="Contact person name" htmlFor="be-contactPerson" required error={fieldErrors.contactPerson}>
            <input
              id="be-contactPerson"
              type="text"
              value={data.contactPerson}
              onChange={(e) => update("contactPerson", e.target.value)}
              placeholder="Full name"
              autoComplete="name"
              className={inputClass}
            />
          </FormField>

          <FormField label="Business / company name" htmlFor="be-businessName" required error={fieldErrors.businessName}>
            <input
              id="be-businessName"
              type="text"
              value={data.businessName}
              onChange={(e) => update("businessName", e.target.value)}
              placeholder="Your business name"
              autoComplete="organization"
              className={inputClass}
            />
          </FormField>

          <FormField label="Business email" htmlFor="be-businessEmail" required error={fieldErrors.businessEmail}>
            <input
              id="be-businessEmail"
              type="email"
              value={data.businessEmail}
              onChange={(e) => update("businessEmail", e.target.value)}
              placeholder="business@example.com"
              autoComplete="email"
              className={inputClass}
            />
          </FormField>

          <FormField label="Mobile number" htmlFor="be-mobile" required error={fieldErrors.mobileNumber}>
            <input
              id="be-mobile"
              type="tel"
              value={data.mobileNumber}
              onChange={(e) => update("mobileNumber", e.target.value)}
              placeholder="98765 43210"
              autoComplete="tel"
              className={inputClass}
            />
          </FormField>

          <FormField label="Business type" htmlFor="be-businessType" required error={fieldErrors.businessType}>
            <select
              id="be-businessType"
              value={data.businessType}
              onChange={(e) => update("businessType", e.target.value as BusinessEnquiryFormData["businessType"])}
              className={selectClass}
            >
              <option value="" disabled>
                Select business type
              </option>
              {BUSINESS_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Business location" htmlFor="be-location" required error={fieldErrors.businessLocation}>
            <input
              id="be-location"
              type="text"
              value={data.businessLocation}
              onChange={(e) => update("businessLocation", e.target.value)}
              placeholder="City, state"
              className={inputClass}
            />
          </FormField>

          <FormField label="Website" htmlFor="be-website">
            <input
              id="be-website"
              type="url"
              value={data.website}
              onChange={(e) => update("website", e.target.value)}
              placeholder="Optional"
              autoComplete="url"
              className={inputClass}
            />
          </FormField>

          <FormField label="GSTIN" htmlFor="be-gstin">
            <input
              id="be-gstin"
              type="text"
              value={data.gstin}
              onChange={(e) => update("gstin", e.target.value)}
              placeholder="Optional"
              className={inputClass}
            />
          </FormField>
        </div>
      </section>

      <section>
        <h3 className="font-serif text-xl text-earth sm:text-[22px]">
          Products you&apos;re interested in
        </h3>
        <p className="mt-2 text-[15px] leading-6 text-earth-muted">
          Search and select any products across the three categories below, then enter the
          quantity you&apos;re interested in for each one.
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

      <FormField label="Additional business requirements" htmlFor="be-message">
        <textarea
          id="be-message"
          value={data.message}
          onChange={(e) => update("message", e.target.value)}
          placeholder="Tell us about your sourcing requirements, expected volumes, distribution interests or any other business requirements…"
          className={textareaClass}
        />
      </FormField>

      <SubmitStatus state={submitState} />

      <button type="submit" className="btn btn-primary w-full !text-base sm:w-auto">
        Review enquiry
      </button>
    </form>
  );
}
