"use client";

import { useId, useState } from "react";
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

const TABS: { id: TabId; label: string }[] = [
  { id: "business", label: "Business Enquiry" },
  { id: "general", label: "General Enquiry" },
  { id: "sample", label: "Sample Request" },
];

export default function ContactFormTabs() {
  const [activeTab, setActiveTab] = useState<TabId>("business");
  const idBase = useId();

  // Each form keeps its own independent state here, so switching tabs never
  // loses what the customer has already entered in another form.
  const [businessData, setBusinessData] = useState<BusinessEnquiryFormData>(emptyBusinessEnquiry);
  const [generalData, setGeneralData] = useState<GeneralEnquiryFormData>(emptyGeneralEnquiry);
  const [sampleData, setSampleData] = useState<SampleRequestFormData>(emptySampleRequest);

  return (
    <div className="rounded-card border border-turmeric/40 bg-ivory shadow-card">
      <div role="tablist" aria-label="Enquiry type" className="flex flex-wrap gap-2 border-b border-turmeric/30 p-3 sm:gap-3 sm:p-4">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          const tabId = `${idBase}-tab-${tab.id}`;
          const panelId = `${idBase}-panel-${tab.id}`;
          return (
            <button
              key={tab.id}
              id={tabId}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={panelId}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex min-h-11 flex-1 items-center justify-center rounded-full px-4 text-xs font-semibold uppercase tracking-[0.1em] transition-colors sm:flex-none sm:px-6 sm:text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-turmeric ${
                isActive
                  ? "bg-green text-ivory shadow-card"
                  : "bg-transparent text-earth-muted hover:bg-ivory-deep hover:text-earth"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="p-5 sm:p-8">
        <div
          id={`${idBase}-panel-business`}
          role="tabpanel"
          aria-labelledby={`${idBase}-tab-business`}
          hidden={activeTab !== "business"}
        >
          {activeTab === "business" && (
            <BusinessEnquiryForm data={businessData} onChange={setBusinessData} />
          )}
        </div>

        <div
          id={`${idBase}-panel-general`}
          role="tabpanel"
          aria-labelledby={`${idBase}-tab-general`}
          hidden={activeTab !== "general"}
        >
          {activeTab === "general" && (
            <GeneralEnquiryForm data={generalData} onChange={setGeneralData} />
          )}
        </div>

        <div
          id={`${idBase}-panel-sample`}
          role="tabpanel"
          aria-labelledby={`${idBase}-tab-sample`}
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
