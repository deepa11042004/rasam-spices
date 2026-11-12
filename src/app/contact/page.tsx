import type { Metadata } from "next";
import { company } from "@/data/company";
import ContactFormTabs from "@/components/contact/ContactFormTabs";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact RASAM Spices for business partnerships, product information or product samples. Phone, email and address in Noida, Uttar Pradesh.",
};

export default function ContactPage() {
  return (
    <>
      <section>
        <div className="mx-auto max-w-3xl px-6 pb-10 pt-14 text-center lg:px-10 lg:pt-20">
          <p className="eyebrow mx-auto justify-center">Get in touch</p>
          <h1 className="display-heading mt-4 text-5xl text-earth sm:text-7xl">Contact us</h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-earth-muted">
            Reach out to RASAM Spices for business partnerships, product information or to
            request product samples.
          </p>
        </div>
      </section>

      <section className="border-t border-turmeric/40 bg-ivory-deep/40">
        <div className="mx-auto max-w-4xl px-6 py-14 lg:px-10 lg:py-20">
          <ContactFormTabs />
        </div>
      </section>

      <section className="border-t border-turmeric/30">
        <div className="mx-auto max-w-4xl px-6 py-10 text-center lg:px-10">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-base">
            <a
              href={`mailto:${company.email}`}
              className="font-medium text-spice underline-offset-4 hover:underline"
            >
              {company.email}
            </a>
            <a
              href={company.phone.href}
              className="font-medium text-spice underline-offset-4 hover:underline"
            >
              {company.phone.display}
            </a>
          </div>
          <p className="mt-4 text-sm leading-6 text-earth-muted">
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
