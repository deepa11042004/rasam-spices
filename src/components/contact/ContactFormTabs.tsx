"use client";

import { useId, useRef, useState } from "react";
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
} from "./types";

type TabId = "business" | "general" | "sample";

export default function ContactFormTabs() {
  // Customers land directly on the General Enquiry form — it needs no button
  // of its own. The two prominent buttons below switch to the specialised
  // Business Enquiry / Sample Request forms instead.
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const idBase = useId();
  const formCardRef = useRef<HTMLDivElement>(null);

  // Each form keeps its own independent state here, so switching between
  // them never loses what the customer has already entered elsewhere.
  const [businessData, setBusinessData] = useState<BusinessEnquiryFormData>(emptyBusinessEnquiry);
  const [generalData, setGeneralData] = useState<GeneralEnquiryFormData>(emptyGeneralEnquiry);
  const [sampleData, setSampleData] = useState<SampleRequestFormData>(emptySampleRequest);

  function selectTab(tab: TabId) {
    setActiveTab(tab);
    formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const panelId = `${idBase}-panel-${activeTab}`;

  return (
    <div>
      {/* The two primary, equally reachable ways in: Business Enquiry (chilli-red,
          most prominent) and Sample Request (peacock blue). General Enquiry needs
          no button here — it's what customers see by default below. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
        <button
          type="button"
          aria-pressed={activeTab === "business"}
          aria-controls={panelId}
          onClick={() => selectTab("business")}
          className="btn btn-primary min-h-14 flex-1 px-8 text-sm sm:flex-none sm:text-base"
        >
          Business Enquiry
        </button>
        <button
          type="button"
          aria-pressed={activeTab === "sample"}
          aria-controls={panelId}
          onClick={() => selectTab("sample")}
          className="btn btn-indigo min-h-14 flex-1 px-8 text-sm sm:flex-none sm:text-base"
        >
          Sample Request
        </button>
      </div>

      <div
        ref={formCardRef}
        className="mt-8 scroll-mt-24 rounded-card border border-turmeric/40 bg-ivory p-5 shadow-card sm:p-8"
      >
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
