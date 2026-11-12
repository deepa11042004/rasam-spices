"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import BusinessEnquiryForm from "./BusinessEnquiryForm";
import GeneralEnquiryForm from "./GeneralEnquiryForm";
import SampleRequestForm from "./SampleRequestForm";
import {
  emptyBusinessEnquiry,
  emptyGeneralEnquiry,
  emptySampleRequest,
  type BusinessEnquiryFormData,
  type GeneralEnquiryFormData,
  type SampleRequestFormData,
  type SelectedProduct,
} from "./types";
import { getCategory, getProduct } from "@/data/products";
import { company } from "@/data/company";

type TabId = "business" | "general" | "sample";

const ENQUIRY_OPTIONS: { id: TabId; label: string; description: string }[] = [
  {
    id: "business",
    label: "Business Enquiry",
    description:
      "For retailers, distributors, wholesalers, restaurants, hotels and other business partners.",
  },
  {
    id: "sample",
    label: "Sample Request",
    description: "For visitors interested in requesting samples of RASAM products.",
  },
  {
    id: "general",
    label: "General Enquiry",
    description: "For general questions, feedback and individual customer enquiries.",
  },
];

/** A thin colour accent along the top of the form card (and the dot beside its
 * matching option on the right) echoes whichever entry point is active, so
 * switching forms reads as a deliberate shift rather than the same box
 * relabelling itself. */
function accentColorFor(tab: TabId): string {
  if (tab === "business") return "var(--brand-spice)";
  if (tab === "sample") return "var(--brand-indigo)";
  return "var(--brand-turmeric)";
}

/**
 * CTAs sitewide link here as `/contact?form=business` (or `sample` /
 * `general`), optionally with `&product=<id>` when they came from a specific
 * product, so a customer lands straight on the matching form -- with that
 * product already selected -- instead of starting from scratch. `enquiry=`
 * is read too, as an alias, so any older link using the previous param name
 * still resolves correctly. Otherwise Business Enquiry is the default.
 */
function readInitialTab(searchParams: URLSearchParams): TabId {
  const requested = searchParams.get("form") ?? searchParams.get("enquiry");
  return requested === "business" || requested === "sample" || requested === "general"
    ? requested
    : "business";
}

function readInitialSelection(searchParams: URLSearchParams): SelectedProduct[] {
  const productId = searchParams.get("product");
  if (!productId) return [];
  const product = getProduct(productId);
  if (!product) return [];
  return [
    {
      id: product.id,
      name: product.name,
      category: getCategory(product.category).name,
      quantity: "",
      unit: "kg",
    },
  ];
}

export default function ContactFormTabs() {
  const searchParams = useSearchParams();
  const initialTab = readInitialTab(searchParams);
  const cameFromDeepLink = searchParams.get("form") !== null || searchParams.get("enquiry") !== null;
  // A stable string to depend on: useSearchParams() can return a new object
  // reference on re-render even when the query string itself hasn't changed.
  const searchKey = searchParams.toString();

  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const idBase = useId();
  const sectionRef = useRef<HTMLDivElement>(null);

  // Each form keeps its own independent state here, so switching between
  // them never loses what the customer has already entered elsewhere.
  const [businessData, setBusinessData] = useState<BusinessEnquiryFormData>(() => ({
    ...emptyBusinessEnquiry,
    selectedProducts: initialTab === "business" ? readInitialSelection(searchParams) : [],
  }));
  const [generalData, setGeneralData] = useState<GeneralEnquiryFormData>(emptyGeneralEnquiry);
  const [sampleData, setSampleData] = useState<SampleRequestFormData>(() => ({
    ...emptySampleRequest,
    selectedProducts: initialTab === "sample" ? readInitialSelection(searchParams) : [],
  }));

  // Arriving already deep-linked from a product page should feel the same as
  // picking that option by hand -- bring the two-column section into view,
  // once, on load. A plain /contact visit needs no scroll: Business Enquiry
  // is already the default, right where the page opens.
  useEffect(() => {
    if (cameFromDeepLink) {
      sectionRef.current?.scrollIntoView({ block: "start" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keeps the selected tab in sync with the URL itself -- so a direct link,
  // a refresh, or using the browser's back/forward between two differently
  // deep-linked visits to this page all land on the right form, not just the
  // very first render of this component.
  useEffect(() => {
    setActiveTab(readInitialTab(searchParams));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKey]);

  const accentColor = accentColorFor(activeTab);

  return (
    <div
      ref={sectionRef}
      className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-12 xl:gap-16"
    >
      {/* LEFT: whichever form is currently selected. Stacks below the
          selector on mobile; sits to the left of it from the lg breakpoint. */}
      <div className="relative order-2 overflow-hidden rounded-card border border-turmeric/40 bg-ivory p-5 shadow-card sm:p-8 lg:order-1">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1 transition-colors duration-300"
          style={{ backgroundColor: accentColor }}
        />

        <div
          id={`${idBase}-panel-business`}
          role="region"
          aria-label="Business Enquiry form"
          hidden={activeTab !== "business"}
        >
          {activeTab === "business" && (
            <BusinessEnquiryForm data={businessData} onChange={setBusinessData} />
          )}
        </div>

        <div
          id={`${idBase}-panel-general`}
          role="region"
          aria-label="General Enquiry form"
          hidden={activeTab !== "general"}
        >
          {activeTab === "general" && (
            <GeneralEnquiryForm data={generalData} onChange={setGeneralData} />
          )}
        </div>

        <div
          id={`${idBase}-panel-sample`}
          role="region"
          aria-label="Sample Request form"
          hidden={activeTab !== "sample"}
        >
          {activeTab === "sample" && (
            <SampleRequestForm data={sampleData} onChange={setSampleData} />
          )}
        </div>
      </div>

      {/* RIGHT: the enquiry-type selector, plus email/phone as a quieter,
          supplementary option underneath it. Sticky on desktop so it stays
          reachable while a long form scrolls past. */}
      <div className="order-1 lg:order-2 lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-card border border-turmeric/40 bg-ivory-deep/50 p-5 sm:p-6">
          <p className="eyebrow">How can we help?</p>

          <div role="group" aria-label="Choose an enquiry type" className="mt-4 divide-y divide-turmeric/20">
            {ENQUIRY_OPTIONS.map((option) => {
              const selected = activeTab === option.id;
              const dotColor = accentColorFor(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={selected}
                  aria-controls={`${idBase}-panel-${option.id}`}
                  onClick={() => setActiveTab(option.id)}
                  className={`block w-full rounded-lg px-3 py-4 text-left transition-colors first:pt-1 last:pb-1 ${
                    selected ? "bg-ivory" : "hover:bg-ivory/70"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 shrink-0 rounded-full border-2 transition-colors"
                      style={{
                        borderColor: selected ? dotColor : "var(--brand-turmeric)",
                        backgroundColor: selected ? dotColor : "transparent",
                      }}
                    />
                    <span
                      className={`font-serif text-lg transition-colors sm:text-xl ${
                        selected ? "text-earth" : "text-earth/80"
                      }`}
                    >
                      {option.label}
                    </span>
                  </span>
                  <p className="mt-1.5 pl-[1.375rem] text-sm leading-6 text-earth-muted sm:text-base sm:leading-7">
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Supplementary, de-emphasised: not styled as its own card so it
            never competes with the enquiry forms or the selector above. */}
        <div className="mt-6 px-1">
          <p className="eyebrow">Prefer to talk directly?</p>
          <div className="mt-3 space-y-1.5 text-sm">
            <a
              href={`mailto:${company.email}`}
              className="block font-medium text-spice underline-offset-4 hover:underline"
            >
              {company.email}
            </a>
            <a
              href={company.phone.href}
              className="block font-medium text-spice underline-offset-4 hover:underline"
            >
              {company.phone.display}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
