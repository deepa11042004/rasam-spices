"use client";

import { useState, useTransition } from "react";
import { updateCompanySettings, type CompanySettingsData } from "@/lib/settings-actions";

interface CompanySettingsFormProps {
  initialData: CompanySettingsData;
}

export default function CompanySettingsForm({ initialData }: CompanySettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const [companyName, setCompanyName] = useState(initialData.companyName);
  const [email, setEmail] = useState(initialData.email);
  const [address, setAddress] = useState(initialData.address);
  const [fssaiNumber, setFssaiNumber] = useState(initialData.fssaiNumber);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const result = await updateCompanySettings({
        companyName,
        email,
        address,
        fssaiNumber,
      });
      setFeedback({ ok: result.ok, message: result.ok ? result.message ?? "Saved" : result.message });
    });
  }

  const inputClass =
    "block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="company-name" className="mb-1 block text-sm font-medium text-neutral-700">
          Company Name
        </label>
        <input id="company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required className={inputClass} />
      </div>

      <div>
        <label htmlFor="company-email" className="mb-1 block text-sm font-medium text-neutral-700">
          Email
        </label>
        <input id="company-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
      </div>

      <div>
        <label htmlFor="company-address" className="mb-1 block text-sm font-medium text-neutral-700">
          Address
        </label>
        <textarea id="company-address" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} className={inputClass} />
      </div>

      <div>
        <label htmlFor="company-fssai" className="mb-1 block text-sm font-medium text-neutral-700">
          FSSAI Number
        </label>
        <input id="company-fssai" value={fssaiNumber} onChange={(e) => setFssaiNumber(e.target.value)} className={inputClass} />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-neutral-800 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-neutral-700 disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save Settings"}
        </button>
        {feedback && (
          <span className={`text-sm ${feedback.ok ? "text-green-600" : "text-red-600"}`}>
            {feedback.message}
          </span>
        )}
      </div>
    </form>
  );
}
