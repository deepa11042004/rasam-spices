import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import CompanySettingsForm from "@/components/admin/CompanySettingsForm";
import SocialLinksManager from "@/components/admin/SocialLinksManager";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const [settings, socialLinks] = await Promise.all([
    prisma.companySettings.findFirst(),
    prisma.socialLink.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-8 border-b border-neutral-200 pb-4">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-neutral-800">
          Settings
        </h1>
        <p className="mt-1 text-sm text-neutral-500">Company information and social links</p>
      </div>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-neutral-700">Company Information</h2>
        <CompanySettingsForm
          initialData={{
            companyName: settings?.companyName ?? "",
            email: settings?.email ?? "",
            address: settings?.address ?? "",
            fssaiNumber: settings?.fssaiNumber ?? "",
          }}
        />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-neutral-700">Social Links</h2>
        <SocialLinksManager
          initialLinks={socialLinks.map((l) => ({
            id: l.id,
            platform: l.platform,
            url: l.url,
            isVisible: l.isVisible,
            sortOrder: l.sortOrder,
          }))}
        />
      </section>
    </div>
  );
}
