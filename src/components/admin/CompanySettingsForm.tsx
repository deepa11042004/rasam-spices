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
  const [phone, setPhone] = useState(initialData.phone);
  const [phoneHref, setPhoneHref] = useState(initialData.phoneHref);
  const [brandLine, setBrandLine] = useState(initialData.brandLine);
  const [launchDate, setLaunchDate] = useState(initialData.launchDate);
  const [websiteDisplay, setWebsiteDisplay] = useState(initialData.websiteDisplay);
  const [websiteHref, setWebsiteHref] = useState(initialData.websiteHref);
  const [siteDescription, setSiteDescription] = useState(initialData.siteDescription);
  const [footerTagline, setFooterTagline] = useState(initialData.footerTagline);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const result = await updateCompanySettings({
        companyName,
        email,
        address,
        fssaiNumber,
        phone,
        phoneHref,
        brandLine,
        launchDate,
        websiteDisplay,
        websiteHref,
        siteDescription,
        footerTagline,
      });
      setFeedback({ ok: result.ok, message: result.ok ? result.message ?? "Saved" : result.message });
    });
  }

  const inputClass =
    "block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ---- Core Information ---- */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Core Information
        </legend>

        <div>
          <label htmlFor="company-name" className="mb-1 block text-sm font-medium text-neutral-700">
            Company Name
          </label>
          <input id="company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required className={inputClass} />
        </div>

        <div>
          <label htmlFor="brand-line" className="mb-1 block text-sm font-medium text-neutral-700">
            Brand Line / Tagline
          </label>
          <input id="brand-line" value={brandLine} onChange={(e) => setBrandLine(e.target.value)} placeholder="e.g. Swad Aisa Rasamo Jaisa" className={inputClass} />
          <p className="mt-1 text-xs text-neutral-400">Appears on the homepage hero and branding.</p>
        </div>

        <div>
          <label htmlFor="launch-date" className="mb-1 block text-sm font-medium text-neutral-700">
            Launch Date
          </label>
          <input id="launch-date" value={launchDate} onChange={(e) => setLaunchDate(e.target.value)} placeholder="e.g. 11 October 2025" className={inputClass} />
          <p className="mt-1 text-xs text-neutral-400">Displayed in the homepage about section.</p>
        </div>

        <div>
          <label htmlFor="company-fssai" className="mb-1 block text-sm font-medium text-neutral-700">
            FSSAI Licence Number
          </label>
          <input id="company-fssai" value={fssaiNumber} onChange={(e) => setFssaiNumber(e.target.value)} className={inputClass} />
        </div>
      </fieldset>

      {/* ---- Contact Details ---- */}
      <fieldset className="space-y-4 border-t border-neutral-200 pt-6">
        <legend className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Contact Details
        </legend>

        <div>
          <label htmlFor="company-email" className="mb-1 block text-sm font-medium text-neutral-700">
            Email
          </label>
          <input id="company-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="phone-display" className="mb-1 block text-sm font-medium text-neutral-700">
              Phone (display)
            </label>
            <input id="phone-display" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 99581 68136" className={inputClass} />
          </div>
          <div>
            <label htmlFor="phone-href" className="mb-1 block text-sm font-medium text-neutral-700">
              Phone (link)
            </label>
            <input id="phone-href" value={phoneHref} onChange={(e) => setPhoneHref(e.target.value)} placeholder="tel:+919958168136" className={inputClass} />
            <p className="mt-1 text-xs text-neutral-400">The tel: URI used for click-to-call.</p>
          </div>
        </div>

        <div>
          <label htmlFor="company-address" className="mb-1 block text-sm font-medium text-neutral-700">
            Address
          </label>
          <textarea id="company-address" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} className={inputClass} placeholder="One line per row" />
          <p className="mt-1 text-xs text-neutral-400">Each line break creates a separate line on the site.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="website-display" className="mb-1 block text-sm font-medium text-neutral-700">
              Website (display)
            </label>
            <input id="website-display" value={websiteDisplay} onChange={(e) => setWebsiteDisplay(e.target.value)} placeholder="rasamfoods.com" className={inputClass} />
          </div>
          <div>
            <label htmlFor="website-href" className="mb-1 block text-sm font-medium text-neutral-700">
              Website (URL)
            </label>
            <input id="website-href" value={websiteHref} onChange={(e) => setWebsiteHref(e.target.value)} placeholder="https://rasamfoods.com" className={inputClass} />
          </div>
        </div>
      </fieldset>

      {/* ---- SEO & Footer ---- */}
      <fieldset className="space-y-4 border-t border-neutral-200 pt-6">
        <legend className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          SEO & Footer
        </legend>

        <div>
          <label htmlFor="site-description" className="mb-1 block text-sm font-medium text-neutral-700">
            Site Meta Description
          </label>
          <textarea id="site-description" value={siteDescription} onChange={(e) => setSiteDescription(e.target.value)} rows={3} className={inputClass} />
          <p className="mt-1 text-xs text-neutral-400">Default description shown in search engine results. Keep under 160 characters.</p>
        </div>

        <div>
          <label htmlFor="footer-tagline" className="mb-1 block text-sm font-medium text-neutral-700">
            Footer Tagline
          </label>
          <textarea id="footer-tagline" value={footerTagline} onChange={(e) => setFooterTagline(e.target.value)} rows={3} className={inputClass} />
          <p className="mt-1 text-xs text-neutral-400">Short paragraph shown in the footer&apos;s brand column.</p>
        </div>
      </fieldset>

      <div className="flex items-center gap-3 border-t border-neutral-200 pt-4">
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
