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
    "block w-full rounded-md border border-admin-border-strong bg-white px-3 py-2 text-sm shadow-sm placeholder:text-admin-ink-muted/60 focus:border-admin-spice focus:outline-none focus:ring-1 focus:ring-admin-spice/20";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ---- Core Information ---- */}
      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold uppercase tracking-wide text-admin-ink-muted">
          Core Information
        </legend>

        <div>
          <label htmlFor="company-name" className="mb-1 block text-sm font-medium text-admin-ink">
            Company Name
          </label>
          <input id="company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required className={inputClass} />
        </div>

        <div>
          <label htmlFor="brand-line" className="mb-1 block text-sm font-medium text-admin-ink">
            Brand Line / Tagline
          </label>
          <input id="brand-line" value={brandLine} onChange={(e) => setBrandLine(e.target.value)} placeholder="e.g. Swad Aisa Rasamo Jaisa" className={inputClass} />
          <p className="mt-1 text-xs text-admin-ink-muted/80">Appears on the homepage hero and branding.</p>
        </div>

        <div>
          <label htmlFor="launch-date" className="mb-1 block text-sm font-medium text-admin-ink">
            Launch Date
          </label>
          <input id="launch-date" value={launchDate} onChange={(e) => setLaunchDate(e.target.value)} placeholder="e.g. 11 October 2025" className={inputClass} />
          <p className="mt-1 text-xs text-admin-ink-muted/80">Displayed in the homepage about section.</p>
        </div>

        <div>
          <label htmlFor="company-fssai" className="mb-1 block text-sm font-medium text-admin-ink">
            FSSAI Licence Number
          </label>
          <input id="company-fssai" value={fssaiNumber} onChange={(e) => setFssaiNumber(e.target.value)} className={inputClass} />
        </div>
      </fieldset>

      {/* ---- Contact Details ---- */}
      <fieldset className="space-y-4 border-t border-admin-border pt-6">
        <legend className="text-sm font-semibold uppercase tracking-wide text-admin-ink-muted">
          Contact Details
        </legend>

        <div>
          <label htmlFor="company-email" className="mb-1 block text-sm font-medium text-admin-ink">
            Email
          </label>
          <input id="company-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="phone-display" className="mb-1 block text-sm font-medium text-admin-ink">
              Phone (display)
            </label>
            <input id="phone-display" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 99581 68136" className={inputClass} />
          </div>
          <div>
            <label htmlFor="phone-href" className="mb-1 block text-sm font-medium text-admin-ink">
              Phone (link)
            </label>
            <input id="phone-href" value={phoneHref} onChange={(e) => setPhoneHref(e.target.value)} placeholder="tel:+919958168136" className={inputClass} />
            <p className="mt-1 text-xs text-admin-ink-muted/80">The tel: URI used for click-to-call.</p>
          </div>
        </div>

        <div>
          <label htmlFor="company-address" className="mb-1 block text-sm font-medium text-admin-ink">
            Address
          </label>
          <textarea id="company-address" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} className={inputClass} placeholder="One line per row" />
          <p className="mt-1 text-xs text-admin-ink-muted/80">Each line break creates a separate line on the site.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="website-display" className="mb-1 block text-sm font-medium text-admin-ink">
              Website (display)
            </label>
            <input id="website-display" value={websiteDisplay} onChange={(e) => setWebsiteDisplay(e.target.value)} placeholder="rasamfoods.com" className={inputClass} />
          </div>
          <div>
            <label htmlFor="website-href" className="mb-1 block text-sm font-medium text-admin-ink">
              Website (URL)
            </label>
            <input id="website-href" value={websiteHref} onChange={(e) => setWebsiteHref(e.target.value)} placeholder="https://rasamfoods.com" className={inputClass} />
          </div>
        </div>
      </fieldset>

      {/* ---- SEO & Footer ---- */}
      <fieldset className="space-y-4 border-t border-admin-border pt-6">
        <legend className="text-sm font-semibold uppercase tracking-wide text-admin-ink-muted">
          SEO & Footer
        </legend>

        <div>
          <label htmlFor="site-description" className="mb-1 block text-sm font-medium text-admin-ink">
            Site Meta Description
          </label>
          <textarea id="site-description" value={siteDescription} onChange={(e) => setSiteDescription(e.target.value)} rows={3} className={inputClass} />
          <p className="mt-1 text-xs text-admin-ink-muted/80">Default description shown in search engine results. Keep under 160 characters.</p>
        </div>

        <div>
          <label htmlFor="footer-tagline" className="mb-1 block text-sm font-medium text-admin-ink">
            Footer Tagline
          </label>
          <textarea id="footer-tagline" value={footerTagline} onChange={(e) => setFooterTagline(e.target.value)} rows={3} className={inputClass} />
          <p className="mt-1 text-xs text-admin-ink-muted/80">Short paragraph shown in the footer&apos;s brand column.</p>
        </div>
      </fieldset>

      <div className="flex items-center gap-3 border-t border-admin-border pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-admin-spice px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-admin-spice-dark disabled:opacity-50"
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
