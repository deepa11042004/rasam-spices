"use client";

import { useState } from "react";
import FormField, { inputClass, selectClass, textareaClass } from "./FormField";
import SubmitStatus, { type SubmitState } from "./SubmitStatus";
import { ENQUIRY_TYPES, emptyGeneralEnquiry, type GeneralEnquiryFormData } from "./types";
import { isRequired, isValidEmail, isValidIndianMobile } from "./validation";

type Props = {
  data: GeneralEnquiryFormData;
  onChange: (next: GeneralEnquiryFormData) => void;
};

type Errors = Partial<Record<keyof GeneralEnquiryFormData, string>>;

function validate(data: GeneralEnquiryFormData): Errors {
  const errors: Errors = {};
  if (!isRequired(data.fullName)) errors.fullName = "Enter your full name";
  if (!isValidEmail(data.email)) errors.email = "Enter a valid email address";
  if (!isValidIndianMobile(data.mobileNumber)) {
    errors.mobileNumber = "Enter a valid 10-digit mobile number";
  }
  if (!isRequired(data.enquiryType)) errors.enquiryType = "Select an enquiry type";
  if (!isRequired(data.subject)) errors.subject = "Enter a subject";
  if (!isRequired(data.message)) errors.message = "Enter your message";
  return errors;
}

export default function GeneralEnquiryForm({ data, onChange }: Props) {
  const [errors, setErrors] = useState<Errors>({});
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  function update<K extends keyof GeneralEnquiryFormData>(key: K, value: GeneralEnquiryFormData[K]) {
    onChange({ ...data, [key]: value });
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = validate(data);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setSubmitState("error");
      return;
    }
    setSubmitState("submitting");
    window.setTimeout(() => setSubmitState("success"), 500);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      <div>
        <p className="eyebrow">Quick message</p>
        <h2 className="font-serif mt-2 text-2xl text-earth sm:text-3xl">General enquiry</h2>
        <p className="mt-2 text-base leading-7 text-earth-muted">
          A quick way to ask about a product, pricing, an order or anything else — we&apos;ll
          reply by email or phone.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <FormField label="Full name" htmlFor="ge-fullName" required error={errors.fullName}>
          <input
            id="ge-fullName"
            type="text"
            value={data.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            placeholder="Your full name"
            autoComplete="name"
            className={inputClass}
          />
        </FormField>

        <FormField label="Business / company name" htmlFor="ge-companyName">
          <input
            id="ge-companyName"
            type="text"
            value={data.companyName}
            onChange={(e) => update("companyName", e.target.value)}
            placeholder="Optional"
            autoComplete="organization"
            className={inputClass}
          />
        </FormField>

        <FormField label="Email address" htmlFor="ge-email" required error={errors.email}>
          <input
            id="ge-email"
            type="email"
            value={data.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className={inputClass}
          />
        </FormField>

        <FormField label="Mobile number" htmlFor="ge-mobile" required error={errors.mobileNumber}>
          <input
            id="ge-mobile"
            type="tel"
            value={data.mobileNumber}
            onChange={(e) => update("mobileNumber", e.target.value)}
            placeholder="98765 43210"
            autoComplete="tel"
            className={inputClass}
          />
        </FormField>
      </div>

      <FormField label="Enquiry type" htmlFor="ge-enquiryType" required error={errors.enquiryType}>
        <select
          id="ge-enquiryType"
          value={data.enquiryType}
          onChange={(e) => update("enquiryType", e.target.value as GeneralEnquiryFormData["enquiryType"])}
          className={selectClass}
        >
          <option value="" disabled>
            Select the type of enquiry
          </option>
          {ENQUIRY_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Subject" htmlFor="ge-subject" required error={errors.subject}>
        <input
          id="ge-subject"
          type="text"
          value={data.subject}
          onChange={(e) => update("subject", e.target.value)}
          placeholder="A short summary of your enquiry"
          className={inputClass}
        />
      </FormField>

      <FormField label="Message" htmlFor="ge-message" required error={errors.message}>
        <textarea
          id="ge-message"
          value={data.message}
          onChange={(e) => update("message", e.target.value)}
          placeholder="Tell us more about your enquiry…"
          className={textareaClass}
        />
      </FormField>

      <SubmitStatus state={submitState} />

      <button type="submit" disabled={submitState === "submitting"} className="btn btn-primary w-full !text-base sm:w-auto">
        {submitState === "submitting" ? "Preparing…" : "Send enquiry"}
      </button>
    </form>
  );
}
