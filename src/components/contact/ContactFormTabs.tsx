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

type TabId = "business" | "general" | "sample";

/**
 * Product pages link here as `/contact?enquiry=business&product=<id>` (or
 * `sample`) so a customer who clicked "Business Enquiry" / "Sample Request"
 * on a product lands straight on the matching form with that product
 * already selected, instead of starting from a blank General Enquiry.
 */
function readInitialTab(searchParams: URLSearchParams): TabId {
  const enquiry = searchParams.get("enquiry");
  return enquiry === "business" || enquiry === "sample" ? enquiry : "general";
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

  // Customers land directly on the General Enquiry form — it needs no button
  // of its own. The two prominent buttons below switch to the specialised
  // Business Enquiry / Sample Request forms instead (or a product page can
  // deep-link straight into one of them, see readInitialTab above).
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const idBase = useId();
  const formCardRef = useRef<HTMLDivElement>(null);

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

  // Arriving already deep-linked to a specific form should feel the same as
  // clicking its button -- scroll the form card into view, once, on load.
  useEffect(() => {
    if (initialTab !== "general") {
      formCardRef.current?.scrollIntoView({ block: "start" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectTab(tab: TabId) {
    setActiveTab(tab);
    formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const panelId = `${idBase}-panel-${activeTab}`;

  // A thin colour accent along the top of the form card echoes whichever
  // entry point is active, so switching forms reads as a deliberate shift
  // rather than the same grey box relabelling itself.
  const accentColor =
    activeTab === "business"
      ? "var(--brand-spice)"
      : activeTab === "sample"
        ? "var(--brand-indigo)"
        : "var(--brand-turmeric)";

  return (
    <div>
      {/* The two primary, equally reachable ways in: Business Enquiry (chilli-red,
          most prominent) and Sample Request (peacock blue). General Enquiry needs
          no button here — it's what customers see by default below. */}
      <p className="eyebrow mx-auto justify-center">Choose how to connect</p>

      <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:justify-center sm:gap-8">
        <div className="flex w-full flex-col items-center gap-2 sm:w-auto">
          <button
            type="button"
            aria-pressed={activeTab === "business"}
            aria-controls={panelId}
            onClick={() => selectTab("business")}
            className="btn btn-primary min-h-14 w-full px-8 text-sm sm:w-auto sm:text-base"
          >
            Business Enquiry
          </button>
          <p className="text-center text-xs text-earth-muted">
            For retailers, wholesalers &amp; distributors
          </p>
        </div>

        <div className="flex w-full flex-col items-center gap-2 sm:w-auto">
          <button
            type="button"
            aria-pressed={activeTab === "sample"}
            aria-controls={panelId}
            onClick={() => selectTab("sample")}
            className="btn btn-indigo min-h-14 w-full px-8 text-sm sm:w-auto sm:text-base"
          >
            Sample Request
          </button>
          <p className="text-center text-xs text-earth-muted">
            Try a product before you order
          </p>
        </div>
      </div>

      <div
        ref={formCardRef}
        className="relative mt-8 scroll-mt-24 overflow-hidden rounded-card border border-turmeric/40 bg-ivory p-5 shadow-card sm:p-8"
      >
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1 transition-colors duration-300"
          style={{ backgroundColor: accentColor }}
        />
        {activeTab !== "general" && (
          <button
            type="button"
            onClick={() => selectTab("general")}
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-earth-muted underline-offset-4 transition-colors hover:text-spice hover:underline"
          >
            <span aria-hidden="true">←</span>
            Prefer a quick general enquiry instead?
          </button>
        )}

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
    </div>
  );
}
