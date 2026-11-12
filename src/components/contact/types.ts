// Shared types for the Contact page enquiry forms.

export type QuantityUnit = "kg" | "g" | "tonnes" | "packs";

export type SelectedProduct = {
  id: string;
  name: string;
  category: string;
  /** Quantity as a free-text string so the field can be empty while editing. */
  quantity: string;
  unit: QuantityUnit;
};

export type BusinessType =
  | "Distributor"
  | "Wholesaler"
  | "Retailer"
  | "Supermarket / Grocery Chain"
  | "Restaurant / Hotel / Catering"
  | "Export / International Buyer"
  | "Private Label / Manufacturing"
  | "Other Business";

export const BUSINESS_TYPES: BusinessType[] = [
  "Distributor",
  "Wholesaler",
  "Retailer",
  "Supermarket / Grocery Chain",
  "Restaurant / Hotel / Catering",
  "Export / International Buyer",
  "Private Label / Manufacturing",
  "Other Business",
];

export type EnquiryType =
  | "Product Information"
  | "Pricing Enquiry"
  | "Order Related"
  | "Product Availability"
  | "Feedback or Complaint"
  | "Other";

export const ENQUIRY_TYPES: EnquiryType[] = [
  "Product Information",
  "Pricing Enquiry",
  "Order Related",
  "Product Availability",
  "Feedback or Complaint",
  "Other",
];

export type CustomerType =
  | "Individual Customer"
  | "Retailer"
  | "Distributor"
  | "Wholesaler"
  | "Restaurant / Hotel"
  | "Other Business";

export const CUSTOMER_TYPES: CustomerType[] = [
  "Individual Customer",
  "Retailer",
  "Distributor",
  "Wholesaler",
  "Restaurant / Hotel",
  "Other Business",
];

export type BusinessEnquiryFormData = {
  contactPerson: string;
  businessName: string;
  businessEmail: string;
  mobileNumber: string;
  businessType: BusinessType | "";
  businessLocation: string;
  website: string;
  gstin: string;
  selectedProducts: SelectedProduct[];
  message: string;
};

export type GeneralEnquiryFormData = {
  fullName: string;
  companyName: string;
  email: string;
  mobileNumber: string;
  enquiryType: EnquiryType | "";
  subject: string;
  message: string;
};

export type SampleRequestFormData = {
  fullName: string;
  companyName: string;
  email: string;
  mobileNumber: string;
  customerType: CustomerType | "";
  selectedProducts: SelectedProduct[];
  address: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
  message: string;
};

export const emptyBusinessEnquiry: BusinessEnquiryFormData = {
  contactPerson: "",
  businessName: "",
  businessEmail: "",
  mobileNumber: "",
  businessType: "",
  businessLocation: "",
  website: "",
  gstin: "",
  selectedProducts: [],
  message: "",
};

export const emptyGeneralEnquiry: GeneralEnquiryFormData = {
  fullName: "",
  companyName: "",
  email: "",
  mobileNumber: "",
  enquiryType: "",
  subject: "",
  message: "",
};

export const emptySampleRequest: SampleRequestFormData = {
  fullName: "",
  companyName: "",
  email: "",
  mobileNumber: "",
  customerType: "",
  selectedProducts: [],
  address: "",
  city: "",
  state: "",
  pinCode: "",
  country: "India",
  message: "",
};
