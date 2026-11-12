import type { Metadata } from "next";
import { Suspense } from "react";
import { company } from "@/data/company";
import ContactFormTabs from "@/components/contact/ContactFormTabs";
import OrnamentDivider from "@/components/OrnamentDivider";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact RASAM Spices for business partnerships, product information or product samples. Phone, email and address in Noida, Uttar Pradesh.",
};

export default function ContactPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-10 -inset-y-14 -z-10 bg-[radial-gradient(65%_90%_at_50%_30%,rgb(140_47_34_/_0.14),transparent_72%)] blur-3xl"
        />
        <div className="mx-auto max-w-4xl px-6 pb-10 pt-14 text-center lg:px-10 lg:pt-20">
          <p className="eyebrow mx-auto justify-center">Let&apos;s Talk</p>
          <h1 className="display-heading mt-4 text-[2.5rem] leading-[1.08] text-earth sm:text-6xl lg:text-7xl">
            Let&apos;s Grow Together.
            <br />
            Let&apos;s Spice Up Every Kitchen.
          </h1>
          <OrnamentDivider className="mx-auto mt-6 text-turmeric" />
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-earth-muted sm:text-xl sm:leading-9">
            Whether you&apos;re exploring a business partnership, curious about a product, or
            just saying hello — we&apos;d love to hear from you.
          </p>
        </div>
      </section>

      <section className="border-t border-turmeric/40 bg-ivory-deep/40">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10 lg:py-20">
          <Suspense fallback={null}>
            <ContactFormTabs />
          </Suspense>
        </div>
      </section>

      <section className="border-t border-turmeric/30">
        <div className="mx-auto max-w-7xl px-6 py-8 text-center lg:px-10">
          <p className="mx-auto max-w-4xl text-[15px] leading-7 text-earth-muted">
            {company.address.lines.join(", ")} ·{" "}
            <a href={company.website.href} className="underline-offset-4 hover:underline">
              {company.website.display}
            </a>{" "}
            · FSSAI Lic. No. {company.fssaiLicence}
          </p>
        </div>
      </section>
    </>
  );
}
